# DNS request: authorise campaign email for bobjohnsonauto.com

**For:** Bob Johnson Auto Group IT
**Domain:** `bobjohnsonauto.com`
**Requested by:** Kovara / DriveOne

---

## This is not the SMTP request

State this first, because the recipient has already declined something and will read this
as a second attempt at the same thing. It is not.

Declining SMTP access was the correct call — a standing credential into the mail system is
exactly what an administrator should refuse. This request asks for no access of any kind.

## What this does NOT ask for

- **No access to any mailbox.** Nobody gains the ability to read, send from, or sign in to
  a Microsoft 365 account.
- **No app registration, no OAuth consent, no admin approval in Microsoft.**
- **No change to how your existing mail flows.** Inbound and outbound mail through
  Microsoft 365 is untouched.
- **No credential is issued to us at all.**

For scale: an OAuth app registration, of the kind already in place for their existing
system, grants an application standing permission against the tenant. DNS records grant
permission to nothing. They are public entries in the same category as the record already
pointing their mail at Microsoft, and all they say is that one named platform may sign
messages for the domain.

## What this is

We are sending a customer follow up email series on the dealership's behalf, from
`Northcountryrecalls@bobjohnsonauto.com`. Without these records, receiving servers see mail
claiming to come from a domain that has not authorised it, and treat it as spoofing: the
mail lands in spam, and a run of unauthenticated mail claiming the domain does its
reputation no favours either.

That authorisation is four DNS records. **Nothing else is required from them.**

---

## ⚠️ The one thing that could cause a problem

**Do not modify or replace your existing SPF record.**

Your root domain almost certainly has an SPF record today that looks something like:

```
v=spf1 include:spf.protection.outlook.com -all
```

**Leave it exactly as it is.** A domain may only have one SPF record. If a second one is
added to the root, SPF fails for the whole domain and your normal business email starts
landing in spam.

None of the records below touch it. The SPF entries in this request go on a **`send`
subdomain** that does not exist yet, which is precisely why the request is structured this
way.

---

## The four records

The **Name** column is shown in the short form most DNS panels expect. If your panel wants
the fully qualified name instead, use the value in the second column. Do not enter both.

### 1. DKIM signing key

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `resend._domainkey` |
| Fully qualified | `resend._domainkey.bobjohnsonauto.com` |
| TTL | Auto / default |

Value (single line, no spaces or line breaks):

```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEBOW3hHfo5XeYmMw3V8VGc6Mk/6+M7+WGZ/fo0h37ArcEGh4xW/dgId8sM9rBiWZCiptWyM4UBxPwwe41yNlkBi5t6SJSWc0NG+J0oU31/KOIMMpl6aURTplF10ryABdEA/aE9zvWauBAbU4rgx/tZ9Y+bf0L67nqvQVSw3QMmwIDAQAB
```

### 2. Return-Path mail exchanger

| Field | Value |
|---|---|
| Type | `MX` |
| Name | `send` |
| Fully qualified | `send.bobjohnsonauto.com` |
| Value | `feedback-smtp.us-east-1.amazonses.com` |
| Priority | `10` |
| TTL | Auto / default |

This is on the `send` subdomain and does not affect the MX records that deliver your normal
mail.

### 3. SPF for the Return-Path subdomain

| Field | Value |
|---|---|
| Type | `TXT` |
| Name | `send` |
| Fully qualified | `send.bobjohnsonauto.com` |
| Value | `v=spf1 include:amazonses.com ~all` |
| TTL | Auto / default |

This is the record people sometimes mistakenly add to the root domain. It belongs on
`send`, not on `bobjohnsonauto.com`.

### 4. Sending endpoint

| Field | Value |
|---|---|
| Type | `CNAME` |
| Name | `rsend` |
| Fully qualified | `rsend.bobjohnsonauto.com` |
| Value | `send.forge.rmta.net` |
| TTL | Auto / default |

---

## Common mistakes

- **Doubling the domain.** Some panels append the domain automatically. Entering
  `resend._domainkey.bobjohnsonauto.com` in a panel that already appends it produces
  `resend._domainkey.bobjohnsonauto.com.bobjohnsonauto.com`, which will not verify.
- **The DKIM value wrapping.** It must be one unbroken string. Copying from a formatted
  document can introduce spaces or line breaks.
- **Adding a second root SPF record.** See the warning above. This is the only change here
  that could affect your existing mail, and none of these records require it.

---

## When it is done

Reply to confirm and we will run verification, which takes a few minutes once DNS has
propagated. No further action is needed from you after that.

If anything above conflicts with an existing record, please tell us rather than overwriting
it, and we will work out the right merge together.

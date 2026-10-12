# Video: "The part you stopped on"

Purpose: show the Budco payment step, on a phone, in real time, so a customer who stalled
on that screen sees it take half a minute. Goes in E2 of the Finish Your Payment series
(and later, as a test arm, E1). Nowhere else.

Format: vertical 9:16, 1080 x 1920, 30 to 40 seconds, captions burned in, voiceover
optional. Published as a YouTube Short on @driveonedirect, unlisted is fine; the email
links to it directly.

## Rules

- Real time. No speed ramps. The length is the message.
- Use a test card or a sandbox checkout. Never show a card number, CVV, expiration, or a
  filled customer name field. If the form must be filled on camera, type into a test
  account and keep the camera framed so digits are not legible.
- The screen is the hero. No talking head. Hands are fine.
- Nothing in the video says the customer is covered until the confirmation screen appears.
- No em dashes or en dashes in captions. No exclamation points. Never the word warranty.
- Brand on screen and in text: DriveOne Direct.

## Shot list and captions

| Time | On screen | Caption (burned in, bottom third) |
|---|---|---|
| 0:00 to 0:03 | The signed contract screen the customer last saw, on a phone, held in a hand. Thumb hovers. | The part you stopped on. |
| 0:03 to 0:06 | Thumb taps Continue to payment. Budco page loads. | This is the whole thing. Real time. |
| 0:06 to 0:16 | Card fields filled (test card, digits not legible). No cuts. | Card. Expiration. Zip. That is the form. |
| 0:16 to 0:22 | Review screen: down payment today, monthly amount, 0% APR. Thumb pauses on it. | 0% APR. No finance charge. No credit check. |
| 0:22 to 0:26 | Thumb taps Confirm. Spinner. | Nobody calls. Nobody checks with a manager. |
| 0:26 to 0:31 | Confirmation screen. The You are covered email arrives as a notification at the top. | Done. 31 seconds. |
| 0:31 to 0:36 | Hold on the confirmation. Small DriveOne Direct wordmark bottom corner. | DriveOne Direct. Finish yours from the link in the email. |

The timings assume a 31 second checkout. If the real one runs longer, the captions move
and the "31 seconds" line changes to the true number. Do not say a number the video does
not show.

## Voiceover (optional, 70 words, flat and dry)

"You stopped here. Fair. It was late, or something rang, or the form looked longer than
it is. So here is the form, at real speed, no cuts. Card, expiration, zip. The review
screen, with the 0% plan you already picked. Confirm. That is it. Nobody is going to call
you about this. The link in your email opens this exact screen. Thirty one seconds. Go."

## YouTube

Title: The part you stopped on: finishing a DriveOne Direct payment in 31 seconds

Description:

The payment step for a DriveOne Direct vehicle service contract, recorded in real time on
a phone. No cuts. If you signed and did not finish, the link in your email reopens this
exact screen.

Questions about the payment plan: Budco Financial Services, 888-352-7901.
Questions about coverage or claims: Ascent Administration Services, 866-660-7003.

A vehicle service contract is not insurance and not a manufacturer's warranty.
Administered by Ascent Administration Services, LLC; insured by Old Republic Insurance
Company (A+ rated by AM Best). Coverage, price and terms vary by state and are subject to
limits and exclusions; see your contract for the complete list of covered components and
exclusions. Not available in California. Cancel anytime: full refund within 30 days if no
claim has been paid; prorated after, less any paid claims and a cancellation fee where
permitted by your state. Coverage is not active until your payment is completed.

Tags: DriveOne Direct, vehicle service contract, extended service contract, 0% payment
plan, online checkout

The disclaimer above is the email footer block, verbatim, plus the "not active until
paid" sentence that the series already carries. It also goes on screen as a 3 second end
card in legal-size type if the video runs on paid placements; for the email link, the
description is sufficient.

## In the email

E2 carries a `video` block in `copy/campaign.json` with an empty `url`. The build skips
the card while `url` is empty, so E2 ships today without it. When the Short is published:

1. Set `url` to the Short link and `thumb` to `https://i.ytimg.com/vi/<id>/hqdefault.jpg`.
2. `node build.mjs`.
3. Update the Resend template for E2 (fresh `text` body, re-publish).

Card copy, already in the deck:

- Eyebrow: THE PART YOU STOPPED ON
- Title: The payment step, in real time
- Line: 31 seconds on a phone. No cuts. This is the screen the link below opens.
- Link: Watch it first

Test: E2 with the card vs. without, judged on payment completion inside 72 hours of E2.

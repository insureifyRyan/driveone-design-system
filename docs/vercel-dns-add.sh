# Vercel CLI — run from anywhere, one record per command.
# `vercel dns add` ADDS a single record. It does not rewrite the zone,
# so the root MX, SPF, DMARC and Google DKIM are untouched.
#
# npx vercel login      (once)
# npx vercel switch     (pick the team that owns driveoneprogram.com)

# ---------- ferrario ----------
npx vercel dns add driveoneprogram.com resend._domainkey.ferrario TXT "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCcsyVSBB1M4tw6NpqRQ/mpFyrQsit5pYIB7dD/I1H6ggg46MtYrn15jLEDOU0gQKG1DjaadL9QqD1wK88+vRcadSpss8Bl9MdzagjRhS3/fSq9JCpW3/l8EBarX3IUUi85d8mbNVTY7k7RvRQ3eDeEbQ1WQRPmmIp3kStP10isQIDAQAB"
npx vercel dns add driveoneprogram.com send.ferrario MX feedback-smtp.us-east-1.amazonses.com 10
npx vercel dns add driveoneprogram.com send.ferrario TXT "v=spf1 include:amazonses.com ~all"
npx vercel dns add driveoneprogram.com rsend.ferrario CNAME send.forge.rmta.net

# ---------- bobjohnson ----------
npx vercel dns add driveoneprogram.com resend._domainkey.bobjohnson TXT "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD34MJ/u500ZVtUN98K/UsaTILlBnyMStWUfnbMtSvIIqQj+a7f0pJgDHY1b3heIiEObsgD/CjkbzRbVVArjhM4i32OXtdH9ktav9rUM+scClstIhkjT/GoQAvNP04ofU4lDbR8286+sKfK+adMRYLFS4G92juMnHKuV4ARvXAQmwIDAQAB"
npx vercel dns add driveoneprogram.com send.bobjohnson MX feedback-smtp.us-east-1.amazonses.com 10
npx vercel dns add driveoneprogram.com send.bobjohnson TXT "v=spf1 include:amazonses.com ~all"
npx vercel dns add driveoneprogram.com rsend.bobjohnson CNAME send.forge.rmta.net

# Verify additively, never from the dashboard table:
#   npx vercel dns ls driveoneprogram.com
# then confirm against the authoritative nameservers before trusting it.

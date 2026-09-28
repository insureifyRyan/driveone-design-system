# Email design system

Read this when changing the template, the checkout card, or a dealership's branding.

## Co-brand balance

The send goes out **as the dealership**, so their colour carries the layout and DriveOne
reads as the provider rather than the sender.

`brandLead.mode` in the dealer file does this. Set to `dealer`, every structural accent
resolves to their colour: hero rule and eyebrow, the headline accent phrase, the card
ground and hairline, feature row icons, the benefit strip rule, and the call to action. The
hero ground becomes their dark tone. DriveOne cyan then appears exactly once, in the
provider lockup. Set it to `driveone` and the whole system flips back.

Resolution happens in one object (`A`) in `email/build.mjs`. Components read `A.accent`,
`A.accentDark`, `A.onAccent`, `A.soft`, `A.ground` and never a raw colour. That is what
keeps one accent value in the file.

Two golds once shipped together because the wordmark carried its own `ruleColor` override.
If a component needs a colour, it takes it from `A`, not from config.

Small caps at 9px need a darkened accent. Gold at label size on white does not carry enough
contrast, hence `accentDark`.

## Logos are type

Both lockups are built from type rather than hosted images.

A hosted file cannot be verified from a sandboxed environment, and it does not render when
the client blocks images, which is a large share of opens. Type is controlled exactly and
always renders.

- **Dealer:** heavy italic wordmark, a two segment accent rule, descriptor letterspaced
  beneath, right aligned. Specify a **web safe** face. Asking for a font the client cannot
  load means silently falling back to something much lighter and wider, which is what made
  an early version look wrong.
- **DriveOne:** lowercase `drive` in the brand's near black plus `one` in Brand Cyan, small
  trademark, over `VEHICLE SERVICE CONTRACT`. The D mark is a drawn shape and cannot be
  reproduced reliably in email HTML, so the header carries a legitimate reduced lockup.

`logo.useImage` switches a dealer to a hosted file. Verify it actually loads at the
configured width first.

## The checkout card

The card is a commerce unit, not an information box. Order, top to bottom:

1. Tinted header: plan name, the customer's vehicle, the visit date and mileage.
2. Order summary: Coverage added, Due today, a hairline, then Then monthly with the figure
   set large and right aligned.
3. Buy now.
4. Reassurance row: secure checkout, 0% payment plan, no credit check, 30 day money back.

Every reassurance claim is contract backed. It says payment plan rather than APR on purpose,
because this is not a loan and must not be described as one.

The price is above the fold in all ten emails and requires no click, which is the point:
a real number for their car beats a "starting at".

Coverage reads as **additive**, "60 more months, 75,000 more miles". A ceiling phrasing
reads as already spent to a customer who is past that mileage, which is exactly this
audience.

The figure shown is the **cheapest** financed option, so the copy says so and points to
longer terms and the unlimited mileage plan. Pairing the lowest price with the best
coverage tier would be a bait.

## Email-safe construction

This is email, not web:

- 600px table layout, inline styles, MSO conditionals.
- Purchase buttons are VML for Outlook and a padded anchor elsewhere, from a single
  `buyButton` helper so the card and the foot cannot drift apart.
- `white-space:nowrap` on the price so Outlook cannot break the number off its `/mo`.
- Hidden preheader padded with whitespace so clients do not leak body copy into the preview.
- Forced light colour scheme, or dark-mode clients invert the palette.
- Mobile breakpoint at 620px, 16px side gutters.
- Solid grounds, not gradients, which Outlook does not render.
- Around 19KB per email against Gmail's 102KB clipping threshold.

## The personalization card is the point

A generic VSC blast cannot say "your 2021 Equinox, serviced on the 19th, at 61,400 miles,
$66.47 a month". That specificity is the entire reason this converts better than a blast,
so protect it: never let a merge tag degrade to a blank, and never let the price be a guess.

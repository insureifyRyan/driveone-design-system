# DriveOne Direct email components

The shared parts of every DriveOne Direct email: the welcome email in the app, the
abandoned quote drip in Resend, and the Finish Your Payment series in this repo. Three
places render these. This is the one spec. Values come from `brand/driveone-direct.tokens.json`;
the names in brackets are the token keys.

Rules that apply to every component:

- Table layout, inline styles, no webfonts, no JavaScript, no background images.
- 600px card [layout.emailWidth] on a paper page [color.paper], 32px gutter [layout.gutter],
  outer radius 16 [layout.radiusOuter], inner radius 14 [layout.radius].
- Body face is Helvetica, Arial, sans-serif [font.body]. Values and contract numbers are
  mono [font.mono]. Nothing else is mono.
- No em dashes, no en dashes, no exclamation points, never the word warranty.
- Brand is written DriveOne Direct. In the wordmark: Drive and Direct in white, One in cyan.

## 1. Header

Ink strip [color.ink], centered. Wordmark 22px / 800 / tracking -0.01em [type.wordmark], followed by a 9px superscript TM in inkMuted [brand.wordmarkMark].
Descriptor beneath it: 9px / 600 / tracking 0.22em, mutedText on ink [type.descriptor],
reads EXTENDED SERVICE CONTRACT [brand.productDescriptor]. Padding 26px 32px.

```html
<tr><td bgcolor="#0E1B2C" align="center" style="background-color:#0E1B2C;padding:26px 32px">
  <div style="font-family:Helvetica,Arial,sans-serif;font-weight:800;font-size:22px;line-height:1;color:#FFFFFF;letter-spacing:-0.01em">Drive<span style="color:#1FBFEC">One</span>Direct<sup style="font-size:9px;font-weight:600;line-height:0;vertical-align:super;color:#A9BACB;padding-left:1px">&trade;</sup></div>
  <div style="font-family:Helvetica,Arial,sans-serif;font-weight:600;font-size:9px;line-height:1;color:#8A99B5;letter-spacing:0.22em;padding-top:8px">EXTENDED SERVICE CONTRACT</div>
</td></tr>
```

Do: keep it centered and keep the descriptor. Don't: add a logo image, a tagline, or a
nav row. Don't left align it (the drip's E1 does; that is the drift, not the standard).

## 2. Eyebrow and headline

Eyebrow: 10px / 700 / tracking 0.16em, cyanDark on white [type.eyebrow, color.cyanDark].
Headline: 27px / 700 / line 1.25 / tracking -0.02em, ink [type.headline]. Three lines max,
hard breaks chosen by hand so the line ends land on a beat. 30px above the eyebrow, 14px
between eyebrow and headline.

Do: write the eyebrow as a label (THE DEDUCTIBLE, THE LAST ONE). Don't: put a sentence in
it, or a variable. Don't let the headline run past three lines on a 600px card.

## 3. Body paragraph

15px / 400 / line 1.65, bodyText [type.body, color.bodyText]. 16px above the first
paragraph, 14px between paragraphs. Two or three sentences each. `<strong>` on the vehicle
the first time it appears and nowhere else.

## 4. Info card (label / value)

The "Your coverage" block from the welcome email. Fill cardFill [color.cardFill], radius 14,
one row per fact, rows separated by a 1px rule [color.rule]. Label on the left: 14px / 400
bodyText [type.cardLabel]. Value on the right, right aligned: 13px / 700 mono ink
[type.cardValue]. Cell padding 13px vertical, 18px outer edge. A 10px / 700 / tracking
0.16em ink title sits 10px above the card.

Variant: **numbered steps.** When the first cell is a single digit it renders as a step
number (14px / 800 cyanDark) and the second cell becomes a left aligned sentence in
bodyText. Use for a process (how a claim goes). Never mix the two variants in one card.

Do: three to four rows. Keep values short enough to sit on one line at 600px. Don't: put a
paragraph in a value cell, use the card for marketing copy, or stack two cards.

## 5. Hero number box

The "Your payments" block from the welcome email, made into an event. Ink fill, radius 14,
padding 24px 26px [layout.heroPadding]. Four lines, top to bottom:

| Line | Style | Example |
|---|---|---|
| label | 11px / 600 / tracking 0.14em, mutedText | TO FINISH IT |
| big | 36px / 800 / line 1.1 / tracking -0.03em, cyan [type.heroNumber] | $94.95 today |
| sub | 13px / 600 / line 1.5, white | then $60.13 a month for 30 months |
| fine | 12px / 400 / line 1.6, inkMuted [color.inkMuted] | 0% APR. No finance charge. |

One per email. It is the one place the payment appears as a number; it should feel like
an event, not wallpaper. The big line is a money figure or a short money phrase, never a
sentence.

## 6. Button

Pill [layout.radiusPill], cyan fill, ink text, 15px / 700 [type.button], padding 15px 30px
[layout.buttonPadding], `display:inline-block`. Text ends with `&rarr;`. 22px above, then a
12px / 400 mutedText note beneath [type.caption] saying where the link goes.

One primary button per email. Email clients have no hover state; do not design for one.
Don't: full width buttons, two buttons, a secondary ghost button, or a button with a
sentence on it.

## 7. Callout (tint card)

The light blue "Stuck on the road?" box from the welcome email. cyanSoft fill
[color.cyanSoft], radius 14, padding 16px 20px, 14px / 400 bodyText. Used for the P.S. line
in the series and for the roadside note in the welcome email. One per email, after the
button, never before it.

## 8. Dark help strip

Ink strip, padding 26px 32px. Bold 13px white title, then 13px / 400 inkMuted body with
phone numbers as cyan `tel:` links (700 weight, no underline). Carries the two numbers:
Budco payments [brand.phones.budcoPayments] and Ascent claims
[brand.phones.ascentClaims]. Always says that neither will sell you anything.

## 9. Legal footer

Paper fill, padding 22px 32px 30px. 11px / 400 / line 1.65 legalText [type.legal]. Blocks in
order, 10 to 12px apart: disclaimer paragraph, entity and postal line
[brand.entity, brand.postal], Privacy · Terms · YouTube · Unsubscribe links in
legalText (YouTube carries UTMs: source email, medium the series name), then the contract and reference line. The disclaimer text is approved copy;
change it only with sign off.

## 10. Preheader

Hidden div immediately after `<body>`: `display:none;font-size:1px;color:<paper>;
line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden`, followed by 18
repetitions of `&#8204;&nbsp;` so the inbox does not scrape the eyebrow. 40 to 90
characters. Complements the subject; never repeats it.

## Where each component lives today

| Component | App welcome email | Resend drip (dod-abandon) | Finish Your Payment |
|---|---|---|---|
| Header | yes | yes, left aligned (drift) | yes |
| Eyebrow + headline | no eyebrow | yes | yes |
| Info card | yes (coverage, payments) | no | yes |
| Hero number box | no (uses info card) | yes | yes |
| Button | not in the screenshot | yes | yes |
| Callout | yes (roadside) | no | yes (P.S.) |
| Dark help strip | no | yes | yes |
| Legal footer | yes | yes | yes |

When the next email surface is built, it reads `brand/driveone-direct.tokens.json` and this file.
It does not copy hex values from another template.

## 11. Video card (optional)

A bordered card [color.rule, radius 14] after the callout and before the dark strip. Left
cell: 162 x 122 thumbnail, radius 10, ink background behind it so a blocked image still
reads as a tile. Right cell: 10px / 700 / tracking 0.14em cyanDark eyebrow, 15px / 700 ink
title, 13px / 400 bodyText line, then a 13px / 700 cyanDark link with a play glyph. Both
the image and the link go to the video with UTMs. One per email, never above the primary
button, caption always in our voice (the YouTube title is not copy). Currently used in
Finish Your Payment E9 only, as an A/B arm.

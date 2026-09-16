---
category: Forms
---

# TextField

Single-line input with the Kōvara field scaffolding built in.

## Rules
- Use `mono` for machine identifiers — VIN, policy number, claim ID, account number. Tabular glyphs make transcription errors visible.
- Put units and currency in `startAdornment`/`endAdornment` rather than in the placeholder.
- Placeholders show format, never the label.

## Example
```tsx
<TextField label="VIN" mono placeholder="1HGCM82633A004352" hint="17 characters" />
<TextField label="Vehicle price" startAdornment="$" defaultValue="34,995" />
<TextField label="Email" type="email" error="Enter a valid email address" defaultValue="marcus@" />
```

---
category: Forms
---

# FormField

Label, hint and error scaffolding for any control.

## When to use
`TextField`, `Textarea` and `Select` already use it internally. Reach for it directly when wrapping something else — a carrier date picker, a VIN scanner, a signature pad — so the label treatment and error semantics still match.

## Rules
- `error` replaces `hint` and gets `role="alert"`. Never show both.
- Mark `required` on the exceptions, or `optional` on forms that are mostly required — not both conventions in one form.

## Example
```tsx
<FormField label="Effective date" htmlFor="eff" hint="Coverage starts 12:01am local time" required>
  <input id="eff" type="date" className="kv-input kv-input--md" />
</FormField>
```

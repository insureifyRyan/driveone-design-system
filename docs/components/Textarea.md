---
category: Forms
---

# Textarea

Multi-line text — adjuster notes, coverage remarks, the instruction you give an agent.

## Rules
Resizes vertically only, so it never breaks a form column. Size `rows` to the expected answer: 3 for a note, 6+ for narrative.

## Example
```tsx
<Textarea label="Claim notes" rows={4} placeholder="What the insured reported…" hint="Visible to the adjuster and on the audit trail" />
```

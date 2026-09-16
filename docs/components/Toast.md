---
category: Feedback
---

# Toast

A transient confirmation of something that already happened.

## Rules
- Past tense and specific: "Policy bound", not "Success".
- Never put a required decision in one — they auto-dismiss.
- Render in a fixed bottom-right stack; one `action` maximum (usually Undo or View).

## Example
```tsx
<Toast tone="success" title="Policy bound" action={<Button variant="link" size="sm">View policy</Button>} onDismiss={() => {}}>
  KV-4471-0098 is in force as of today.
</Toast>
```

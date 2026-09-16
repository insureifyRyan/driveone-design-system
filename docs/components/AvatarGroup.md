---
category: Data display
---

# AvatarGroup

Overlapping avatars for a shared thing — producers on an account, adjusters on a claim, dealers in a program.

## Rules
Keep `max` at 3–5; past that the +N chip is more informative than more faces.

## Example
```tsx
<AvatarGroup
  max={4}
  size="sm"
  people={[{ name: 'Dana Whitfield' }, { name: 'Marcus Reyes' }, { name: 'Priya Raman' }, { name: 'Luis Ferrer' }, { name: 'Ana Castillo' }]}
/>
```

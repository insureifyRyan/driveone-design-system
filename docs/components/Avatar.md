---
category: Data display
---

# Avatar

A person or organization, with an initials fallback on the brand tints.

## Rules
- `square` for organizations — dealers, carriers, credit unions, agencies. Circles are people.
- Vary `tone` across a list so producers are distinguishable at a glance.
- `name` is required: it is the accessible label and the source of the initials.

## Example
```tsx
<Avatar name="Dana Whitfield" size="sm" />
<Avatar name="Centurion Mutual" square tone="accent" size="md" />
```

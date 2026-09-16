---
category: Actions
---

# ButtonGroup

Joins related buttons into one seam-free segmented control.

## When to use
- View switchers, date ranges, a split primary action.
- Give every child the same `variant` and `size` or the seam breaks.

## Example
```tsx
<ButtonGroup label="Pipeline view">
  <Button variant="secondary" size="sm">Quotes</Button>
  <Button variant="secondary" size="sm">Policies</Button>
  <Button variant="secondary" size="sm">Claims</Button>
</ButtonGroup>
```

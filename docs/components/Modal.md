---
category: Overlay
---

# Modal

A focused decision on top of the page.

## When to use
Bind confirmation, cancel-policy warning, a short form. Anything longer than a few fields belongs in a `Drawer` or its own page.

## Rules
- The title names the decision ("Bind this quote?"), not the screen.
- Footer actions: cancel first, the committing action last.
- Renders inline rather than through a portal, so place it at the root of the page tree when it must sit above everything.

## Example
```tsx
<Modal
  open
  title="Bind this quote?"
  description="This issues the contract and charges the dealer account."
  footer={<>
    <Button variant="secondary">Keep as draft</Button>
    <Button>Bind policy</Button>
  </>}
>
  Centurion Mutual · Platinum VSC · 36 months · $1,842 total
</Modal>
```

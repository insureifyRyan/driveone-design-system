---
category: Marketing
---

# ProductCard

A product in the Kōvara portfolio, as the public site presents it.

## When to use
Portfolio and overview pages — the line-up of Vista Warranty, DriveOne Direct, DriveOne Service,
DTC Powersports. Inside the app, a product a customer actually bought is a `PolicyRow` or a `Card`;
this component presents the line-up, it does not operate it.

## Rules
- `audience` states market and buyer together: "B2B · Insurance agencies", "B2C · Individual users".
  That pairing is what stops a portfolio page reading as an undifferentiated list.
- Roadmap entries use `status="coming-soon"` with a disabled action — never a live-looking CTA.
- The description leads with what the customer gets, not what the product is built on.

## Example
```tsx
<ProductCard
  name="Vista Warranty"
  audience="B2B · Insurance agencies"
  description="AI quoting and extended warranty for insurance agencies — same coverage as the dealer, about 60% less."
  status="live"
  action={<Button trailingIcon={<Icon name="arrow-right" />}>Open Vista</Button>}
/>
```

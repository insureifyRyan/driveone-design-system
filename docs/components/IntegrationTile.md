---
category: Platform
---

# IntegrationTile

One connected system — the carriers, DMS, core banking and CRM platforms Kōvara wires together.

## Rules
- Always show `lastSync`. For a connector, "when did this last actually work" is the only status anyone trusts.
- `status="lapsed"` means credentials expired — pair it with a Reconnect action, not a Configure one.
- `direction` matters operationally: two-way connectors write back into the customer's system of record.

## Example
```tsx
<IntegrationTile
  name="CDK Drive"
  description="Deal jackets and F&I product sales"
  status="active"
  lastSync="Synced 4 min ago"
  direction="bidirectional"
  action={<Button variant="secondary" size="sm">Configure</Button>}
/>
```

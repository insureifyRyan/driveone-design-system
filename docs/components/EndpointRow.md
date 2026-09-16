---
category: Developer
---

# EndpointRow

One route in an API reference.

## Rules
- Method chip colors are the conventional ones (GET cyan, POST green, PUT/PATCH amber, DELETE red)
  so a developer can scan a list without reading it. Do not re-map them.
- Wrap path params in braces — `/v1/policies/{policy_id}` — and they render tinted.
- Stack rows with `bare` inside a `Card padding="none"` to build a reference section.
- The description says what the endpoint does to the business object, not what it returns.

## Example
```tsx
<Card title="Quotes API" padding="none">
  <EndpointRow bare method="POST" path="/v1/quotes" description="Rate a contract across every appointed carrier" />
  <EndpointRow bare method="GET" path="/v1/quotes/{quote_id}" description="Retrieve a rated quote and its carrier responses" />
  <EndpointRow bare method="POST" path="/v1/quotes/{quote_id}/bind" description="Bind the selected option and issue the contract" />
</Card>
```

---
category: Platform
---

# QuoteCard

One priced option in a comparison set — the core unit of quoting and product sales.

## Rules
- Render two to four side by side. One option is not a comparison; five is a spreadsheet.
- Mark at most one `recommended`. That ribbon is how Kōvara's recommendation is distinguished from raw carrier output — spend it once.
- `aiGenerated` adds the "AI rated" chip. Use it only when the agent actually produced the rate.
- Prices are pre-formatted strings, including the currency symbol.

## Example
```tsx
<QuoteCard
  carrier="Centurion Mutual"
  product="Platinum Vehicle Service Contract"
  price="$118.40"
  term="/mo"
  recommended
  aiGenerated
  meta={['36 months', '$100 deductible', '75,000 mi']}
  features={['Powertrain + electronics', 'Nationwide claims network', 'Transferable to next owner']}
  actions={<>
    <Button variant="secondary" size="sm">Compare</Button>
    <Button size="sm">Send to customer</Button>
  </>}
/>
```

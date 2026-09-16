---
category: Data display
---

# StatCard

A single KPI — the row of tiles above the fold on a dashboard.

## Rules
- Pre-format `value` and `delta` at the call site. The component does no math and no locale formatting.
- `trend` is the judgement, not the arrow direction: for handle time or manual touches, a fall is good, so pass `trend="up"` only when up is genuinely good.
- Three to five tiles in a row. More than that and nothing is a headline.

## Example
```tsx
<StatCard label="Quotes issued" value="1,284" delta="+18.2%" trend="up" caption="vs. last 30 days" icon={<Icon name="file-text" size={18} />} />
<StatCard label="Warranty attach rate" value="31%" delta="+4.1 pts" trend="up" caption="Goal 40%" icon={<Icon name="shield" size={18} />} />
<StatCard label="Manual touches / deal" value="2.4" delta="-38%" trend="up" caption="Fewer is better" icon={<Icon name="zap" size={18} />} />
```

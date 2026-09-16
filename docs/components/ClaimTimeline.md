---
category: Platform
---

# ClaimTimeline

The chronological record of a claim, application or onboarding case.

## Rules
- Always name the `actor`. In AI-assisted claims the audit trail *is* the product: "who decided this" must never be ambiguous.
- Prefix agent actions with "Kōvara" ("Kōvara Voice", "Kōvara") — the component then shows the sparkles mark instead of the person glyph.
- One `active` event, at the front of the work still to do.

## Example
```tsx
<ClaimTimeline events={[
  { title: 'FNOL received', description: 'Inbound call, transcript attached', timestamp: 'Mar 12, 8:02am', actor: 'Kōvara Voice', state: 'done' },
  { title: 'Coverage verified', description: 'Contract KV-4471-0098 in force; $100 deductible applies', timestamp: 'Mar 12, 8:03am', actor: 'Kōvara', state: 'done' },
  { title: 'Estimate review', description: 'Assigned to Dana Whitfield', timestamp: 'Mar 12, 9:15am', actor: 'Dana Whitfield', state: 'active' },
  { title: 'Payment authorization', state: 'pending' },
]} />
```

---
category: Platform
---

# OnboardingSteps

The progress checklist for automated onboarding — a new dealer, credit union branch or agency going live.

## Rules
- Name the `owner` on every incomplete step. Onboarding stalls are almost always an ownership question, not a system one.
- Exactly one `current` step.
- `blocked` is for a step that cannot proceed, and its description must say what unblocks it.
- `orientation="horizontal"` for a wizard header; vertical for a checklist panel.

## Example
```tsx
<OnboardingSteps steps={[
  { title: 'Licensing verified', description: 'NIPR check cleared for OH, IN, KY', state: 'complete', owner: 'Kōvara' },
  { title: 'Connect CDK Drive', description: 'Waiting on store credentials', state: 'current', owner: 'Beacon Auto Group' },
  { title: 'Product pricing approved', state: 'pending', owner: 'Compliance' },
  { title: 'Go live', state: 'pending' },
]} />
```

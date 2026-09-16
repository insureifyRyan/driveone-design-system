---
category: Developer
---

# CodeBlock

A snippet of code as a first-class piece of the interface.

## Why it matters here
Kōvara sells infrastructure — custom APIs, embedded F&I, workflow automation. A code block is
product surface, not documentation decoration. Give it the same visual weight as a `Card`, and put
it on the marketing site as readily as in the docs: a partner deciding whether to integrate is
looking for the request shape, not a feature list.

## Rules
- `filename` carries the context ("Rate a contract", `app/api/quote/route.ts`). Without it the
  reader has to infer where the snippet goes.
- Dark is the default and is what belongs on a marketing page; `tone="light"` is for reference
  pages already on white.
- Keep snippets runnable. A curl example with a real-looking key placeholder beats pseudocode.

## Example
```tsx
<CodeBlock
  language="bash"
  filename="Rate a contract"
  code={`curl https://api.kovara.ai/v1/quotes \\
  -H "Authorization: Bearer $KOVARA_API_KEY" \\
  -d vin=1HGCM82633A004352 \\
  -d term_months=36`}
/>
```

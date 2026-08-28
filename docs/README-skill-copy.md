# Why a copy of the skill lives in this repo

`driveone-direct-meta.SKILL.md` is a durable copy of the `driveone-direct-meta`
skill, including every correction made during the 27 to 28 Aug 2026 build.

**It is here because edits to the synced skill do not survive.**

On 28 Aug 2026 the session container was recycled after roughly a day idle. The
synced skill was re-pulled from upstream at a new path and **every local edit was
discarded**, the previous version landing in `~/.claude/skills/.trash/`. The live
file was back to its original 9,478 bytes; the corrected version was 17,848.

So "update your memory" against a synced skill is not durable on its own. The
edits have to be carried back into whatever source the sync pulls from, or they
vanish on the next container.

## What this copy carries that the upstream original does not

- **Elevate** is the Ascent product brand DriveOne Direct private labels. The word
  appears nowhere in the executed contract.
- **"Any ASE-certified shop" is wrong.** The contract says any licensed repair
  facility of your choosing in the U.S., with the claim authorized before repairs
  begin. Broader right, and it carries a condition the old claim dropped.
- **Transmission repair figure drifted** to $6,165 to $6,685 (RepairPal, Aug 2026).
- **Cancellation is 30 days**, not 60. Sixty is Florida only, so "thirty days" is
  honest in all seven launch states and "sixty" is wrong in six.
- **Diminished Value, Openbay and Protection Plus** appear nowhere in the contract.
  Protection Plus is a checkout upgrade, and the contract excludes tires, wheels
  and windshields by name.
- **`Lead` = quote started**, so there is no Quote Started custom conversion to
  build. The threshold to move to conversion optimization is ~7 Leads/day per ad set.
- **`url_tags` writes silently fail on this account** while reporting success. Bake
  the parameters into `landing_page_url` at ad creation instead. Verified working
  28 Aug.
- **You cannot change `optimization_goal` on one ad set in a lowest-cost CBO
  campaign** (Meta code 100/1885760). It needs a rebuild, or a single-ad-set campaign.
- Live campaign and ad set ids for the Instagram and Facebook rebuilds.

Keep this file in step with the skill whenever either changes.

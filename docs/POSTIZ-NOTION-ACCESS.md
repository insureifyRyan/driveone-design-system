# Video scheduling: the upload was never needed

A run of the `driveone-ugc-video` workflow stalled trying to upload video, and escalated two
blockers as needing admin action. Checked all of it. **The headline is that the upload step was
redundant: the media is already on the Postiz CDN and the posts are already queued.** Attempting
it manually would have made things worse, not better.

## What is actually live right now

From **UGC Video Library — Billo 01 (DriveOne Direct)**, status 31 Aug / 2 Sep 2026:

- **All 12 cuts are already uploaded to the Postiz CDN.** Both geometry sets: the TikTok/Reels
  renders and the separate YouTube-safe renders. Every URL is recorded on that page.
- **143 posts are queued, not draft:** 18 Instagram Reels (Mon/Wed/Fri, 2 Sep to 12 Oct),
  84 TikToks (2x/day, 2 Sep to 13 Oct), 42 YouTube Shorts (daily, 2 Sep to 13 Oct).
- **The compliance block is applied to all of them.** Verified 143 of 143.
- These run unattended on Postiz's servers. No session needs to be open.

Confirmed independently: the watcher routine `trig_01Jk6JDN5SPdHSKtrSDguia3`
("DriveOne Direct social post failure watcher", daily 12:00 UTC) **ran successfully on
1 Oct 2026**, 12:22 to 12:28 UTC. It authenticates against Postiz on every run, so the API key
is valid and the queue is being checked daily for ERROR posts.

## Why uploading again would have hurt

Two documented traps, both of which a manual re-upload walks straight into:

1. **Re-uploading a file mints a new CDN URL.** The page is explicit: reuse the existing URLs for
   the whole rotation rather than uploading per post. A fresh upload produces orphan URLs that no
   scheduled post references.
2. **Postiz has no content-update endpoint.** Re-creating posts on top of an already-queued
   schedule produces duplicates, and cleaning them up is a create-then-delete pass that leaves
   orphans if it dies partway.

So the blocked capability was not standing between anyone and a working schedule. It was standing
between someone and a duplicate schedule.

## On the two reported blockers

**Notion did not need allowlisting.** `api.notion.com` *is* blocked at the egress proxy
(`403 CONNECT tunnel failed`, reproduced), but this workflow never uploads media to Notion. It
reads compliance language and edits the control doc, all server-side through the connector, which
never touches the sandbox network. Verified working. Even on success it would have achieved
nothing: the page states Notion attachment URLs are signed, expire, and are **not postable**;
they are the archive copy.

**Postiz was misdiagnosed as a broken MCP tool.** There is no Postiz MCP. Per
`driveone-direct-retargeting`: *"Postiz is a CLI, not an MCP."* No client update or file-picker
widget is part of this path. The CLI needs the npm package (npmjs already bypasses the proxy),
`POSTIZ_API_KEY`, and egress to `api.postiz.com` / `uploads.postiz.com` — the latter currently
blocked (verified 403). Running the CLI from a local terminal has unrestricted internet and needs
no admin change; allowlisting those two hosts per environment is the fix for doing it in a cloud
session.

## The real upcoming work

**The queue runs dry 12 to 13 Oct**, about eleven days out. The watcher warns when the queue is
inside 7 days, so expect that alarm around 5 to 6 Oct. Two cases:

- **Extending the existing rotation** needs *no upload at all*. Reuse the 12 CDN URLs already on
  the page and call `posts:create` only. Captions rotate independently of the video.
- **A new creator master** (Billo #2) is net-new: render, then upload, then schedule.

Either way, scheduling still needs the key plus egress, so it runs locally or after the allowlist
change.

## Open items that need no tooling at all

Both are outstanding compliance work, doable by hand today:

1. **The noon TikTok on 2 Sep published before the disclaimer pass** and carries none of the
   compliance block. Postiz cannot edit a published post, so the caption has to be fixed in the
   TikTok app.
2. **The YouTube paid-promotion checkbox** is manual per Short, and Postiz's schema has no field
   for it. Studio > Content > the Short > More options > Content declaration. Works after
   publishing. That is up to 42 Shorts.

## Credential note

The Postiz key is flagged in the Notion control doc as overdue for rotation. That page also
records where it is stored and how wide its posting rights are; both are deliberately left out of
this repo. Read it there.

This write-up does not read or reproduce the value. If it is rotated, the daily failure watcher
has to be updated in the same pass or the check goes blind, since it authenticates on every run.

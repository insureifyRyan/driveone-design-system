# Unblocking video scheduling: Postiz and Notion

Context: a run of the `driveone-ugc-video` workflow stalled with two reported blockers,
both diagnosed as needing admin action. Only one of them is real, and the real one has a
same-day workaround that needs no admin at all. This note records what was verified so the
dead ends are not walked again.

## Short version

| Reported blocker | Verdict | What actually unblocks it |
|---|---|---|
| `api.notion.com` must be allowlisted before videos can be uploaded to Notion | **Not needed.** Videos never go to Notion in this workflow. | Nothing. Notion already works for everything this job needs. |
| Postiz `file_upload` MCP tool is broken / client version mismatch | **Misdiagnosis.** There is no Postiz MCP tool. | `postiz` npm CLI + `POSTIZ_API_KEY` + egress to `*.postiz.com`. |

## Notion: no change required

The workflow's Notion usage is read plus page edits, never a media upload:

- Compliance language comes from **Vista — Approved Compliance Language (Old Republic / Ascent)**.
- The playbook and segment map live on the **DriveOne Direct — UGC Video Playbook** and
  **UGC Video Library — Billo 01** pages.

All of that runs through the Notion connector server-side. It does not touch the sandbox
network, so the egress allowlist is irrelevant to it. Verified: connector search returns those
pages, and `create_attachment` / `create_pages` / `update_page` are all available.

`api.notion.com` *is* blocked at the egress proxy (`403 CONNECT tunnel failed`), so the one
narrow thing that fails is POSTing raw bytes from the sandbox to a Notion upload URL. That
matters only for `create_file_upload`, which this workflow does not use. If a file ever does
need to land in Notion, `create_attachment` takes a `source_url` and Notion fetches it from its
own servers, which sidesteps the sandbox entirely.

Separately, pushing the video masters into Notion would not have helped even if it had worked:
the UGC skill records that **Notion attachment URLs expire and cannot serve media**, and that
Instagram, TikTok and YouTube all reject external URLs. Media has to be uploaded to Postiz.

## Postiz: a CLI, not an MCP

From the `driveone-direct-retargeting` skill, verbatim: **"Postiz is a CLI, not an MCP."**

So no MCP file-upload tool, and no in-chat file-picker widget, is part of this path. Whatever
`file_upload` tool was called belongs to some other connector; its refusal says nothing about
Postiz, and no client update changes that. The documented mechanism is:

```bash
npm install -g postiz
export POSTIZ_API_KEY=...          # not stored in this repo, in memory, or in any project doc
postiz upload <file.mp4>           # returns an uploads.postiz.com URL
postiz posts:create -c "<caption>" -m "<url>" -s "<ISO8601>" -t draft -i "<integration-id>"
postiz posts:status <id> --status schedule
```

Three things that CLI needs:

1. **The package.** `registry.npmjs.org` bypasses the proxy, so `npm install -g postiz` works
   in a cloud session already.
2. **`POSTIZ_API_KEY`.** Deliberately not committed anywhere. Ryan holds it. For repeat use in
   cloud sessions, add it as an environment secret rather than pasting it into chat.
3. **Network egress to `*.postiz.com`.** Currently blocked. Verified: `api.postiz.com`,
   `app.postiz.com` and `postiz.com` all return `403 CONNECT tunnel failed` from the egress
   proxy. `uploads.postiz.com` is needed too, since that is where `postiz upload` puts media.

### Fastest path today: run the CLI locally

The allowlist is a property of the cloud sandbox, not of Postiz or of the account. Running the
same CLI from a local terminal has unrestricted internet and needs no admin change:

```bash
npm install -g postiz
export POSTIZ_API_KEY=<key from Ryan>
cd <folder holding the rendered variants>
postiz upload DOD-variant-01.mp4
```

The rendered variants are already local to whoever rendered them, so nothing has to move first.

### Durable fix: allowlist Postiz for cloud sessions

To do the whole workflow inside a cloud session, the environment needs
`api.postiz.com` and `uploads.postiz.com` on its allowed network destinations. That is edited
per environment, not per conversation: open the cloud environment menu in the session title
bar, choose **Edit**, and change **Network access** (either a broader access level or those
hosts added to the allowed domains). Access levels are described at
https://code.claude.com/docs/en/claude-code-on-the-web. Add `POSTIZ_API_KEY` as a secret on the
same environment while there.

Do **not** add `api.notion.com` for this job. It is not what is blocking anything here.

## Guardrails that still apply

Carried over from the UGC skill, because an unblocked pipeline makes these easier to trip:

- Pace Postiz writes to **one call per 15 to 20 seconds**. Bursting trips
  `429 ThrottlerException` with a cooldown near an hour.
- There is **no content-update endpoint**. Fixing a caption means create-new-then-delete-old, so
  captions and the compliance block must be final before scheduling.
- Build with `-t draft` and let Ryan approve before flipping to scheduled.
- Check the **integration ID**, never the account name. The DriveOne dealer accounts have nearly
  identical names and are a different business.

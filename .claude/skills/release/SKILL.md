---
name: release
description: >-
  Cut a release for Better VBTV: analyze the diff since the last release tag,
  recommend a semver bump (major/minor/patch), sync the version across
  package.json + manifest.json, commit, tag vX.Y.Z, push, and create the GitHub
  Release that triggers the store-publish CI. Use when the user says "release",
  "cut a release", "bump the version", "ship a new version", or "/release".
---

# Release Better VBTV

This extension publishes **on GitHub Release published** (see
`.github/workflows/release.yml`). The release **tag drives the version**:
`EXT_VERSION` from the tag overrides `manifest.json` at CI build time, then CI
builds Chromium + Firefox, packages, and submits to Chrome / Edge / AMO.
Opera is attached to the release for manual upload.

So a release = **bump the version files, tag `vX.Y.Z`, then publish a GitHub
Release**. Creating that release is what submits to the stores — gate it behind
explicit user confirmation.

Version scheme: **semver `X.Y.Z`**, tags **`vX.Y.Z`**. Keep `package.json` and
`manifest.json` versions identical. (They have drifted before — `1.1.0` vs
`1.1`. Always write the full `X.Y.Z` to both.)

---

## Step 1 — Preflight (refuse if not met)

```bash
git fetch --tags origin
git status --porcelain        # must be empty — refuse if working tree is dirty
git rev-parse --abbrev-ref HEAD   # should be main
git log --oneline @{u}..HEAD 2>/dev/null   # unpushed commits — fine, will push
git log --oneline HEAD..@{u} 2>/dev/null   # behind upstream — pull first if any
```

- **Dirty tree** → stop. Tell the user to commit or stash first; a release must
  be built from a committed state.
- **Behind `origin/main`** → stop. Tell the user to pull/rebase first.
- Not on `main` → confirm with the user before continuing.

## Step 2 — Find the baseline + analyze the diff

```bash
LAST=$(git describe --tags --abbrev=0 2>/dev/null)
```

- **Tag exists** → baseline is `$LAST`.
- **No tags yet** (first run) → there is no prior tag. Use the last
  `chore(release)` commit as baseline if present; otherwise ask the user what
  version is currently live in the stores and treat that as the baseline
  version (you'll tag from it going forward). Current files read `1.1.0`/`1.1`,
  so absent other info assume the live version is **1.1.0**.

Collect the changes since baseline:

```bash
git log --no-merges --pretty='%s' "$LAST"..HEAD     # subjects, for categorizing
git diff --stat "$LAST" HEAD                         # files touched
git diff "$LAST" HEAD -- manifest.json               # permission / host changes
```

## Step 3 — Recommend the bump

Categorize commit subjects by Conventional Commit prefix and inspect the diff.
Pick the **highest** rule that matches:

| Bump      | Trigger |
|-----------|---------|
| **major** | A subject has `!` before the colon (`feat!:`), a body has `BREAKING CHANGE`, **or** `manifest.json` gained a new entry under `permissions` / `host_permissions` / `content_scripts` matches. New permissions force a store re-review and a user re-consent prompt — treat as breaking. |
| **minor** | Any `feat:` commit (new user-facing capability) and no major trigger. |
| **patch** | Only `fix:` / `perf:` / `chore:` / `docs:` / `build:` / `ci:` / `refactor:` / `style:` — no new features. |

If there are **zero** shippable changes since baseline (only tooling no-ops),
say so and ask whether to proceed anyway.

Compute the next version from the baseline + bump. Present to the user:

- Current version, recommended next version, and which rule fired.
- A grouped summary: **Features**, **Fixes**, **Other** (one line per commit).
- Any manifest permission changes called out explicitly.

Then **ask the user to confirm or override** the version (use AskUserQuestion
with the recommended bump first, plus the other two bumps and a manual option).
Do not proceed until confirmed.

## Step 4 — Apply the bump

With the confirmed `X.Y.Z`:

1. Set `"version": "X.Y.Z"` in **both** `package.json` and `manifest.json` (Edit,
   exact string match).
2. Update `CHANGELOG.md` — prepend a section. Create the file if missing:
   ```
   ## vX.Y.Z — <today's date YYYY-MM-DD>

   ### Features
   - ...
   ### Fixes
   - ...
   ```
   Only include non-empty groups. Derive entries from the categorized commits;
   drop pure-tooling commits (ci/build/chore) unless user-visible. Get the date
   from `date +%F` — do not guess it.
3. (Optional sanity check, recommended) build locally to confirm it's green
   before tagging:
   ```bash
   npm run build && npm run build:firefox
   ```
   If a build fails, stop and report — do not tag a broken build.

## Step 5 — Commit, tag, push

```bash
git add package.json manifest.json CHANGELOG.md
git commit -m "chore(release): vX.Y.Z"
git tag -a "vX.Y.Z" -m "vX.Y.Z"
git push origin main --follow-tags
```

Pushing the tag alone does **not** publish — CI fires on *release published*,
not tag push. So this step is safe; the publish gate is Step 6.

## Step 6 — Publish the GitHub Release (the store-submit trigger)

⚠️ This step submits the extension to the Chrome Web Store, Edge Add-ons, and
AMO (whichever have CI secrets configured). **Confirm with the user before
running it.** Quote that it auto-submits to the live stores.

Generate release notes from the same categorized changes (reuse the CHANGELOG
section body), then:

```bash
gh release create "vX.Y.Z" --title "vX.Y.Z" --notes "<release notes>"
```

After it's created, report the release URL and remind the user:
- CI is now building + submitting; watch it with `gh run watch` or the Actions tab.
- Opera has no API — its zip is attached to the release for manual upload.
- Store review can take hours to days before the new version goes live.

---

## Notes

- The published artifact's version comes from the **tag**, so the tag, the two
  version files, and the CHANGELOG heading must all read the same `X.Y.Z`.
- Never delete or move an existing tag to re-point a release — stores reject a
  version number that was already submitted. To fix a bad release, bump to the
  next patch.
- If the user only wants the version *decision* (not the full publish), do
  Steps 1–3 and stop after presenting the recommendation.

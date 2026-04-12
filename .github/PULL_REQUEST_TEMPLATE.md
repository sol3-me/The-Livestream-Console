## Summary

<!-- Briefly describe what this PR does and why. -->

## Changes

<!-- List the key changes in this PR. -->

-

## Testing

<!-- How was this tested? (local dev, manual QA, etc.) -->

---

## 🏷️ Release label

Adding a release label to this PR will automatically create a **GitHub Release**
with generated release notes when the PR is merged into `master`.

| Label | Effect |
| --- | --- |
| `release:patch` | Bug fixes, small tweaks — e.g. `v3.3.0 → v3.3.1` |
| `release:minor` | New backwards-compatible features — e.g. `v3.3.0 → v3.4.0` |
| `release:major` | Breaking changes — e.g. `v3.3.0 → v4.0.0` |

**Instructions:**
- Apply **exactly one** of the labels above if this PR should ship as a release.
- Apply **no release label** if this is a chore, docs update, or internal refactor
  that does not need its own release — the deploy pipeline will still run as normal.
- Applying more than one release label will **fail** the release workflow; keep exactly one.

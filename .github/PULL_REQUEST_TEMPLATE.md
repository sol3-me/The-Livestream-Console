## Summary

<!-- Briefly describe what this PR does and why. -->

## Changes

<!-- List the key changes in this PR. -->

-

## Testing

<!-- How was this tested? (local dev, manual QA, etc.) -->

---

## ���️ Release label

> **Action required:** use the **Labels panel** (top-right of this PR) to apply a label **before merging**.
> A CI check will block the merge if no release label is present.

| Label | When to use | Version effect |
| --- | --- | --- |
| `release:patch` | Bug fixes, small tweaks | `v3.3.0 → v3.3.1` |
| `release:minor` | New backwards-compatible features | `v3.3.0 → v3.4.0` |
| `release:major` | Breaking changes | `v3.3.0 → v4.0.0` |
| `no-release` | Chore, docs, CI — no version bump needed | — |

- Apply **exactly one** label. Applying multiple `release:*` labels will fail the release workflow.
- Writing the label name in the PR body does **not** count — it must be applied via the Labels panel.

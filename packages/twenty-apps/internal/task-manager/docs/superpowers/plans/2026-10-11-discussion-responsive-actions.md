# Discussion responsive actions implementation plan

> Execute inline on apps/zero-core, application files only. No worktree, commit or push. User authorized the behavior and implementation in the current conversation.

**Goal:** Automatically acknowledge comments after sustained visibility, align reactions with comment actions, and show submitted comments immediately while persisting in the background.

**Architecture:** Application-only geometry checks observe comment rows for approximately two continuous seconds. Per-comment immutable read receipts prevent unseen older comments from being marked read. Local pending rows reconcile using request IDs returned by real snapshots; failures retain the row and retry the same idempotent request.

**Tech stack:** Existing React application, Twenty SDK geometry bridge, scoped app routes, Vitest and real Playwright browsers.

- [x] Write failing behavior tests: visibility dwell/reset, hidden document where available, per-comment receipts, pending/retry and snapshot reconciliation.
- [x] Add nullable application fields for comment request ID and receipt comment ID; retain legacy manual receipt compatibility.
- [x] Implement a visibility hook using supported geometry APIs and remove manual mark-read controls. Background tab detection is best-effort: the current host SDK does not expose document visibility or browser-window focus to the worker.
- [x] Move reactions and read-by text into the existing action row, including read-only comments.
- [x] Implement pending rows with immediate composer clearing, background persistence, retry and server snapshot reconciliation; refresh task details in the background.
- [x] Verify the search field's live sandbox value is initialized, including Firefox record-page search/focus regression checks.
- [x] Run focused/full tests, direct typecheck/lint; apply with no deletion and verify actual UI using isolated fixtures. Clean up created fixtures.

Verified: 443 tests across 75 files, direct TypeScript check, lint and whitespace checks passed. The final manifest synced 136 files with no deletions. Chromium passed delayed submission/continued typing, idempotent Retry, a shared action row, and an offscreen-to-visible read dwell with actual receipt persistence. The automatic-read browser case overrides the displayed author of a dedicated fixture; it is not a two-account test. Firefox search/focus regression completed without error toasts. All dedicated browser fixtures were removed.

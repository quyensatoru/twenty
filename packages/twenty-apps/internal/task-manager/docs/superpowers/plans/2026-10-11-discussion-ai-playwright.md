# Discussion and Task AI Playwright Test Plan

> Execute sequentially in the existing `apps/zero-core` checkout. Use the executing-plans skill if implementing this suite. Do not create a worktree, commit, or push.

**Goal:** Verify Discussion and private task AI through the real localhost UI, including regressions that editor mocks miss and the Firefox error reported by the user.

**Architecture:** Playwright drives the installed Task Manager application at port 3001 against the existing server at port 3000. Separate repeatable UI tests with mocked provider failures from a small live-provider suite. App routes and persistence remain real in both suites.

**Tech stack:** Playwright, Chromium and Firefox, existing Twenty SDK application routes, existing configured AI provider.

**Spec:** User requirements: automatic access to every repository linked to the issue project, notifications beside Create issue, consistent tabs/skeletons, working mentions, no front-component error toast. See `DEPLOY.md` section 8 for current runtime behavior.

## Constraints

- All test files, fixtures, documentation and product fixes stay inside this application.
- Never put tokens, provider keys, authenticated browser storage, or signed image URLs in Git or test reports. Store authenticated state and screenshots under an ignored output folder.
- Use isolated test issues/comments/reactions rather than editing user tasks. Keep an explicit list of created fixture IDs and clean up only those records through app routes.
- Do not alter workspace roles or OAuth/provider configuration as part of tests.
- Use role/name selectors and `expect` assertions; wait for observable UI/network states rather than arbitrary sleeps.
- Real AI tests are opt-in, sequential, with one retry at most. Inspect provider/model availability first. Do not treat provider failures as a passing code-advice test.
- AI operates read-only. Source inspection may require reconnecting an expired OAuth connection; report that as an environment blocker with the actual provider response.

## Proposed files

- `playwright.config.ts`: local base URL, Chromium desktop/mobile and Firefox desktop projects, ignored artifacts, trace on failure.
- `e2e/fixtures/task-manager.fixture.ts`: login through Continue with Email, project/issue fixture IDs, safe cleanup, optional second member session.
- `e2e/discussion.spec.ts`: real rich-text editor, mentions, replies, retry, reactions, receipts and notifications.
- `e2e/task-ai-ui.spec.ts`: source display, controlled model failures, cancellation, preview and sharing.
- `e2e/task-ai-live.spec.ts`: opt-in real-provider and real-repository evidence.
- `e2e/task-manager-layout.spec.ts`: desktop/mobile header, skeleton and tab layout.

## Task 1: Establish the fixture and error gate

- [ ] Confirm localhost:3001 and localhost:3000 respond; record installed app build checksum and available model IDs, without credentials.
- [ ] Authenticate through the normal login flow and create a dedicated test issue in a project with two active connected repositories.
- [ ] Confirm the tested member has READ/WRITE access. For recipient/privacy tests, obtain two existing authorized accounts; never impersonate another member through request parameters.
- [ ] Collect page errors and front-component error toasts. Every happy-path test must assert neither appears.
- [ ] Establish clean baseline screenshots at 1440×1000 and 390×844.

## Task 2: Discussion regressions and delivery

- [ ] Open Discussion with an existing image comment, edit/cancel description, scroll through comments, and assert rendering remains usable without a `length is undefined` toast.
- [ ] Type `@` in the real contenteditable editor; eligible READ members appear. Filter by part of a name, select a member, and verify the actual editor text changes to the full name.
- [ ] Type a mention in the final paragraph of multiline content; paragraph-ending markdown newlines must not suppress suggestions.
- [ ] Submit the selected mention; verify the persisted comment contains the selected member ID. Mention text alone must not grant access or notify an unauthorized recipient.
- [ ] Repeat mention selection in a reply composer. Verify reply appears under its parent and cancelling a reply leaves the root draft intact.
- [ ] Fail one create request, retry, and assert only one comment is persisted and the draft survives failure. Verify typing after successful submit starts from an empty editor.
- [ ] Toggle a reaction twice; count and active state update consistently after refresh.
- [ ] Mark a comment read explicitly. A second member sees a receipt; opening the issue alone does not create one.
- [ ] With two authorized sessions, mention/reply from A to B; B sees an unread notification, follows it to the correct comment, and marks it read. Failed mark-read retains unread state.

## Task 3: AI UI and failure behavior

- [ ] Open Ask AI and start the conversation. All active repositories of this project appear automatically; no repository chooser or manual branch field appears. Repositories belonging to other projects are absent.
- [ ] A prompt suggestion fills the question without sending. Fast typing, editing and paste preserve the complete question.
- [ ] Simulate no available model: explain the missing configuration and disable Ask AI. Do not change the actual workspace provider.
- [ ] Simulate provider error/time-out: retain the question, show the failure, permit retry, and avoid posting discussion comments automatically.
- [ ] Cancel a running reply; show cancellation progress, stop subsequent repository reads, and do not save a completed answer after cancellation. An in-flight provider request may finish before cancellation takes effect.
- [ ] Submit twice while the first reply is pending; the second request must be blocked and only one private answer saved.
- [ ] Reopen the task; private history restores for A. B cannot see A's history.
- [ ] Preview a reply and cancel: no public comment exists. Explicit Share as comment creates one AI-assisted comment with repository names and full SHAs. Retry sharing must not duplicate the comment.

## Task 4: Live provider and repository evidence

- [ ] Run one task-only question: summarize the dedicated issue and propose acceptance criteria. Assert a non-empty answer consistent with fixture facts and no invented repository claims.
- [ ] Ask a bounded cross-repository question using known fixture paths in both repositories. Observe scoped read operations targeting both repos, the pinned SHA for each repo, and an answer citing inspected files/lines.
- [ ] Verify cited SHA/path against provider API results rather than matching prose verbatim. Assert no code write operation or repository outside the project is requested.
- [ ] Check the shared source budget and revoked/moved repository cases with deterministic app-route tests; avoid spending live model calls to provoke large context failures.
- [ ] Record model ID, inspected source SHAs, actual result, latency and any provider/OAuth failure. A non-empty but unsupported answer does not pass.

## Task 5: Layout and completion

- [ ] Desktop: Notifications is immediately right of Create issue with equal vertical alignment; no extra header row is introduced.
- [ ] Mobile: compact notification button follows Create issue; the page itself does not overflow horizontally, and source badges and the Ask AI composer fit the issue panel.
- [ ] Delay the initial board/detail response and capture skeleton: matching header controls and four Activity tabs appear.
- [ ] Verify notification menu closes on Escape/outside click and stays within the viewport.
- [ ] Run the full application unit suite, direct TypeScript check and lint. Report Playwright pass/fail/skipped counts separately from these checks.
- [ ] Remove only test-created records and leave code uncommitted for review.

## Execution order and report

Run Tasks 1–2 first to gate the reported bugs, then deterministic AI UI cases, then the small live-provider suite, finally responsive layout. Report each case as passed, failed, or blocked with evidence. Screenshots and traces are useful evidence for failures; they do not replace behavioral assertions. Privacy/notifications requiring a second account stay pending until a legitimate second session is available.

## Verification run — 2026-10-11

See [the execution report](../../testing/2026-10-11-task-discussion-ai.md) for the checks actually run. Real Chromium, Firefox and narrow-screen mention checks passed, including arrow keys, Enter, Escape, namesake emails and popup geometry. The live task-only AI question, private history restore and preview/cancel passed. Cross-repository inspection remains blocked by a GitLab connection refresh failure; it requires reconnecting the existing account through Development. The full application suite passed 435 tests in 74 files; direct typecheck and lint passed. All created test issues were deleted, the application was applied with `--no-delete`, and no commits or pushes were made. The broader unchecked cases above remain planned rather than being implicitly marked as passed.

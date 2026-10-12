# Discussion and AI verification — 2026-10-11

Tested the installed application at localhost:3001, using the real rich-text editor, app routes and configured AI provider. Changes stay within this application on `apps/zero-core`; no commits or pushes.

## Mention results

| Case | Chromium | Firefox | 390 × 844 |
| --- | --- | --- | --- |
| Namesakes show avatar, full name and distinct email | Pass | Pass | Pass |
| Arrow Down/Up change the highlighted member | Pass | Pass | Pass |
| Enter inserts the selected member | Pass | Pass | Pass |
| Escape closes the popup and retains the draft | Pass | Pass | Pass |
| Search by email | Pass | Pass | Pass |
| Popup aligns below the typed `@` when space is available | Pass | Pass | Viewport clamping verified |
| Front-component error toast | None | None | None |

Desktop measurements: popup left equals the typed `@` left; popup starts about 7 px below the character. The mobile check uses a multiline comment and asserts the popup and page stay within the viewport. Drafts on existing tasks were not submitted.

The real browser caught an unsupported sandbox `scrollIntoView` call that editor mocks did not catch. Removed it; keyboard navigation now renders a bounded window containing the active member. Added a longer-list test without mocking that browser method.

## Mention search focus regression

The uncontrolled search input's `defaultValue` did not initialize its live sandbox `value`. React focus restoration reads `value.length`, so asynchronous focus changes could trigger the reported undefined-length toast. An app-only mount effect initializes that value before focusing. A real Firefox worker check failed before the fix and passed afterward; repeated search, hover, arrow navigation and refocusing finished with no front-component error toast on the reported record page.

## Responsive discussion actions

- Comments appear immediately with `Sending…`; the composer clears and accepts the next draft while persistence continues. Failures retain the row with Retry, using the original idempotent request ID. Snapshots reconcile that ID even if polling wins the race with the create response.
- Reactions and read-by information share the existing Reply/Edit/Delete action row. The manual Mark as read button is removed.
- Read receipts identify the exact comment. A newer comment's receipt does not acknowledge older unseen comments; legacy watermark receipts remain compatible.
- Approximately 60% of the row (or the available viewport for long rows) must remain visible for two seconds. Leaving visibility resets the timer. Failed acknowledgements back off before another dwell attempt.
- The live browser exposed a viewport-coordinate error after scrolling: SDK rectangles already use host viewport coordinates. Removed the extra widget-origin offset and added a failing-then-passing regression for a widget scrolled above the viewport.
- Browser verification of automatic reading uses a displayed-author override on a dedicated fixture, with actual app geometry and actual scoped read-receipt persistence. This does not establish a two-account read-receipt test.
- Host browser focus and document visibility are not exposed to the sandbox by the current SDK. Checks use those signals where available and reset dwell after timer throttling, but background-tab detection remains best-effort within the app-only constraint.

| Responsive behavior in Chromium | Result |
| --- | --- |
| Five-second delayed create request | Pass: immediate row, cleared composer, next draft usable |
| Simulated failed create and Retry | Pass: same request ID, one visible comment and one persisted row |
| Reaction placement | Pass: same action container as Reply/Edit/Delete |
| Manual read control | Removed |
| Comment held offscreen for three seconds | No read request |
| Scroll into view and dwell | Pass: one request after at least 1.8 seconds; exact comment receipt persisted |
| Further visible time | No duplicate read request |
| Front-component error toast / page exception | None |

The automatic-read case changes only the displayed author in the fixture snapshot so it exercises another-author UI behavior with one authenticated account. Creation and read receipts use real scoped app routes. All fixture issues were deleted. Native tests also cover dwell reset, background signals where available, read retry backoff and independent comment receipts.


## Live AI results

| Case | Result |
| --- | --- |
| Automatic project repository catalogue | Pass: four project repositories; no manual selector |
| Task-only question with the configured provider | Pass: actual model reply consistent with fixture acceptance criteria |
| Private history after reopening the task | Pass: one saved answer restored in the UI |
| Preview and cancel | Pass: preview opened and closed without sharing |
| Inspect two project repositories | Blocked: the valid targeted retry reached `getConnection`, but the GitLab connection could not be refreshed and requires reconnecting |

Dedicated issues for the live task question and source diagnostics were deleted after verification. The first source question returned an invalid repository target, which scoped validation rejected before repository access. A separate real-provider protocol check returned a valid `tree` operation with a catalogue repository ID and read argument. The targeted source retry then failed because the GitLab connection could not be refreshed. Reconnect that account through Development before repeating the cross-repository test. No repository source advice is marked as passed, and connection/provider settings were not changed.

These checks do not verify privacy or notifications across two different authenticated members, an actual public AI share, or cancellation of a running live provider request. Those remain separate cases in the Playwright plan.

## Application checks

- `npx vitest run`: 443 tests passed across 75 files.
- `npx tsc --noEmit`: passed.
- `npx oxlint -c .oxlintrc.json .`: no warnings or errors.
- `git diff --check`: passed.
- `npx twenty apply --remote dev --no-delete`: synced 136 files successfully.

Browser storage, captured authorization headers and provider secrets are excluded from this report and the repository. Temporary Playwright runners, logs and screenshots are under `/tmp/twenty-task-discussion/`.

# Task AI processing events — 2026-10-12

Application-only changes on `apps/zero-core`, applied to dev without commits or pushes.

## Behavior

Each private run now keeps an ordered event journal with sequence numbers, step identifiers, timestamps and running/completed/failed/cancelled states. Starting another step completes the previous one; repository opening is recorded before contacting the provider. Repository steps are shown only when requested and executed. The completed send response includes the final journal so even steps shorter than the polling interval are delivered.

Ask AI displays a collapsible activity list with step status, duration and repository/operation details. Repeated model calls appear as distinct rounds. Events survive activity-tab switches and record reloads; the most recent run is restored from encrypted per-member/issue storage. Merging by sequence prevents delayed status responses from removing events already received. A new question resets the displayed journal and ignores status responses from the previous run.

Transport remains application status polling every 1.5 seconds, carrying the complete event journal. This provides incremental processing events, rather than SSE/WebSocket transport or generated-text token streaming. `/rest/ai/generate-text` still returns the complete model response. No core changes or simulated pipeline steps were added.

## Verification

- 457 tests across 76 files passed; TypeScript, app lint and whitespace checks passed.
- Tests cover ordered completion events, private member isolation, repository-opening failure, cancellation, stale/duplicate polling responses, repeated model rounds, restoration and a new conversation with no prior run.
- Chromium on localhost:3001 verified incremental event updates, retention of short steps, tab switching, reload during processing, completion and expanding/collapsing activity. Repository events in this UI case were explicitly mocked fixtures.
- A separate real configured-provider request returned task-context advice. The actual backend journal and rendered UI included completed context preparation, analysis, reply saving and final completion. Reload restored both the answer and journal.
- No front-component failure toasts or page errors occurred; the disposable test issue was removed.
- `twenty apply --remote dev --no-delete` succeeded with 136 files synced.

Browser session storage and authorization are kept outside the repository.

## Ask AI composer keyboard shortcuts

Enter submits the question; Shift+Enter inserts a newline. Empty input, busy state, unavailable AI and IME composition do not submit. The composer shows the shortcut hint beside its send button.

The 12 panel tests passed, along with TypeScript and app lint. Chromium verified a two-line question with Shift+Enter, one submission using Enter, and no submission for empty input or a composing Enter event. No front-component failure toasts or page errors occurred; the disposable issue was removed. Applied successfully with 136 files synced.

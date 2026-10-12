# Task AI conversation flow — 2026-10-12

Application-only changes on `apps/zero-core`, without commits or pushes.

- Activity uses the original Comments label in the board detail and record page.
- Ask AI initializes automatically on its first visit. Loading and Retry replace the extra Start conversation step.
- A visited AI panel remains mounted while another activity tab is displayed. Drafts, pending replies, progress, previews and cancellation remain available when returning. Switching issues unmounts the previous issue's panel.
- Suggestions reset an uncontrolled question field, including when selecting a previously edited suggestion again. The sandbox's live value is initialized before restoring selection; focus and the caret move to the end of the chosen prompt.
- The pending question appears immediately beside actual processing progress. The encrypted run state also keeps the question so reopening an active run restores it automatically.
- Reaction state changes immediately, with per-comment/member/emoji persistence serialized to preserve rapid toggle intent. Polling cannot overwrite pending reactions. Failed writes restore the last confirmed state.

## Streaming boundary

The configured-provider adapter calls `/rest/ai/generate-text`. The existing controller uses `generateText` and returns one JSON response after generation. It does not expose token deltas or a streaming mode. These changes show the question and real processing progress while waiting; they do not simulate token streaming. Actual token streaming requires a supported streaming provider endpoint. Core remains unchanged, as requested.

## Automated checks

449 tests across 75 files passed, including suggestion reselection/focus, automatic initialization, active-run restoration, tab retention, optimistic reaction/poll reconciliation and serialized rapid toggles. Direct TypeScript checking, app lint and whitespace checks passed.

Browser verification uses a dedicated disposable issue and a delayed UI reply fixture. Real configured-provider advice is checked separately; UI fixture responses are not represented as live model output. Browser storage and authorization remain outside the repository.

## Browser results

Chromium against localhost:3001 passed:

- Reaction selection and deselection render before a deliberately delayed write completes; rapid toggles persist the final deselected state.
- Ask AI opens automatically. Selecting a suggestion focuses the question field with its caret at the end; editing and selecting the same suggestion again resets it correctly.
- Switching to Comments and back during a delayed reply preserves the pending question, progress and cancellation without reinitializing the conversation.
- The real configured provider returned task-context advice. Reloading the record and opening Ask AI restored that answer automatically from private history.
- No front-component failure toasts or browser page errors occurred. The disposable test issue was removed.

Applied successfully with `twenty apply --remote dev --no-delete` (136 files synced, no deletions). Product changes are confined to the task-manager application; no commits or pushes were created.

## Compact comment reactions

The action row now has one Add reaction icon. It opens an anchored emoji menu; only reactions with a nonzero count remain visible as chips. Selecting an emoji closes the menu, with existing optimistic persistence preserved. Arrow keys, Home/End, Enter and Escape are supported. The host overlay closes on outside clicks and keeps the menu inside the viewport, including above a trigger near the bottom edge.

451 tests across 75 files, direct TypeScript checking and app lint passed. Chromium verified the picker position, keyboard selection, Escape, outside clicks, immediate chip updates and rapid select/remove with a delayed backend write. The final server snapshot preserved the selected heart and removed the rapidly toggled thumb. No front-component failure toasts or page errors occurred; the disposable issue was removed. This version was also applied successfully (136 files synced).

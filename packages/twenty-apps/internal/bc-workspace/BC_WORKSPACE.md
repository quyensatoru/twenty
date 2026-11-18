# BC Workspace

VIP client dashboard, analytics and personal task management for Business Consultants (BCs). Spec: `BC_Workspace_V5_1_Product_Requirements.md`.

## Data model

| Object | Purpose |
| --- | --- |
| `vipClient` | One row per shop (`shopDomain`, unique). Owns the PIC (`picId` → workspace member), the overall `relationshipStatus`, `awaitingReplySince`, `lastBcContactAt` and the latest `appUsage` per app. |
| `merchant` (customer-support) | One row per shop and app. Linked to its client through `merchant.vipClientId`; acts as the app subscription (plan = `pricingPlan`, lifecycle = `using`). |
| `bcTeam`, `bcMember` | Team membership of a workspace member, role `BC` or `MANAGER`, and the Crisp operator names the member writes under. |
| `bcIssue` | A client problem (AI or manual). Open issues make the client At Risk and their apps At Risk. Closed only by a BC (`RESOLVED`, `DISMISSED`). |
| `bcTask` | A BC's own task. No due dates. Automatic tasks carry a unique `triggerKey`. |
| `bcActivity` | Timeline and metric evidence. `externalId` makes imports idempotent; `actorMemberId` keeps credit with whoever acted. |
| `bcReview`, `bcSubscriptionEvent`, `bcOpportunity`, `bcPayment` | Reviews, verified plan events (with BC attribution), upsell opportunities, collected money. |
| `bcPlan` | Per-app plan catalog: rank (upgrade vs downgrade), monthly price (MRR), usage allowance (80% / 100% rule). |

## Overall status precedence

Recomputed by `recomputeClientStatus` after every event that can move it:

1. Any open issue → **At Risk**.
2. No live app (every linked merchant has `using = false`) → **Inactive**. A client without linked merchants is not forced Inactive.
3. A BC message not answered yet → **Waiting for Client**, then **Follow-up** after `BC_NO_REPLY_HOURS` (default 72) with one follow-up task.
4. Otherwise **Active**.

## Automations

| Trigger | Effect |
| --- | --- |
| `crispMessage.created` | VIP chats only. A message from an operator matching a BC's name or Crisp operator names is BC contact: outbound activity, `lastBcContactAt`, starts the reply wait; it gets topic `UPSELL` when it talks about the plan (upgrade, plan, pricing, limit, usage, allowance, quota and the Vietnamese equivalents). Other operators are support and are ignored. A client message ends the wait (an untouched no-reply task closes as "Client replied", one in progress gets a note) and is queued for AI classification (messages from the last 3 days only; the sync imports history). |
| `classify-message-job` | AI decides: same open issue → evidence appended and its task touched (reopened if the BC had closed it while the issue is still open); distinct problem (confidence ≥ 0.5, not a how-to) → issue + High task for the PIC. Runs under a per-client lock (re-queued after 30 s when busy) so two messages cannot both open an issue. A retry that finds its message already stored finishes the task, timeline entry and status instead of stopping. |
| `merchant.created` | A new app install of a VIP shop is linked to the client and recorded as an install. |
| `merchant.updated` | Plan change → upgrade / downgrade by the plan catalog (left unclassified when the catalog cannot order the plans). The change is dated by `planStartedAt` when the same update wrote it, else by `updatedAt`. Upgrade credit needs, before that time and inside the window, a BC contact on topic `UPSELL` (a completed upsell meeting included) or, once an open opportunity for the app existed, a BC contact that talks about the plan. The newest open opportunity of that app raised before the change converts. Downgrade and uninstall open a retention task. |
| `vipClient.created/updated` (PIC) | PIC_CHANGE activity (`metadata: { fromMemberId, toMemberId, fromTeamId, toTeamId, effectiveAt }`, actor = `vipClient.picAssignedById`, keyed `pic:<client>:<updatedAt>` so a re-delivered event logs once). The previous PIC's open tasks on the client (manual and automatic) and unowned automatic ones move to the new PIC with a history entry; on unassign they stay with their owner and get a note. First assignment opens an onboarding task. Past activity keeps its actor. |
| `sync-vip-clients-cron` (hourly, :15) | Adds a VIP client for each shop that newly qualifies: a live install on Shopify Advanced/Plus (any app plan), or Fraud `FR_UNLIMITED`/`FR_PLUS`, MIDA `SS_ENTERPRISE`, BLOY `GROWTH`/`PLUS`/`ENTERPRISE`. Shops with a live install on a dev, partner test, sandbox or staff store are skipped. Links all the shop's merchant rows. Never removes a client. |
| `follow-up-sweep-cron` (hourly) | Moves clients past the no-reply window to Follow-up. Unresolved-issue follow-up (chosen semantics): every 7 days an issue stays open, its existing follow-up task gets one `REMINDER` history entry and a timeline entry; no new task, no due date. |

Every plan event, from the CRM sync or the subscription ingest, is keyed `sub:<client>:<APP>:<eventType>:<newPlan>:<UTC day of the effective time>`: the second source to report a change confirms the existing record (source becomes `INGEST`, its `eventId` is kept in `attributionEvidence.sourceEventIds`) instead of adding one. Retention tasks hang off that key, and every follow-up step (opportunity conversion, timeline entry, retention task, status) re-runs idempotently on a retry. A unique-key collision between two concurrent deliveries is read back as "already there".

Admins can correct a credit in Settings > Integrations: the upgrade or review gets the new credited BC (or none), and the change, the previous value, the actor and the reason are kept in `attributionEvidence.corrections` and as a SYSTEM activity on the client timeline.

## Permissions

Resolved per route from the caller's `bcMember` rows: a BC sees clients they own; a manager sees every client of the teams they manage plus unassigned clients, and financial figures; workspace admins and members with the BC Workspace admin team role see everything and manage settings. The routes run as the app role, so the UI never decides access.

## Ingest API

For the billing, usage, review and meeting systems.

- `POST https://<crm-host>/s/bc-workspace/ingest/<kind>`, JSON body.
- `Authorization: Bearer <workspace API key>`.
- `x-bc-ingest-secret: <BC_INGEST_SECRET>` when that application variable is set.
- Unknown shops answer `{ "success": true, "ignored": "not a VIP client" }`. Validation errors answer `{ "success": false, "error": "..." }` with HTTP 200. Every call is idempotent on its id; retry freely.
- Dates are ISO 8601. `shopDomain` is the `*.myshopify.com` domain. `appName` is the CRM app name (MIDA, BLOY, ...).

| Kind | Body | Idempotency |
| --- | --- | --- |
| `usage` | `{ eventId, shopDomain, appName, plan, billingCycle, used, limit, at }` | Opportunity and task keyed on client + app + plan + `billingCycle`. 80% → Medium upsell task, 100% → the same task High. The allowance is the plan catalog's `usageAllowance` when set, else `limit`. A repeated `eventId` or a reading older than the stored one is ignored. A new `billingCycle` (sortable, e.g. `2026-11`) starts a new opportunity and marks older open cycles LOST. Busy client: `{ success: false }`, retry. |
| `review` | `{ reviewId, shopDomain, appName, rating, publishedAt, reviewUrl, reviewerName, body, isVerified }` | `reviewId`. `reviewUrl` must be the review itself (`https://apps.shopify.com/<app>/reviews/<id>`); anything else is stored as missing. |
| `payment` | `{ paymentId, shopDomain, appName, kind: CHARGE\|REFUND, amount, currency, amountInBaseCurrency, paidAt, invoiceId, isOneTime }` | `paymentId`. Amount net of excluded taxes; `amountInBaseCurrency` is required when `currency` is not `BC_BASE_CURRENCY`. |
| `subscription` | `{ eventId, shopDomain, appName, eventType: INSTALL\|UPGRADE\|DOWNGRADE\|UNINSTALL\|REINSTALL\|CANCEL, oldPlan, newPlan, occurredAt, mrrDelta }` | The change itself (client, app, event type, new plan, UTC day of `occurredAt`), shared with the CRM merchant sync, so one change reported by both is one event. `occurredAt` is when the change took effect. |
| `meeting` | `{ meetingId, shopDomain, ownerEmail, status: SCHEDULED\|COMPLETED\|CANCELLED, startedAt, title, summary, topic }` | `meetingId`; a repeat call updates the status. Only `COMPLETED` counts as BC contact and ends a pending reply wait. `topic` (`UPSELL`, `REVIEW`, ...) feeds attribution. |

## Roles and data access

The app routes enforce BC scope on every call (`resolveBcScope`), but BC Workspace records are ordinary workspace objects. Two assignable roles carry the same rules into Twenty's own record pages and API. Assign one of them to each BC or manager in Settings → Roles. A member holds one role, so both start from the standard Member access (read everything, write nothing) and add the BC Workspace delta.

| Role | VIP clients | BC tasks | Payments | Plan price, MRR change, attribution evidence |
| --- | --- | --- | --- | --- |
| BC Workspace — Business Consultant | Only where PIC = the member (row-level predicate) | Only where owner = the member, editable | No access | Hidden (field permissions) |
| BC Workspace — Manager | All, read-only | All, read-only | Read | Visible |

Team boundaries for managers stay with the routes: a row-level predicate cannot express "the PIC belongs to a team I manage", so a manager reading the raw objects sees every team. Admins keep their own role.

Routes answer `{ success: false, error: 'Not authorized: …' }` when the caller is out of scope; the payload never contains the denied data.

Scope rules in the routes:

- BC: clients whose PIC is the member.
- Manager: clients whose PIC is in a team they manage, plus unassigned clients owned by one of those teams (`vipClient.teamId`).
- Admin: every client. A Twenty Admin (or a member with the WORKSPACE or ROLES permission) is one; so is anyone with an active `bcMember` row whose `memberRole` is `ADMIN`, which an admin sets in Settings > Teams. Settings can add anyone to any team, so this role is full BC Workspace access, not a narrower settings-only right.
- A client's team follows its PIC; an unassigned client keeps the team an admin chose or the team of the manager who added it.

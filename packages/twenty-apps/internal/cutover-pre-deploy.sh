#!/usr/bin/env bash
# GOLIVE_RUNBOOK.md 2.1-2.6 against one database, run while the fork server is
# still the one deployed (and stopped). psql runs inside the Postgres
# container, so the host does not need a client installed.
#
#   bash cutover-pre-deploy.sh <database> <log_dir>
#
# Differences from the runbook, all found rehearsing on a copy of production:
# - user-made views (Custom application) are snapshotted before the re-parent
#   scripts sweep them into the apps, and handed back in cutover-post-deploy.sh;
# - trashed duplicates of live issueMerchant pairs are removed (backed up),
#   since the app's unique index cannot skip soft-deleted rows;
# - every twenty-standard relation pointing at a moved object is dropped on
#   both sides (not only the regex in CUTOVER.md 3b), with its links backed up.
set -euo pipefail

DATABASE="${1:?database name}"
LOG_DIR="${2:?log directory}"
PG_CONTAINER="${PG_CONTAINER:-twenty_pg}"
PG_USER="${PG_USER:-postgres}"

cd "$(dirname "$0")"
mkdir -p "$LOG_DIR"

psql_run() {
  docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$DATABASE" -v ON_ERROR_STOP=1 "$@"
}

PG_HOST_URL="$(grep '^PG_DATABASE_URL' ../../twenty-server/.env | cut -d= -f2- | sed -E 's#/[^/]+$##')"
export PG_DATABASE_URL="$PG_HOST_URL/$DATABASE"

mapfile -t SCHEMAS < <(psql_run -Atc "SELECT nspname FROM pg_namespace WHERE nspname LIKE 'workspace\_%' ORDER BY 1")
mapfile -t WORKSPACE_IDS < <(psql_run -Atc "SELECT id FROM core.workspace WHERE \"deletedAt\" IS NULL ORDER BY 1")

echo "2.1 row counts"
for schema in "${SCHEMAS[@]}"; do
  psql_run -v schema="$schema" < task-manager/scripts/00-row-counts.sql > "$LOG_DIR/before-task-manager-$schema.txt"
  psql_run -v schema="$schema" < shift-management/scripts/00-row-counts.sql > "$LOG_DIR/before-shift-$schema.txt"
done

echo "2.1b snapshot Custom view ownership"
psql_run -v mode=snapshot < cutover-custom-view-ownership.sql > "$LOG_DIR/2.1b-custom-views.log"

echo "2.2 application rows"
psql_run < task-manager/scripts/01-create-applications.sql > "$LOG_DIR/2.2-task-manager.log"
for workspace_id in "${WORKSPACE_IDS[@]}"; do
  psql_run -v workspace_id="$workspace_id" < shift-management/scripts/01-create-applications.sql >> "$LOG_DIR/2.2-shift.log"
done

echo "2.3 re-parent metadata"
psql_run --single-transaction < task-manager/scripts/02-reparent-metadata.sql > "$LOG_DIR/2.3-task-manager.log" 2>&1
for workspace_id in "${WORKSPACE_IDS[@]}"; do
  psql_run --single-transaction -v workspace_id="$workspace_id" < shift-management/scripts/02-reparent-metadata.sql >> "$LOG_DIR/2.3-shift.log" 2>&1
done

echo "2.4 derived identifiers"
node rewrite-derived-identifiers.mjs --apply > "$LOG_DIR/2.4.log"
node rewrite-derived-identifiers.mjs --dry-run | grep -q 'cần viết lại: 0'

echo "2.5 rename tables, 2.6 cross-object links"
for schema in "${SCHEMAS[@]}"; do
  psql_run --single-transaction -v schema="$schema" < task-manager/scripts/03-rename-tables.sql >> "$LOG_DIR/2.5.log" 2>&1
  psql_run --single-transaction -v schema="$schema" < shift-management/scripts/03-rename-tables.sql >> "$LOG_DIR/2.5.log" 2>&1
  psql_run --single-transaction -v schema="$schema" < task-manager/scripts/03b-dedupe-soft-deleted-issue-merchants.sql >> "$LOG_DIR/2.5b-dedupe.log" 2>&1
  psql_run -v schema="$schema" < task-manager/scripts/04-preserve-cross-object-links.sql >> "$LOG_DIR/2.6-links.log" 2>&1
  psql_run --single-transaction -v schema="$schema" < cutover-drop-orphan-standard-relations.sql >> "$LOG_DIR/2.6-drop-relations.log" 2>&1
done

echo "Pre-deploy cutover done on $DATABASE, logs in $LOG_DIR"

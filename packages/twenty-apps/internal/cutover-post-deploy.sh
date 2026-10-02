#!/usr/bin/env bash
# GOLIVE_RUNBOOK.md 2.7-2.10 around the app applies, against the database in
# packages/twenty-server/.env of THIS checkout (apps/zero-core, already built).
#
#   bash cutover-post-deploy.sh <log_dir> upgrade      # before any `twenty apply`
#   (apply task-manager, then customer-support and shift-management)
#   bash cutover-post-deploy.sh <log_dir> attachments  # after task-manager apply
#
# Order found rehearsing on a copy of production: merchant has to move to
# customer-support BEFORE task-manager is applied, because task-manager no
# longer declares merchant and would otherwise try to drop it.
set -euo pipefail

LOG_DIR="${1:?log directory}"
PHASE="${2:?upgrade|attachments}"
PG_CONTAINER="${PG_CONTAINER:-twenty_pg}"
PG_USER="${PG_USER:-postgres}"

INTERNAL_DIRECTORY="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIRECTORY="$INTERNAL_DIRECTORY/../../twenty-server"
mkdir -p "$LOG_DIR"

export PG_DATABASE_URL="$(grep '^PG_DATABASE_URL' "$SERVER_DIRECTORY/.env" | cut -d= -f2-)"
DATABASE="${PG_DATABASE_URL##*/}"

psql_run() {
  docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$DATABASE" -v ON_ERROR_STOP=1 "$@"
}

server_command() {
  (cd "$SERVER_DIRECTORY" && NODE_ENV=production node dist/command/command.js "$@")
}

flush_cache() {
  server_command cache:flush > /dev/null 2>&1
}

mapfile -t SCHEMAS < <(psql_run -Atc "SELECT nspname FROM pg_namespace WHERE nspname LIKE 'workspace\_%' ORDER BY 1")

case "$PHASE" in
  upgrade)
    echo "2.7 reconcile upgrade history, upgrade (database: $DATABASE)"
    # The cache still holds the workspace as the fork server last saw it, from
    # before the re-parent SQL; upgrade reads it and writes against it.
    flush_cache
    (cd "$SERVER_DIRECTORY" && NODE_ENV=production node "$INTERNAL_DIRECTORY/cutover-reconcile-upgrade-history.mjs" --apply) > "$LOG_DIR/2.7-reconcile.log" 2>&1
    server_command upgrade > "$LOG_DIR/2.7-upgrade.log" 2>&1
    server_command upgrade:status > "$LOG_DIR/2.7-upgrade-status.log" 2>&1
    grep -q 'Workspaces: .* 0 behind, 0 failed' "$LOG_DIR/2.7-upgrade-status.log"
    flush_cache

    for schema in "${SCHEMAS[@]}"; do
      psql_run -v schema="$schema" < "$INTERNAL_DIRECTORY/task-manager/scripts/00-row-counts.sql" > "$LOG_DIR/after-upgrade-task-manager-$schema.txt"
    done

    echo "2.9 move merchant to customer-support"
    cd "$INTERNAL_DIRECTORY/customer-support"
    node scripts/run-sql.mjs scripts/01-create-application.sql > "$LOG_DIR/2.9-01.log" 2>&1
    flush_cache
    node scripts/run-sql.mjs scripts/02-reparent-merchant.sql > "$LOG_DIR/2.9-02.log" 2>&1
    flush_cache
    node scripts/03-rewrite-derived-identifiers.mjs --apply > "$LOG_DIR/2.9-03.log" 2>&1
    flush_cache
    node scripts/run-sql.mjs scripts/04-reparent-merchant-presentation.sql > "$LOG_DIR/2.9-04.log" 2>&1
    flush_cache

    echo "hand user-made views back to Custom"
    psql_run -v mode=restore < "$INTERNAL_DIRECTORY/cutover-custom-view-ownership.sql" > "$LOG_DIR/2.9-custom-views.log"
    flush_cache

    echo "Ready for: twenty apply (task-manager, then customer-support, shift-management)"
    ;;
  attachments)
    for schema in "${SCHEMAS[@]}"; do
      psql_run --single-transaction -v schema="$schema" < "$INTERNAL_DIRECTORY/task-manager/scripts/05-restore-issue-attachments.sql" > "$LOG_DIR/2.8-attachments-$schema.log" 2>&1
      grep -A2 -E 'fork_files_missing|issues_over_field_limit' "$LOG_DIR/2.8-attachments-$schema.log"
    done
    flush_cache
    ;;
  *)
    echo "Unknown phase: $PHASE" >&2
    exit 1
    ;;
esac

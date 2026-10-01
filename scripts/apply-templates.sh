#!/usr/bin/env bash
# Publish a dealership's templates straight into Postgres, then PROVE they landed.
#
#   DATABASE_URL='postgresql://...' ./scripts/apply-templates.sh ferrario-ford
#
# This is the path that scales. publish-templates.mjs has always emitted SQL to
# stdout for a human to apply by hand, which is fine once and miserable by the
# third dealership. Piping it to psql removes the copy entirely: no clipboard, no
# dashboard, no hosting, and no chance of a character drifting in transit.
#
# It deliberately does NOT fetch templates over HTTP at send time. That was tried
# and removed: it needed public hosting, a deployment protection carve out and a
# base URL in config, and it could fail at send time. A row in the same database
# can do none of those things. This script only loads the rows; the scheduler
# still reads them over the connection it already holds.
set -euo pipefail

DEALER="${1:-}"
if [ -z "$DEALER" ]; then
  echo "usage: DATABASE_URL=... $0 <dealer-id>" >&2; exit 2
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set." >&2
  echo "Supabase -> Project Settings -> Database -> Connection string -> URI." >&2
  echo "Use the SESSION POOLER URI on port 5432, not the direct db.<ref> host," >&2
  echo "which is IPv6 only and unreachable from most runners." >&2
  exit 2
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/email/dist/$DEALER"
[ -d "$DIST" ] || { echo "No build at $DIST. Run: npm run build:$DEALER" >&2; exit 1; }

CAMPAIGN="$(node -e "console.log(require('$ROOT/brand/dealers/$DEALER.json').campaign.id)")"

echo "Applying $DEALER templates to campaign $CAMPAIGN ..."
node "$ROOT/scripts/publish-templates.mjs" "$DEALER" \
  | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q

# Ten rows is not proof. Ten matching md5s is. Compare what the database now
# holds against the bytes on disk, per template, and fail loudly on any drift.
echo "Verifying checksums ..."
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
psql "$DATABASE_URL" -At -F' ' -v ON_ERROR_STOP=1 -c \
  "select md5(html), slug || '.html' from vsc_email_template
   where dealer_id = '$DEALER' and campaign_id = '$CAMPAIGN' order by step;" \
  > "$TMP/db.txt"
( cd "$DIST" && md5sum *.html ) | awk '{print $1, $2}' | sort > "$TMP/local.txt"
sort "$TMP/db.txt" -o "$TMP/db.txt"

DB_N=$(wc -l < "$TMP/db.txt"); LOCAL_N=$(wc -l < "$TMP/local.txt")
if [ "$DB_N" -ne "$LOCAL_N" ]; then
  echo "FAIL: database has $DB_N templates, build has $LOCAL_N." >&2; exit 1
fi
if ! diff -q "$TMP/db.txt" "$TMP/local.txt" > /dev/null; then
  echo "FAIL: checksum mismatch between database and build:" >&2
  diff "$TMP/db.txt" "$TMP/local.txt" >&2 || true
  exit 1
fi
echo "OK: $DB_N templates applied, all $DB_N md5s match the build."

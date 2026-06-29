#!/usr/bin/env bash
#
# Creates a timestamped mongodump snapshot of the local-draw database under
# ./backups/<YYYY-MM-DD_HH-MM-SS>/. Prints the backup location and a ready-to-run
# mongorestore command when complete.
#
# Override the database with MONGO_URL (defaults to the backend's connection
# string), e.g.  MONGO_URL="mongodb://localhost:27017/local-draw" ./backup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
MONGO_URL="${MONGO_URL:-mongodb://localhost:27017/local-draw}"

# Database name = last path segment of the URI, minus any ?query string.
DB_NAME="${MONGO_URL##*/}"
DB_NAME="${DB_NAME%%\?*}"
: "${DB_NAME:=local-draw}"

if ! command -v mongodump > /dev/null 2>&1; then
  echo "Error: mongodump is not installed." >&2
  echo "Install the MongoDB Database Tools: brew install mongodb-database-tools" >&2
  exit 1
fi

if ! pgrep -x mongod > /dev/null 2>&1; then
  echo "Error: MongoDB (mongod) is not running." >&2
  echo "Start it first — e.g. ./start.sh or 'brew services start mongodb-community'." >&2
  exit 1
fi

TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
BACKUP_DIR="$ROOT/backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

# If the dump aborts, don't leave an empty timestamped directory behind. rmdir
# only removes it while empty, so a completed backup is always kept.
trap 'rmdir "$BACKUP_DIR" 2>/dev/null || true' EXIT

echo "Backing up '$DB_NAME' to $BACKUP_DIR ..."
mongodump --uri="$MONGO_URL" --out="$BACKUP_DIR" --quiet

echo ""
echo "Backup complete: $BACKUP_DIR"
echo ""
echo "Restore with:"
echo "  mongorestore --uri=\"$MONGO_URL\" --drop \"$BACKUP_DIR/$DB_NAME\""
echo ""
echo "To restore into a different database, change the database in the --uri."

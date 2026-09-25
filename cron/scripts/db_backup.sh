#!/bin/bash
START_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$START_TIME] [CRON JOB: DB BACKUP] Starting Postgres backup..."

BACKUP_DIR="/backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_dump -h "${POSTGRES_HOST:-postgres}" -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-postgres}" | gzip > "$BACKUP_FILE"

STATUS=$?
END_TIME=$(date '+%Y-%m-%d %H:%M:%S')

if [ $STATUS -eq 0 ]; then
    echo "[$END_TIME] [CRON JOB: DB BACKUP] SUCCESS: Saved to $BACKUP_FILE"
    # Enforce retention policy: delete backups older than 7 days
    DELETED_COUNT=$(find "$BACKUP_DIR" -type f -name "db_backup_*.sql.gz" -mtime +7 -delete -print | wc -l)
    echo "[$END_TIME] [CRON JOB: DB BACKUP] RETENTION POLICY: Deleted $DELETED_COUNT backups older than 7 days."
else
    echo "[$END_TIME] [CRON JOB: DB BACKUP] FAILURE: pg_dump failed with exit code $STATUS"
    exit 1
fi

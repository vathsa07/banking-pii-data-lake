#!/bin/bash
START_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$START_TIME] [CRON JOB: LOG CLEANUP] Starting log maintenance & rotation..."

TARGET_DIRS=("/var/log" "/airflow_logs")
RETENTION_DAYS=7

CLEANED_COUNT=0
for DIR in "${TARGET_DIRS[@]}"; do
    if [ -d "$DIR" ]; then
        COUNT=$(find "$DIR" -type f -name "*.log" -mtime +$RETENTION_DAYS -delete -print 2>/dev/null | wc -l)
        CLEANED_COUNT=$((CLEANED_COUNT + COUNT))
    fi
done

# Also truncate oversized log files > 50MB to avoid disk bloat
find /var/log -type f -name "*.log" -size +50M -exec truncate -s 5M {} \; 2>/dev/null || true

END_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$END_TIME] [CRON JOB: LOG CLEANUP] SUCCESS: Removed $CLEANED_COUNT log files older than $RETENTION_DAYS days."

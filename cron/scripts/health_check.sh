#!/bin/bash
START_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$START_TIME] [CRON JOB: HEALTH CHECK] Executing system health ping..."

PG_HOST="${POSTGRES_HOST:-postgres}"
PG_USER="${POSTGRES_USER:-postgres}"
PG_DB="${POSTGRES_DB:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"

# Create table if not exists
psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_DB" -c "
CREATE TABLE IF NOT EXISTS health_check_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    endpoint VARCHAR(100),
    status_code INT,
    is_healthy BOOLEAN,
    details TEXT
);
" > /dev/null 2>&1 || true

# Ping 1: Backend Health
HTTP_CODE1=$(curl -s -o /dev/null -w "%{http_code}" http://pii_backend:8000/health || echo "000")
IS_HEALTHY1="false"
if [ "$HTTP_CODE1" -eq 200 ]; then
    IS_HEALTHY1="true"
fi

psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_DB" -c "
INSERT INTO health_check_log (endpoint, status_code, is_healthy, details)
VALUES ('/health', $HTTP_CODE1, $IS_HEALTHY1, 'Backend API health check response HTTP $HTTP_CODE1');
" > /dev/null 2>&1 || true

# Ping 2: Gemini/SMTP Test Email
HTTP_CODE2=$(curl -s -o /dev/null -w "%{http_code}" http://pii_backend:8000/ai/test-email || echo "000")
IS_HEALTHY2="false"
if [ "$HTTP_CODE2" -eq 200 ]; then
    IS_HEALTHY2="true"
fi

psql -h "$PG_HOST" -U "$PG_USER" -d "$PG_DB" -c "
INSERT INTO health_check_log (endpoint, status_code, is_healthy, details)
VALUES ('/ai/test-email', $HTTP_CODE2, $IS_HEALTHY2, 'Gemini/SMTP email service status response HTTP $HTTP_CODE2');
" > /dev/null 2>&1 || true

END_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$END_TIME] [CRON JOB: HEALTH CHECK] Completed. Backend: HTTP $HTTP_CODE1, Email: HTTP $HTTP_CODE2."

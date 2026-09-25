#!/bin/bash
set -e

echo "[CRON INIT] Starting Infrastructure Cron Service..."
mkdir -p /backups /var/log/infra_cron_logs
touch /var/log/infra_cron.log

# Ensure initial health check run on startup
/scripts/health_check.sh >> /var/log/infra_cron.log 2>&1 || true

# Start crond in foreground
echo "[CRON STARTED] Crond running in foreground..."
exec crond -f -l 2

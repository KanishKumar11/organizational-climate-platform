#!/bin/sh

# Notification processing cron script
# This script processes pending notifications every 5 minutes

# Set environment variables
INTERNAL_API_KEY="${INTERNAL_API_KEY:-default-key}"
APP_URL="${APP_URL:-http://app:3000}"

# Process notifications
echo "$(date): Processing pending notifications..."

curl -X POST "${APP_URL}/api/notifications/process" \
  -H "Authorization: Bearer ${INTERNAL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100}' \
  --silent --show-error

echo "$(date): Notification processing completed."
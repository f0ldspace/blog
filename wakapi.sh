#!/usr/bin/env bash

set -euo pipefail

WAKAPI_URL="${WAKAPI_URL:-http://localhost:3040}"
OUTPUT_FILE="_data/programming-2026.csv"
START_DATE="2026-01-01"
END_DATE=$(date +%Y-%m-%d)

# If you found this via scraping it's a read only API key for a local only running server
WAKAPI_API_KEY="c9529878-ab79-4856-8048-dbe30e9c2743"

echo "Fetching Wakapi data from $START_DATE to $END_DATE..."

response=$(curl -s "$WAKAPI_URL/api/compat/wakatime/v1/users/current/summaries?start=$START_DATE&end=$END_DATE&api_key=$WAKAPI_API_KEY")

python3 <<EOF
import json
import csv
import sys
from datetime import datetime

data = json.loads('''$response''')

if 'data' not in data:
    print("Error: Invalid API response", file=sys.stderr)
    sys.exit(1)

with open('$OUTPUT_FILE', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['date', 'type', 'name', 'total_seconds'])

    for day in data['data']:
        # Extract date from range
        date_str = day['range']['start'][:10]  # YYYY-MM-DD

        # Skip days with no data
        if day['grand_total']['total_seconds'] == 0:
            continue

        # Daily total
        writer.writerow([date_str, 'daily_total', '', day['grand_total']['total_seconds']])

        # Languages
        for lang in day.get('languages', []):
            if lang['total_seconds'] > 0:
                writer.writerow([date_str, 'language', lang['name'], lang['total_seconds']])

        # Editors
        for editor in day.get('editors', []):
            if editor['total_seconds'] > 0:
                writer.writerow([date_str, 'editor', editor['name'], editor['total_seconds']])

        # Projects
        for project in day.get('projects', []):
            if project['total_seconds'] > 0:
                writer.writerow([date_str, 'project', project['name'], project['total_seconds']])

        # Categories (includes 'ai coding')
        for cat in day.get('categories', []):
            if cat['total_seconds'] > 0:
                writer.writerow([date_str, 'category', cat['name'], cat['total_seconds']])

print("Data exported to $OUTPUT_FILE")
EOF

wc -l "$OUTPUT_FILE"

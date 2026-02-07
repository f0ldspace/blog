#!/usr/bin/env bash

set -euo pipefail

WAKAPI_URL="${WAKAPI_URL:-http://localhost:3040}"
OUTPUT_FILE="_data/programming-2026.csv"
START_DATE="2026-01-01"
END_DATE=$(date +%Y-%m-%d)

# NOTE: If you found this via scraping it's a read only API key for a local only running server
WAKAPI_API_KEY="c9529878-ab79-4856-8048-dbe30e9c2743"

echo "Fetching Wakapi data from $START_DATE to $END_DATE..."

# Fetch summaries
SUMMARIES_FILE=$(mktemp)
curl -s "$WAKAPI_URL/api/compat/wakatime/v1/users/current/summaries?start=$START_DATE&end=$END_DATE&api_key=$WAKAPI_API_KEY" > "$SUMMARIES_FILE"

# Fetch heartbeats for each day to get editor-language correlation
HEARTBEATS_DIR=$(mktemp -d)
current_date="$START_DATE"
while [[ "$current_date" < "$END_DATE" ]] || [[ "$current_date" == "$END_DATE" ]]; do
    echo "Fetching heartbeats for $current_date..."
    curl -s "$WAKAPI_URL/api/compat/wakatime/v1/users/current/heartbeats?date=$current_date&api_key=$WAKAPI_API_KEY" > "$HEARTBEATS_DIR/$current_date.json"
    current_date=$(date -d "$current_date + 1 day" +%Y-%m-%d)
done

python3 << EOF
import json
import csv
import sys
import os
from datetime import datetime
from collections import defaultdict

with open('$SUMMARIES_FILE') as f:
    data = json.load(f)

# Load heartbeats from directory
heartbeats_dir = '$HEARTBEATS_DIR'
heartbeats_raw = {}
for filename in os.listdir(heartbeats_dir):
    if filename.endswith('.json'):
        date_str = filename.replace('.json', '')
        with open(os.path.join(heartbeats_dir, filename)) as f:
            heartbeats_raw[date_str] = json.load(f)

if 'data' not in data:
    print("Error: Invalid API response", file=sys.stderr)
    sys.exit(1)

# Process heartbeats to get editor-language correlation
manual_languages = defaultdict(float)  # language -> total_seconds
ai_languages = defaultdict(float)      # language -> total_seconds

for date_str, hb_data in heartbeats_raw.items():
    if not hb_data:
        continue
    try:
        heartbeats = hb_data.get('data', [])

        # Group consecutive heartbeats and calculate durations
        # Wakapi uses 2-minute timeout by default
        TIMEOUT = 120  # seconds

        for i, hb in enumerate(heartbeats):
            language = hb.get('language', 'Unknown')
            # Editor is embedded in user_agent_id field
            user_agent = hb.get('user_agent_id', '') or ''
            time = hb.get('time', 0)

            # Calculate duration: time until next heartbeat or timeout
            if i + 1 < len(heartbeats):
                next_time = heartbeats[i + 1].get('time', time)
                duration = min(next_time - time, TIMEOUT)
            else:
                duration = TIMEOUT  # Last heartbeat gets full timeout

            if duration <= 0:
                duration = TIMEOUT

            # Categorize by editor (parsed from user agent)
            user_agent_lower = user_agent.lower()
            if 'claude' in user_agent_lower or 'opencode' in user_agent_lower:
                ai_languages[language] += duration
            elif 'neovim' in user_agent_lower or 'vim' in user_agent_lower or 'nvim' in user_agent_lower:
                manual_languages[language] += duration
            # Other editors go to manual
            else:
                manual_languages[language] += duration

    except (TypeError, AttributeError) as e:
        print(f"Warning: Failed to process heartbeats for {date_str}: {e}", file=sys.stderr)
        continue

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

        # Languages (overall)
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

    # Write editor-specific language data (aggregated across all days)
    for lang, secs in manual_languages.items():
        if secs > 0:
            writer.writerow(['', 'manual_language', lang, int(secs)])

    for lang, secs in ai_languages.items():
        if secs > 0:
            writer.writerow(['', 'ai_language', lang, int(secs)])

print("Data exported to $OUTPUT_FILE")
EOF

wc -l "$OUTPUT_FILE"

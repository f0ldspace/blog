sqlite3 ~/.local/share/Anki2/User\ 1/collection.anki2 <<EOF
.headers on
.mode csv
.output _data/anki-all.csv
SELECT
  datetime(id/1000, 'unixepoch') as review_date,
  cid as card_id,
  CASE ease WHEN 1 THEN 'again' WHEN 2 THEN 'hard' WHEN 3 THEN 'good' WHEN 4 THEN 'easy' END as button,
  ivl as interval_days,
  time/1000.0 as time_seconds,
  CASE type WHEN 0 THEN 'learning' WHEN 1 THEN 'review' WHEN 2 THEN 'relearn' END as card_type
FROM revlog
WHERE datetime(id/1000, 'unixepoch') >= '2025-01-01'
ORDER BY id;
.quit
EOF

#!/usr/bin/env bash
# Generate todo.md from unpublished blog posts in _posts/
# Unpublished = filename doesn't start with a digit
# Status from YAML frontmatter: status: doing or status: todo

set -euo pipefail

POSTS_DIR="_posts"
OUTPUT="todo.md"

doing=()
todo=()

for file in "$POSTS_DIR"/*; do
  filename=$(basename "$file")

  # Skip published posts (start with a digit)
  if [[ "$filename" =~ ^[0-9] ]]; then
    continue
  fi

  # Extract status from frontmatter (default: todo)
  status=$(sed -n '/^---$/,/^---$/p' "$file" | { grep '^status:' || true; } | head -1 | sed 's/^status: *//' | tr -d '[:space:]')
  status=${status:-todo}

  # Extract title from frontmatter, fallback to filename-derived
  title=$(sed -n '/^---$/,/^---$/p' "$file" | { grep '^title:' || true; } | head -1 | sed 's/^title: *//')
  if [[ -z "$title" ]]; then
    title=$(echo "${filename%.md}" | sed 's/-/ /g; s/\b\(.\)/\u\1/g')
  fi

  if [[ "$status" == "doing" ]]; then
    doing+=("- $title")
  else
    todo+=("- $title")
  fi
done

{
  echo "# Doing"
  echo ""
  for item in "${doing[@]}"; do
    echo "$item"
  done
  echo ""
  echo "# Todo"
  echo ""
  for item in "${todo[@]}"; do
    echo "$item"
  done
} > "$OUTPUT"

echo "Generated $OUTPUT with ${#doing[@]} doing, ${#todo[@]} todo"

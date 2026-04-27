#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

if command -v poetry >/dev/null 2>&1; then
  poetry run scrapy crawl habr -s LOG_LEVEL="${SCRAPY_LOG_LEVEL:-INFO}" -s CLOSESPIDER_PAGECOUNT="${PAGES:-30}"
elif [[ -f ".venv/bin/activate" ]]; then
  # Fallback for environments without Poetry in PATH.
  source ".venv/bin/activate"
  cd parser
  scrapy crawl habr -s LOG_LEVEL="${SCRAPY_LOG_LEVEL:-INFO}" -s CLOSESPIDER_PAGECOUNT="${PAGES:-30}"
  cd ..
else
  echo "Poetry not found and .venv/bin/activate is missing. Install dependencies first."
  exit 1
fi

git add parser/habr_articles.db

if git diff --cached --quiet; then
  echo "No database changes detected. Nothing to commit."
  exit 0
fi

git commit -m "auto update db $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

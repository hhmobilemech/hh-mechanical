#!/usr/bin/env bash
set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
port="${1:-8080}"

echo "H&H Mechanical preview: http://localhost:$port"
python3 -m http.server "$port" --directory "$project_dir"

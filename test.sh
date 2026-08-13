#!/usr/bin/env bash
set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$project_dir"
node --test --test-reporter=spec tests/diagnostic.test.js tests/startup.test.js tests/vehicle-map.test.js tests/service-area.test.js tests/service-request.test.js tests/phone-config.test.js tests/submission-flow.test.js

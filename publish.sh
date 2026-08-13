#!/bin/bash
set -e

git add .
git commit -m "Update H&H Mechanical website" || true
git push origin main

echo
echo "H&H Mechanical published."
echo "Live site:"
echo "https://hhmobilemech.github.io/hh-mechanical/"

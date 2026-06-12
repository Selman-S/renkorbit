#!/bin/sh
# Regenerate PNG icons for PWA / home screen (macOS sips)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/icons"
mkdir -p "$OUT"

sips -s format png "$ROOT/public/favicon.svg" --out "$OUT/icon-512.png" -z 512 512
sips -z 192 192 "$OUT/icon-512.png" --out "$OUT/icon-192.png"
sips -z 180 180 "$OUT/icon-512.png" --out "$OUT/icon-180.png"

echo "PWA icons written to public/icons/"

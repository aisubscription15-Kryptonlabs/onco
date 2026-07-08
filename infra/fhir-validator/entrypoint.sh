#!/bin/sh
set -e

CACHE_DIR="${CACHE_DIR:-/cache}"
JAR="$CACHE_DIR/validator_cli.jar"
JAR_URL="https://github.com/hapifhir/org.hl7.fhir.core/releases/latest/download/validator_cli.jar"

mkdir -p "$CACHE_DIR"

if [ ! -f "$JAR" ]; then
  echo "[fhir-validator] Downloading HL7 validator JAR (~120 MB, one-time)..."
  curl -L --fail --retry 3 --progress-bar -o "$JAR" "$JAR_URL"
  echo "[fhir-validator] Download complete."
fi

echo "[fhir-validator] Starting HTTP wrapper on :8080"
exec node server.js

#!/usr/bin/env bash
# Validates that Duck Desktop .desktop templates have correct Duck branding
# while preserving the Goose MIME scheme for backward compatibility.
# Run: bash ui/desktop/validate-desktop-templates.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAIL=0

for template in "$SCRIPT_DIR/forge.deb.desktop" "$SCRIPT_DIR/forge.rpm.desktop"; do
  name="$(basename "$template")"

  # Required Duck branding fields
  if ! grep -q '^Name=Duck$' "$template"; then
    echo "FAIL [$name]: Name must be 'Duck'"
    FAIL=1
  fi

  if ! grep -q '^Exec=/usr/lib/duck/Duck %U$' "$template"; then
    echo "FAIL [$name]: Exec must be '/usr/lib/duck/Duck %U'"
    FAIL=1
  fi

  if ! grep -q '^Icon=/usr/share/pixmaps/duck.png$' "$template"; then
    echo "FAIL [$name]: Icon must be '/usr/share/pixmaps/duck.png'"
    FAIL=1
  fi

  # Goose MIME scheme must be preserved
  if ! grep -q '^MimeType=x-scheme-handler/goose;$' "$template"; then
    echo "FAIL [$name]: MimeType must remain 'x-scheme-handler/goose;'"
    FAIL=1
  fi

  # No stale Goose values in Name/Exec/Icon
  if grep -qi '^Name=Goose' "$template"; then
    echo "FAIL [$name]: Stale Name=Goose found"
    FAIL=1
  fi
  if grep -qi '^Exec=/usr/lib/goose' "$template" || grep -qi '^Exec=/usr/lib/Goose' "$template"; then
    echo "FAIL [$name]: Stale Goose Exec path found"
    FAIL=1
  fi
  if grep -qi '^Icon=/usr/share/pixmaps/goose' "$template" || grep -qi '^Icon=/usr/share/pixmaps/Goose' "$template"; then
    echo "FAIL [$name]: Stale Goose Icon path found"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 0 ]; then
  echo "PASS: All desktop templates have correct Duck branding and preserve Goose MIME scheme."
  exit 0
else
  exit 1
fi

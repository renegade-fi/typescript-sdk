#!/bin/bash

# Get the version from the core package.json
CORE_VERSION=$(jq -r '.version' packages/core/package.json)

if [ -z "$CORE_VERSION" ]; then
  echo "Error: Could not find version in packages/core/package.json"
  exit 1
fi

# Update the version in version.ts
VERSION_FILE="packages/core/src/version.ts"
echo "export const version = '$CORE_VERSION'" > "$VERSION_FILE"

echo "Updated version to $CORE_VERSION in $VERSION_FILE" 
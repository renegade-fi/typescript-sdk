#!/bin/bash

check_dependency() {
  local file=$1
  local dep="@renegade-fi/core"
  local expected="workspace:*"

  # Use jq to extract the dependency version
  local actual_version=$(jq -r ".dependencies[\"$dep\"]" "$file")

  # Debug: log what is being read and expected
  echo "Checking in file: $file"
  echo "Actual version: $actual_version"
  echo "Expected version: $expected"

  if [ "$actual_version" != "$expected" ]; then
    echo "Error: $dep in $file is not set to $expected, found $actual_version"
    exit 1
  fi
}

# List of package.json files to check
files=("packages/react/package.json" "packages/node/package.json")

for file in "${files[@]}"; do
  check_dependency "$file"
done

echo "All dependencies are correct."
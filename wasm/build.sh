#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_NAME="index"
OUTPUT_DIR="$SCRIPT_DIR/../packages/direct-match/renegade-sdk-wasm"
TARGET="nodejs"

for arg in "$@"
do
    if [ "$arg" == "--web" ]; then
        TARGET="web"
    fi
done

cd "$SCRIPT_DIR"
wasm-pack build --target $TARGET --out-dir $OUTPUT_DIR --out-name $OUTPUT_NAME

rm -f $OUTPUT_DIR/.gitignore

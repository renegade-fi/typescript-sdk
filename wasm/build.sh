#!/bin/bash

OUTPUT_NAME="index"

# Check for --node flag
OUTPUT_DIR="../packages/react/renegade-utils"
TARGET="web"
for arg in "$@"
do
    if [ "$arg" == "--test" ]; then
        TARGET="bundler"
    elif [ "$arg" == "--node" ]; then
        TARGET="nodejs"
        OUTPUT_DIR="../packages/node/renegade-utils"
    fi
done

# Build the WebAssembly package with conditional target
wasm-pack build --target $TARGET --out-dir $OUTPUT_DIR --out-name $OUTPUT_NAME

# Copy the .d.ts file to the core package
if [ "$TARGET" == "nodejs" ]; then
    cp $OUTPUT_DIR/$OUTPUT_NAME.d.ts ../packages/core/src/utils.d.ts
fi


# Delete the .gitignore file so the package is included
rm $OUTPUT_DIR/.gitignore


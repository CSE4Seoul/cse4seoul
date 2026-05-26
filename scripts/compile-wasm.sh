#!/bin/bash

# Configuration
EMCC="./emsdk/upstream/emscripten/emcc"
SRC_DIR="components"
JS_OUT_DIR="lib/wasm"

mkdir -p $JS_OUT_DIR

# Check if emcc exists
if [ ! -f "$EMCC" ]; then
    echo "Error: emcc not found at $EMCC"
    exit 1
fi

# Function to compile a C++ file
compile_wasm() {
    local src_file=$1
    local name=$(basename "$src_file" .cpp | tr '[:upper:]' '[:lower:]')
    local out_js="$JS_OUT_DIR/$name.js"
    
    echo "Compiling $src_file to $out_js..."
    
    $EMCC "$src_file" --bind -o "$out_js" \
        -s MODULARIZE=1 \
        -s EXPORT_ES6=0 \
        -s ENVIRONMENT='web,worker' \
        -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "HEAPF64", "HEAP32"]' \
        -s EXPORTED_FUNCTIONS='["_malloc", "_free"]' \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s SINGLE_FILE=1 \
        -O3
        
    if [ $? -eq 0 ]; then
        echo "Successfully compiled $name"
    else
        echo "Failed to compile $name"
    fi
}

# Compile specific file if provided, otherwise compile all in components/
if [ -n "$1" ]; then
    compile_wasm "$1"
else
    for f in $SRC_DIR/*.cpp; do
        if [ -e "$f" ]; then
            compile_wasm "$f"
        fi
    done
fi

#!/bin/bash

# emscripten binaries need to be in your $PATH, run "source ./emsdk_env.sh" in the emscripten installation directory to do that

emcc Whirlpool.c  Whirlpool_constants_0.c  Whirlpool_constants.c  Whirlpool_constants_T.c  whirlpool-wasm.c -O3 -o dist/whirlpool.js -s MODULARIZE=1 -s 'EXPORT_NAME="createWhirlpoolModule"' -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s EXPORTED_FUNCTIONS="['_malloc', '_free']" -s WASM=1

if [ $? == 0 ]; then
  cat dist/whirlpool.js wrapper/wrapper.js > dist/whirlpool-wasm.js ;
  rm dist/whirlpool.js
fi


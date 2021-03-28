#include <emscripten/emscripten.h>
#include <stddef.h>
#include <stdlib.h>

#include "Whirlpool.h"

EMSCRIPTEN_KEEPALIVE
NESSIEstruct* whirlpool_init(unsigned int version) {
  NESSIEstruct* state = malloc(sizeof(NESSIEstruct));

  if (state == NULL)
    return NULL;

  NESSIEinit(state, version);

  return state;
}

EMSCRIPTEN_KEEPALIVE
void whirlpool_update(NESSIEstruct* state, const unsigned char *data, size_t len) {
  if (state == NULL)
    return;

  NESSIEadd(data, len, state);
}

EMSCRIPTEN_KEEPALIVE
void whirlpool_final(NESSIEstruct* state, unsigned char* digest) {
  if (state == NULL)
    return;

  NESSIEfinalize(state, digest);
}

EMSCRIPTEN_KEEPALIVE
void whirlpool_cleanup(NESSIEstruct* state) {
  if (state != NULL)
    free(state);
}


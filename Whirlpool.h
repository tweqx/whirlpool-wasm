#ifndef WHIRLPOOL_H
#define WHIRLPOOL_H

#include "nessie.h"

// Parameters
#define WHIRLPOOL_0 0
#define WHIRLPOOL_T 1
#define WHIRLPOOL 2 /* Latest version */

void NESSIEinit(struct NESSIEstruct * const structpointer, unsigned int version);
void NESSIEadd(const unsigned char * const source,
               unsigned long sourceBits,
               struct NESSIEstruct * const structpointer);
void NESSIEfinalize(struct NESSIEstruct * const structpointer,
                    unsigned char * const result);

#endif

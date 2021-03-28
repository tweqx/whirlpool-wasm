/* don't remove this line */
if (typeof createWhirlpoolModule === 'undefined') {
  createWhirlpoolModule = Promise.reject(new Error('whirlpool wasm module was not available'));
}

var whirlpool = {
  internal: {
    module: null,
    bytesFromBuffer: function(internalBuffer, bufLen) {
      const resultView = new Uint8Array(this.module.HEAP8.buffer, internalBuffer, bufLen); // view, not a copy
      const result = new Uint8Array(resultView); // copy, not a view!
      return result;
    },

    bufferFromBytes: function(bytes) {
      var internalBuffer = this.create_buffer(bytes.length);
      this.applyBytesToBuffer(bytes, internalBuffer);
      return internalBuffer;
    },
    applyBytesToBuffer: function(bytes, internalBuffer) {
      this.module.HEAP8.set(bytes, internalBuffer);
    },
    toHex: function(bytes) {
      return Array.prototype.map.call(bytes, function(n) {
        return (n < 16 ? '0' : '') + n.toString(16)
      }).join('');
    },
    inputToBytes: function (input) {
      if (input instanceof Uint8Array)
        return input;
      else if (typeof input === 'string')
        return (new TextEncoder()).encode(input);
      else
        throw new Error('Input must be an string, Buffer or Uint8Array');
    }
  },

  /**
   * Checks if Whirlpool support is ready (WASM Module loaded)
   * @return {Boolean}
   */
  isReady: function() {
    return whirlpool.internal.module !== null;
  },

  /**
   *  Whirlpool versions.
   */
  WHIRLPOOL: 2,
  WHIRLPOOL_T: 1,
  WHIRLPOOL_0: 0,

  /**
   * Initializes a Hashing Context for Hash
   * @param {Number} version the whirlpool version to use. Can be whirlpool.WHIRLPOOL_0, whirlpool.WHIRLPOOL_T or whirlpool.WHIRLPOOL (default)
   * @return {Object} the context object for this hashing session. Should only be used to hash one data source.
   */
  init: function(version) {
    if (version === undefined || typeof version !== 'number' || (version != whirlpool.WHIRLPOOL && version != whirlpool.WHIRLPOOL_T && version != whirlpool.WHIRLPOOL_0))
      version = whirlpool.WHIRLPOOL;

    return {
      'digest_size': 512,
      'context': whirlpool.internal.init(version)
    };
  },

  /**
   * Update the hashing context with new input data
   * @param {Object} contextObject the context object for this hashing session
   * @param {Uint8Array} bytes an array of bytes to hash
   */
  update: function(contextObject, bytes) {
    var inputBuffer = whirlpool.internal.bufferFromBytes(bytes);

    whirlpool.internal.update(contextObject.context, inputBuffer, bytes.length * 8);

    whirlpool.internal.destroy_buffer(inputBuffer);
  },

  /**
   * Update the hashing context with new input data
   * @param {Object} contextObject the context object for this hashing session
   * @param {Object} value the value to use as bytes to update the hash calculation. Must be String or Uint8Array.
   */
   updateFromValue: function(contextObject, value) {
     whirlpool.update(contextObject, whirlpool.internal.inputToBytes(value));
   },

  /**
   * Finalizes the hashing session and produces digest ("hash") bytes.
   * Size of the returned array is always 512/8 bytes long.
   * This method does not clean up the hashing context - be sure to call cleanup(ctx) !
   * @param {Object} contextObject the context object for this hashing session
   * @return {Uint8Array} an array of bytes representing the raw digest ("hash") value.
   */
  final: function(contextObject) {
    var digestByteLen = contextObject.digest_size / 8;
    var digestBuffer = whirlpool.internal.create_buffer(digestByteLen);

    whirlpool.internal.final(contextObject.context, digestBuffer);

    var digestBytes = whirlpool.internal.bytesFromBuffer(digestBuffer, digestByteLen);
    whirlpool.internal.destroy_buffer(digestBuffer);
    return digestBytes;
  },

  /**
   * Cleans up and releases the Context object for the (now ended) hashing session.
   * @param {Object} contextObject the context object for this hashing session
   */
  cleanup: function(contextObject) {
    whirlpool.internal.cleanup(contextObject.context);
  },

  /**
   * Calculates the whirlpool message digest ("hash") for the input bytes or string
   * @param {Object} input the input value to hash - either Uint8Array or String
   * @param {Number} version the whirlpool version to use. Can be whirlpool.WHIRLPOOL_0, whirlpool.WHIRLPOOL_T or whirlpool.WHIRLPOOL (default)
   * @return {Uint8Array} an array of bytes representing the raw digest ("hash") value.
   */
  digest: function(input, version) {
    input = whirlpool.internal.inputToBytes(input);

    var ctx = whirlpool.init(version);
    whirlpool.update(ctx, input);
    var bytes = whirlpool.final(ctx);
    whirlpool.cleanup(ctx);

    return bytes;
  },

  /**
   * Calculates the whirlpool message digest ("hash") for the input bytes or string
   * @param {Object} input the input value to hash - either Uint8Array or String
   * @param {Number} version the whirlpool version to use. Can be whirlpool.WHIRLPOOL_0, whirlpool.WHIRLPOOL_T or whirlpool.WHIRLPOOL (default)
   * @return {String} a hexadecimal representation of the digest ("hash") bytes.
   */
  digestHex: function(input, version) {
    var bytes = whirlpool.digest(input, version);
    return whirlpool.internal.toHex(bytes);
  }
};

createWhirlpoolModule().then(async module => {
  // Memory allocations helpers
  whirlpool.internal.create_buffer  = module.cwrap('malloc', 'number', ['number']);
  whirlpool.internal.destroy_buffer = module.cwrap('free',   '',       ['number']);

  whirlpool.internal.init    = module.cwrap('whirlpool_init',    'number', ['number']);
  whirlpool.internal.update  = module.cwrap('whirlpool_update',  '',       ['number','number','number']);
  whirlpool.internal.final   = module.cwrap('whirlpool_final',   '',       ['number','number']);
  whirlpool.internal.cleanup = module.cwrap('whirlpool_cleanup', '',       ['number']);
  whirlpool.internal.module  = module;
});


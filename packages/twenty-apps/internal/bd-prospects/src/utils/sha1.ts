const BLOCK_SIZE_BYTES = 64;

const rotateLeft = (value: number, shift: number): number =>
  ((value << shift) | (value >>> (32 - shift))) >>> 0;

// RFC 3174, written out rather than pulled from `crypto`: the same id has to be
// computed by the cron job (Node) and by the import wizard (browser sandbox,
// where node builtins are not available and Web Crypto is async only).
export const sha1 = (message: Uint8Array): Uint8Array => {
  const messageLengthBits = message.length * 8;
  const paddedLength =
    (Math.floor((message.length + 8) / BLOCK_SIZE_BYTES) + 1) *
    BLOCK_SIZE_BYTES;
  const padded = new Uint8Array(paddedLength);

  padded.set(message);
  padded[message.length] = 0x80;

  const view = new DataView(padded.buffer);

  view.setUint32(paddedLength - 8, Math.floor(messageLengthBits / 0x100000000));
  view.setUint32(paddedLength - 4, messageLengthBits >>> 0);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const words = new Uint32Array(80);

  for (
    let blockStart = 0;
    blockStart < paddedLength;
    blockStart += BLOCK_SIZE_BYTES
  ) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(blockStart + index * 4);
    }

    for (let index = 16; index < 80; index += 1) {
      words[index] = rotateLeft(
        words[index - 3] ^
          words[index - 8] ^
          words[index - 14] ^
          words[index - 16],
        1,
      );
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let index = 0; index < 80; index += 1) {
      let f: number;
      let k: number;

      if (index < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (index < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (index < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (rotateLeft(a, 5) + f + e + k + words[index]) >>> 0;

      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const digest = new Uint8Array(20);
  const digestView = new DataView(digest.buffer);

  digestView.setUint32(0, h0);
  digestView.setUint32(4, h1);
  digestView.setUint32(8, h2);
  digestView.setUint32(12, h3);
  digestView.setUint32(16, h4);

  return digest;
};

export const toHex = (bytes: Uint8Array): string =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

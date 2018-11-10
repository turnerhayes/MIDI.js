/* Wrapper for accessing strings through sequential reads */
function Stream(str) {
  let position = 0;

  function read(length) {
    const result = str.substr(position, length);
    position += length;
    return result;
  }

  /* read a big-endian 32-bit integer */
  function readInt32() {
    const result = (
      // tslint:disable-next-line:no-bitwise
      (str.charCodeAt(position) << 24)
      // tslint:disable-next-line:no-bitwise
      + (str.charCodeAt(position + 1) << 16)
      // tslint:disable-next-line:no-bitwise
      + (str.charCodeAt(position + 2) << 8)
      + str.charCodeAt(position + 3));
    position += 4;
    return result;
  }

  /* read a big-endian 16-bit integer */
  function readInt16() {
    const result = (
      // tslint:disable-next-line:no-bitwise
      (str.charCodeAt(position) << 8)
      + str.charCodeAt(position + 1));
    position += 2;
    return result;
  }

  /* read an 8-bit integer */
  function readInt8(signed = false) {
    let result = str.charCodeAt(position);
    if (signed && result > 127) { result -= 256; }
    position += 1;
    return result;
  }

  function eof() {
    return position >= str.length;
  }

  /* read a MIDI-style variable-length integer
    (big-endian value in groups of 7 bits,
    with top bit set to signify that another byte follows)
  */
  function readVarInt() {
    let result = 0;
    while (true) {
      const b = readInt8();
      // tslint:disable-next-line:no-bitwise
      if (b & 0x80) {
        // tslint:disable-next-line:no-bitwise
        result += (b & 0x7f);
        // tslint:disable-next-line:no-bitwise
        result <<= 7;
      } else {
        /* b is the last byte */
        return result + b;
      }
    }
  }

  return {
    eof,
    read,
    readInt16,
    readInt32,
    readInt8,
    readVarInt,
  };
}

export default Stream;

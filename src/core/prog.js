/* Программирование и данные: IEEE-754, Base64, URL-кодирование, CRC32, юникод.
 *
 * Чистые функции без DOM. Файл самодостаточен для file://.
 */
'use strict';
window.CW = window.CW || {};
window.CW.prog = (function () {
  /** Кодирование строки в байты UTF-8 (без TextEncoder — для совместимости). */
  function utf8Bytes(str) {
    const s = String(str);
    const out = [];
    for (let i = 0; i < s.length; i++) {
      let c = s.charCodeAt(i);
      if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
        const c2 = s.charCodeAt(i + 1);
        if (c2 >= 0xdc00 && c2 <= 0xdfff) {
          c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
          i++;
        }
      }
      if (c < 0x80) {
        out.push(c);
      } else if (c < 0x800) {
        out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else if (c < 0x10000) {
        out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      } else {
        out.push(
          0xf0 | (c >> 18),
          0x80 | ((c >> 12) & 0x3f),
          0x80 | ((c >> 6) & 0x3f),
          0x80 | (c & 0x3f)
        );
      }
    }
    return out;
  }

  function utf8FromBytes(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length;) {
      const b = bytes[i++];
      let cp;
      if (b < 0x80) {
        cp = b;
      } else if (b < 0xe0) {
        cp = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
      } else if (b < 0xf0) {
        cp = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      } else {
        cp =
          ((b & 0x07) << 18) |
          ((bytes[i++] & 0x3f) << 12) |
          ((bytes[i++] & 0x3f) << 6) |
          (bytes[i++] & 0x3f);
      }
      if (cp > 0xffff) {
        cp -= 0x10000;
        out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
      } else {
        out += String.fromCharCode(cp);
      }
    }
    return out;
  }

  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  function base64Encode(str) {
    const bytes = utf8Bytes(str);
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i];
      const b1 = bytes[i + 1];
      const b2 = bytes[i + 2];
      out += B64[b0 >> 2];
      out += B64[((b0 & 3) << 4) | ((b1 || 0) >> 4)];
      out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | ((b2 || 0) >> 6)] : '=';
      out += i + 2 < bytes.length ? B64[b2 & 63] : '=';
    }
    return out;
  }

  function base64Decode(str) {
    const s = String(str).replace(/[^A-Za-z0-9+/=]/g, '');
    const bytes = [];
    for (let i = 0; i < s.length; i += 4) {
      const e0 = B64.indexOf(s[i]);
      const e1 = B64.indexOf(s[i + 1]);
      const c2 = s[i + 2];
      const c3 = s[i + 3];
      const e2 = c2 === '=' ? 0 : B64.indexOf(c2);
      const e3 = c3 === '=' ? 0 : B64.indexOf(c3);
      bytes.push((e0 << 2) | (e1 >> 4));
      if (c2 !== '=') {
        bytes.push(((e1 & 15) << 4) | (e2 >> 2));
      }
      if (c3 !== '=') {
        bytes.push(((e2 & 3) << 6) | e3);
      }
    }
    return utf8FromBytes(bytes);
  }

  /** Код(ы) символов строки: [{char, code, hex}]. */
  function charCodes(str) {
    const s = String(str);
    const out = [];
    for (let i = 0; i < s.length; i++) {
      const code = s.codePointAt(i);
      out.push({
        char: String.fromCodePoint(code),
        code: code,
        hex: 'U+' + code.toString(16).toUpperCase().padStart(4, '0'),
      });
      if (code > 0xffff) {
        i++;
      }
    }
    return out;
  }

  const CRC_TABLE = (function () {
    const table = new Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  /** CRC32 строки (UTF-8) — восьмиричная строка, как в zip/png. */
  function crc32(str) {
    const bytes = utf8Bytes(str);
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    }
    return ((c ^ 0xffffffff) >>> 0).toString(16).toUpperCase().padStart(8, '0');
  }

  /** Разбор double по IEEE-754: знак, порядок, мантисса, hex, биты. */
  function ieee754(value) {
    const v = Number(value);
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setFloat64(0, v, false);
    const hi = view.getUint32(0, false);
    const lo = view.getUint32(4, false);
    const sign = hi >>> 31;
    const exponent = (hi >>> 20) & 0x7ff;
    const mantHi = hi & 0xfffff;
    let bits = '';
    for (let i = 0; i < 32; i++) {
      bits += (hi >>> (31 - i)) & 1;
    }
    for (let i = 0; i < 32; i++) {
      bits += (lo >>> (31 - i)) & 1;
    }
    const hex =
      '0x' +
      hi.toString(16).toUpperCase().padStart(8, '0') +
      lo.toString(16).toUpperCase().padStart(8, '0');
    return {
      sign: sign,
      exponent: exponent,
      bias: exponent === 0 ? 1 : 1023,
      unbiased: exponent === 0 ? 1 - 1023 : exponent - 1023,
      mantissa: (mantHi / Math.pow(2, 20) + lo / Math.pow(2, 52)).toFixed(15),
      hex: hex,
      bits: bits,
    };
  }

  return {
    utf8Bytes: utf8Bytes,
    utf8FromBytes: utf8FromBytes,
    base64Encode: base64Encode,
    base64Decode: base64Decode,
    charCodes: charCodes,
    crc32: crc32,
    ieee754: ieee754,
  };
})();

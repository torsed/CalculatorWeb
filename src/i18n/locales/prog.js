/* Строки вкладки «Программирование». */
'use strict';
(function () {
  const i18n = window.CW.i18n;
  i18n.add('ru', {
    'prog.fn.fromBase': 'Из base N → десятичное  D = parse(N, base)',
    'prog.fn.toBase': 'Из десятичного → base N  R = D.toString(base)',
    'prog.fn.network': 'IPv4: адрес сети  network = IP & mask',
    'prog.fn.broadcast': 'IPv4: широковещательный  broadcast = IP | (~mask)',
    'prog.fn.hosts': 'IPv4: число хостов  hosts = 2^(32−CIDR) − 2',
    'prog.fn.mask': 'CIDR → маска',
    'prog.fn.ieee754': 'IEEE-754 → hex (двойная точность)',
    'prog.fn.ieeeBits': 'IEEE-754 → биты',
    'prog.fn.base64enc': 'Base64: кодировать текст',
    'prog.fn.base64dec': 'Base64: декодировать',
    'prog.fn.urlenc': 'URL: кодировать',
    'prog.fn.urldec': 'URL: декодировать',
    'prog.fn.crc32': 'CRC32 строки (hex)',
    'prog.fn.chars': 'Коды символов (Unicode)',
    'prog.param': 'Параметр {n}',
    'prog.hint':
      'Base: основания 2/8/10/16. IP: формат 192.168.0.1, маска как /24. ' +
      'Оставьте пустым поле с искомой величиной.',
    'prog.err.notNumber': 'Не число',
    'prog.err.ipv4Octets': 'IPv4 должен быть 4 октета через точку',
    'prog.err.octetRange': 'Октет вне диапазона 0..255: {p}',
    'prog.err.cidrRange': 'CIDR должен быть 0..32',
  });
  i18n.add('en', {
    'prog.fn.fromBase': 'From base N → decimal  D = parse(N, base)',
    'prog.fn.toBase': 'From decimal → base N  R = D.toString(base)',
    'prog.fn.network': 'IPv4: network address  network = IP & mask',
    'prog.fn.broadcast': 'IPv4: broadcast  broadcast = IP | (~mask)',
    'prog.fn.hosts': 'IPv4: number of hosts  hosts = 2^(32−CIDR) − 2',
    'prog.fn.mask': 'CIDR → mask',
    'prog.fn.ieee754': 'IEEE-754 → hex (double precision)',
    'prog.fn.ieeeBits': 'IEEE-754 → bits',
    'prog.fn.base64enc': 'Base64: encode text',
    'prog.fn.base64dec': 'Base64: decode',
    'prog.fn.urlenc': 'URL: encode',
    'prog.fn.urldec': 'URL: decode',
    'prog.fn.crc32': 'CRC32 of a string (hex)',
    'prog.fn.chars': 'Character codes (Unicode)',
    'prog.param': 'Parameter {n}',
    'prog.hint':
      'Base: bases 2/8/10/16. IP: format 192.168.0.1, mask as /24. ' +
      'Leave the field for the desired value empty.',
    'prog.err.notNumber': 'Not a number',
    'prog.err.ipv4Octets': 'IPv4 must be 4 octets separated by dots',
    'prog.err.octetRange': 'Octet out of range 0..255: {p}',
    'prog.err.cidrRange': 'CIDR must be 0..32',
  });
})();

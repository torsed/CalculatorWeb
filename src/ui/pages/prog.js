/* Программирование / данные.
 *
 * Часть pages/: вкладки приложения. Файл самодостаточен для file:// —
 * грузится обычным <script> после core/* и до ui/app.js, регистрируется
 * в window.CW.pages. См. комментарий про window.CW в index.html.
 */
'use strict';
window.CW = window.CW || {};
window.CW.pages = window.CW.pages || {};
/* Общие helpers (F, el) — см. src/ui/pages/helpers.js. */
(function () {
  const F = window.CW.pages._helpers.F();
  const el = window.CW.pages._helpers.el;
  const t = window.CW.i18n.t;
  const U = window.CW.i18n.unit;
  // ── Программирование / данные ────────────────────────────

  /** Перевод из строки в base N в десятичное. */
  function fromBase(text, base) {
    const s = String(text || '')
      .trim()
      .toLowerCase();
    if (!s) {
      return NaN;
    }
    if (base === 16 && s.startsWith('0x')) {
      return parseInt(s.slice(2), 16);
    }
    return parseInt(s, base);
  }

  /** Перевод десятичного числа в строку в base N. */
  function toBase(value, base) {
    if (!Number.isFinite(value)) {
      throw { message: t('prog.err.notNumber') };
    }
    if (base === 16) {
      return '0x' + Math.trunc(value).toString(16).toUpperCase();
    }
    return Math.trunc(value).toString(base);
  }

  /** IPv4 строка → массив из 4 октетов. */
  function parseIPv4(text) {
    const parts = String(text || '').split('.');
    if (parts.length !== 4) {
      throw { message: t('prog.err.ipv4Octets') };
    }
    const out = parts.map(function (p) {
      const n = parseInt(p, 10);
      if (!Number.isInteger(n) || n < 0 || n > 255) {
        throw { message: t('prog.err.octetRange', { p: p }) };
      }
      return n;
    });
    return out;
  }

  /** CIDR → маска по октетам. */
  function cidrToMask(cidr) {
    if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) {
      throw { message: t('prog.err.cidrRange') };
    }
    const m = new Array(4);
    for (let i = 0; i < 4; i++) {
      const bits = Math.max(0, Math.min(8, cidr - 8 * i));
      m[i] = bits === 0 ? 0 : (0xff << (8 - bits)) & 0xff;
    }
    return m;
  }

  /** Побитовое AND двух IPv4. */
  function andIPv4(a, b) {
    return a.map(function (v, i) {
      return v & b[i];
    });
  }

  /** Побитовое OR двух IPv4. */
  function orIPv4(a, b) {
    return a.map(function (v, i) {
      return v | b[i];
    });
  }

  /** IPv4 → строка. */
  function ipToString(a) {
    return a.join('.');
  }

  /** @type {FormulaSpec[]} */
  const PROG_FUNCS = [
    [
      t('prog.fn.fromBase'),
      ['n', 'base'],
      function (v) {
        return ['D', String(fromBase(v.n, v.base)), ''];
      },
    ],
    [
      t('prog.fn.toBase'),
      ['n', 'base'],
      function (v) {
        return ['R', toBase(F.toNumber(v.n), v.base), ''];
      },
    ],
    [
      t('prog.fn.network'),
      ['net', 'd', 'm'],
      function (v) {
        const ip = parseIPv4(v.d);
        const cidr = parseInt(String(v.m).replace(/^\/+/, ''), 10);
        const mask = cidrToMask(cidr);
        return ['net', ipToString(andIPv4(ip, mask)), ''];
      },
    ],
    [
      t('prog.fn.broadcast'),
      ['bcast', 'd', 'm'],
      function (v) {
        const ip = parseIPv4(v.d);
        const cidr = parseInt(String(v.m).replace(/^\/+/, ''), 10);
        const mask = cidrToMask(cidr);
        const inv = mask.map(function (x) {
          return x ^ 0xff;
        });
        return ['broadcast', ipToString(orIPv4(ip, inv)), ''];
      },
    ],
    [
      t('prog.fn.hosts'),
      ['hosts', 'm'],
      function (v) {
        const cidr = parseInt(String(v.m).replace(/^\/+/, ''), 10);
        if (cidr >= 31) {
          return ['hosts', 0, ''];
        }
        return ['hosts', Math.pow(2, 32 - cidr) - 2, ''];
      },
    ],
    [
      t('prog.fn.mask'),
      ['mask', 'm'],
      function (v) {
        const cidr = parseInt(String(v.m).replace(/^\/+/, ''), 10);
        return ['mask', ipToString(cidrToMask(cidr)), ''];
      },
    ],
  ];

  function mountProg(app) {
    const page = app.pageNodes.prog;
    page.innerHTML = '';

    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('common.brand')));
    const sel = el('select', 'field');
    PROG_FUNCS.forEach(function (f, i) {
      const o = el('option', null, f[0]);
      o.value = String(i);
      sel.appendChild(o);
    });
    card.appendChild(sel);

    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const inputs = [];
    let maxKeys = 0;
    PROG_FUNCS.forEach(function (f) {
      if (f[1].length > maxKeys) {
        maxKeys = f[1].length;
      }
    });
    for (let i = 0; i < maxKeys; i++) {
      const f = el('input', 'field');
      f.type = 'text';
      const initKey = PROG_FUNCS[0][1][i] || t('prog.param', { n: i + 1 });
      f.placeholder = initKey;
      f.setAttribute('aria-label', initKey);
      row.appendChild(f);
      inputs.push(f);
    }
    card.appendChild(row);
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);

    function refreshInputs() {
      const keys = PROG_FUNCS[parseInt(sel.value, 10)][1];
      inputs.forEach(function (f, i) {
        if (i < keys.length) {
          f.style.display = '';
          f.placeholder = keys[i];
          f.setAttribute('aria-label', keys[i]);
        } else {
          f.style.display = 'none';
          f.value = '';
          f.placeholder = '';
        }
      });
    }
    sel.onchange = refreshInputs;
    refreshInputs();

    function run() {
      try {
        const spec = PROG_FUNCS[parseInt(sel.value, 10)];
        const keys = spec[1];
        const vals = {};
        keys.forEach(function (k, i) {
          vals[k] = inputs[i].value;
        });
        // Программирование — все формулы «вычислительные»: нет требования
        // «ровно одно пустое». Заполняем все поля — получаем результат.
        // 'base' всегда число; 'm' (CIDR) тоже.
        if (vals.base !== undefined && vals.base !== '') {
          vals.base = F.toNumber(vals.base);
        }
        if (vals.m !== undefined && vals.m !== '') {
          vals.m = F.toNumber(vals.m);
        }
        const res = spec[2](vals);
        const outVal = typeof res[1] === 'number' ? F.fmt(res[1]) : res[1];
        out.textContent = res[0] + ' = ' + outVal + ' ' + U(res[2]);
        out.classList.remove('err');
      } catch (e) {
        out.textContent = e.message || String(e);
        out.classList.add('err');
      }
    }
    const btn = el('button', 'btn primary', t('common.solve'));
    btn.onclick = run;
    const brow = el('div', 'row');
    brow.style.marginTop = '8px';
    brow.appendChild(btn);
    card.appendChild(brow);

    const hint = el('div', 'hint', t('prog.hint'));
    card.appendChild(hint);
    page.appendChild(card);
  }

  window.CW.pages.mountProg = mountProg;
})();

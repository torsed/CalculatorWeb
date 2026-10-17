/* Рендер страницы калькулятора: кнопки, дисплей, клавиатура, история. */
'use strict';
window.CW = window.CW || {};
window.CW.calcView = (function () {
  const P = window.CW.parser;
  const F = window.CW.format;
  const CS = window.CW.calcState;
  const t = window.CW.i18n.t;

  // Доступные имена кнопок (WCAG 2.5.3: имя понятно без контекста).
  const KEY_NAME_KEYS = [
    'clear',
    'negate',
    'percent',
    'op:div',
    'op:mul',
    'op:sub',
    'op:add',
    'op:pow',
    'op:mod',
    'dot',
    'eq',
    'backspace',
    'fn:^2',
    'fn:!',
    'fn:inv',
    'insert:√(',
    'insert:sin(',
    'insert:cos(',
    'insert:tan(',
    'insert:ln(',
    'insert:log(',
    'insert:exp(',
    'insert:pi',
    'insert:e',
    'insert:i',
    'insert:(',
    'insert:)',
  ];
  const KEY_NAMES = {};
  KEY_NAME_KEYS.forEach(function (k) {
    KEY_NAMES[k] = t('calc.btn.' + k);
  });

  const BASIC_KEYS = [
    { label: 'C', kind: 'util', act: 'clear' },
    { label: '±', kind: 'util', act: 'negate' },
    { label: '%', kind: 'util', act: 'percent' },
    { label: '÷', kind: 'op', act: 'op:div' },
    { label: '7' },
    { label: '8' },
    { label: '9' },
    { label: '×', kind: 'op', act: 'op:mul' },
    { label: '4' },
    { label: '5' },
    { label: '6' },
    { label: '−', kind: 'op', act: 'op:sub' },
    { label: '1' },
    { label: '2' },
    { label: '3' },
    { label: '+', kind: 'op', act: 'op:add' },
    { label: '0', wide: true },
    { label: ',', kind: 'util', act: 'dot' },
    { label: '=', kind: 'op', act: 'eq' },
  ];

  const SCI_KEYS = [
    { label: 'x²', kind: 'sci', act: 'fn:^2' },
    { label: 'xʸ', kind: 'sci', act: 'op:pow' },
    { label: '√', kind: 'sci', act: 'insert:√(' },
    { label: '1/x', kind: 'sci', act: 'fn:inv' },
    { label: 'n!', kind: 'sci', act: 'fn:!' },
    { label: 'mod', kind: 'sci', act: 'op:mod' },
    { label: 'sin', kind: 'sci', act: 'insert:sin(' },
    { label: 'cos', kind: 'sci', act: 'insert:cos(' },
    { label: 'tan', kind: 'sci', act: 'insert:tan(' },
    { label: 'ln', kind: 'sci', act: 'insert:ln(' },
    { label: 'log', kind: 'sci', act: 'insert:log(' },
    { label: 'eˣ', kind: 'sci', act: 'insert:exp(' },
    { label: 'π', kind: 'sci', act: 'insert:pi' },
    { label: 'e', kind: 'sci', act: 'insert:e' },
    { label: 'i', kind: 'sci', act: 'insert:i' },
    { label: '(', kind: 'sci', act: 'insert:(' },
    { label: ')', kind: 'sci', act: 'insert:)' },
    { label: '⌫', kind: 'util', act: 'backspace' },
  ];

  const PROG_KEYS = [
    { label: 'A', kind: 'sci', act: 'hex:A' },
    { label: 'B', kind: 'sci', act: 'hex:B' },
    { label: 'C', kind: 'sci', act: 'hex:C' },
    { label: 'D', kind: 'sci', act: 'hex:D' },
    { label: 'E', kind: 'sci', act: 'hex:E' },
    { label: 'F', kind: 'sci', act: 'hex:F' },
    { label: 'AND', kind: 'sci', act: 'bin:&' },
    { label: 'OR', kind: 'sci', act: 'bin:|' },
    { label: 'XOR', kind: 'sci', act: 'bin:xor' },
    { label: 'NOT', kind: 'sci', act: 'bin:not' },
    { label: 'SHL', kind: 'sci', act: 'bin:<<' },
    { label: 'SHR', kind: 'sci', act: 'bin:>>' },
  ];

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) {
      n.className = cls;
    }
    if (text !== undefined) {
      n.textContent = text;
    }
    return n;
  }

  function CalcView(root, history) {
    this.root = root;
    this.history = history;
    this.st = new CS.CalcState();
    this.progBase = 16;
    this._build();
    this._bindKeys();
  }

  CalcView.prototype._build = function () {
    const self = this;
    this.root.innerHTML = '';
    const wrap = el('div', 'calc');
    const leftCol = el('div', 'calc-left');

    // ── Дисплей ──
    // WCAG 4.1.3: результат — живой регион, объявляется скринридеру.
    const col = el('div', 'display-col');
    this.exprEl = el('div', 'expr');
    // role=group: иначе aria-label на div без роли запрещён (axe aria-prohibited-attr).
    this.exprEl.setAttribute('role', 'group');
    this.exprEl.setAttribute('aria-label', t('calc.exprAria'));
    this.resultEl = el('div', 'result', '0');
    this.resultEl.setAttribute('role', 'status');
    this.resultEl.setAttribute('aria-live', 'polite');
    this.resultEl.setAttribute('aria-atomic', 'true');
    this.resultEl.setAttribute('aria-label', t('calc.resultAria'));
    col.appendChild(this.exprEl);
    col.appendChild(this.resultEl);

    this.memEl = el('div', 'mem-line');
    col.appendChild(this.memEl);

    // ── Переключатели режимов ──
    const modes = el('div', 'row');
    modes.style.justifyContent = 'space-between';
    modes.style.marginBottom = '6px';

    this.degBtn = el('button', 'chip', 'DEG');
    this.degBtn.setAttribute('aria-pressed', 'true');
    this.degBtn.onclick = function () {
      self.st.toggleDeg();
      self.degBtn.textContent = self.st.deg ? 'DEG' : 'RAD';
      self.degBtn.setAttribute('aria-pressed', self.st.deg ? 'true' : 'false');
      self.render();
    };
    const sciBtn = el('button', 'chip', t('calc.sci'));
    sciBtn.setAttribute('aria-pressed', 'false');
    sciBtn.onclick = function () {
      self.st.sci = !self.st.sci;
      sciBtn.classList.toggle('on', self.st.sci);
      sciBtn.setAttribute('aria-pressed', self.st.sci ? 'true' : 'false');
      self._renderPad();
    };
    const progBtn = el('button', 'chip', t('calc.prog'));
    progBtn.setAttribute('aria-pressed', 'false');
    progBtn.onclick = function () {
      self.st.prog = !self.st.prog;
      progBtn.classList.toggle('on', self.st.prog);
      progBtn.setAttribute('aria-pressed', self.st.prog ? 'true' : 'false');
      self._renderPad();
    };
    const ansBtn = el('button', 'chip', 'ANS');
    ansBtn.onclick = function () {
      self.st.insertAns();
      self.render();
    };
    const mrBtn = el('button', 'chip', 'MR');
    mrBtn.onclick = function () {
      self.st.memRecall();
      self.render();
    };

    const right = el('div', 'row');
    right.appendChild(ansBtn);
    right.appendChild(mrBtn);

    const copyBtn = el('button', 'chip', '⧉ ' + t('calc.copy'));
    copyBtn.title = t('calc.copy');
    copyBtn.setAttribute('aria-label', t('calc.copy'));
    copyBtn.onclick = function () {
      const text = self.st.display();
      const done = function () {
        copyBtn.textContent = '✓ ' + t('calc.copied');
        setTimeout(function () {
          copyBtn.textContent = '⧉ ' + t('calc.copy');
        }, 1200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          self._fallbackCopy(text, done);
        });
      } else {
        self._fallbackCopy(text, done);
      }
    };
    const helpBtn = el('button', 'chip', '?');
    helpBtn.title = t('calc.shortcuts');
    helpBtn.setAttribute('aria-label', t('calc.shortcuts'));
    helpBtn.onclick = function () {
      self._showShortcuts();
    };
    right.appendChild(copyBtn);
    right.appendChild(helpBtn);

    modes.appendChild(this.degBtn);
    modes.appendChild(sciBtn);
    modes.appendChild(progBtn);
    modes.appendChild(right);

    const memRow = el('div', 'row');
    const mc = el('button', 'chip', 'MC');
    mc.onclick = function () {
      self.st.memClear();
      self.render();
    };
    const mplus = el('button', 'chip', 'M+');
    mplus.onclick = function () {
      self.st.memAdd();
      self.render();
    };
    const mminus = el('button', 'chip', 'M−');
    mminus.onclick = function () {
      self.st.memSub();
      self.render();
    };
    memRow.appendChild(mc);
    memRow.appendChild(mplus);
    memRow.appendChild(mminus);

    const modeRow = el('div', 'row');
    modeRow.style.marginTop = '6px';
    this.baseBox = el('select', 'field');
    this.baseBox.setAttribute('aria-label', t('calc.baseAria'));
    this.baseBox.title = t('calc.baseTitle');
    this.baseBox.style.flex = '0 0 auto';
    this.baseBox.style.width = 'auto';
    [
      [16, 'HEX'],
      [10, 'DEC'],
      [8, 'OCT'],
      [2, 'BIN'],
    ].forEach(function (p) {
      const o = el('option', null, p[1]);
      o.value = p[0];
      self.baseBox.appendChild(o);
    });
    this.baseBox.onchange = function () {
      self.st.progBase = parseInt(self.baseBox.value, 10);
      self.render();
    };
    modeRow.appendChild(this.baseBox);

    // ── Клавиатура: научный/программистский блок отдельно,
    // чтобы цифровой блок 7-8-9 / 4-5-6 / 1-2-3 не расползался.
    this.sciPad = el('div', 'pad sci-pad');
    this.sciPad.style.display = 'none';
    this.pad = el('div', 'pad');

    leftCol.appendChild(col);
    leftCol.appendChild(modes);
    leftCol.appendChild(memRow);
    leftCol.appendChild(modeRow);
    leftCol.appendChild(this.sciPad);
    leftCol.appendChild(this.pad);

    const rightCol = el('div', 'calc-right');

    // ── История ──
    const hcard = el('div', 'card');
    const hrow = el('div', 'row');
    const hfilter = el('input', 'field');
    hfilter.placeholder = t('calc.histFilter');
    hfilter.setAttribute('aria-label', t('calc.histFilter'));
    hfilter.type = 'search';
    hfilter.style.flex = '1 1 auto';
    hfilter.oninput = function () {
      self._renderHistory();
    };
    const hclear = el('button', 'btn', t('common.clear'));
    hclear.onclick = function () {
      if (self.history) {
        self.history.clear();
      }
      self._renderHistory();
    };
    const hexp = el('button', 'btn', t('common.export'));
    hexp.onclick = function () {
      self._exportHistory();
    };
    const himp = el('button', 'btn', t('common.import'));
    const hfile = document.createElement('input');
    hfile.type = 'file';
    hfile.accept = '.json,application/json';
    hfile.style.display = 'none';
    hfile.setAttribute('aria-label', t('calc.histFile'));
    himp.onclick = function () {
      hfile.click();
    };
    hfile.onchange = function () {
      const f = hfile.files && hfile.files[0];
      if (!f) {
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const data = JSON.parse(String(reader.result));
          if (self.history) {
            self.history.importAll(data);
          }
        } catch (e) {
          // Некорректный JSON — молча игнорируем, история не ломается.
        }
        self._renderHistory();
        hfile.value = '';
      };
      reader.readAsText(f);
    };
    const toggleHist = el('button', 'btn', '◀');
    toggleHist.title = t('calc.hideHist');
    toggleHist.setAttribute('aria-label', t('calc.hideHist'));
    const railBtn = el('button', 'btn calc-rail', '▶');
    railBtn.title = t('calc.showHist');
    railBtn.setAttribute('aria-label', t('calc.showHist'));
    toggleHist.onclick = function () {
      rightCol.classList.add('narrow');
    };
    railBtn.onclick = function () {
      rightCol.classList.remove('narrow');
    };
    hrow.appendChild(hfilter);
    const favLabel = el('label', 'check-row');
    favLabel.style.whiteSpace = 'nowrap';
    favLabel.style.fontSize = '12px';
    const favBox = el('input');
    favBox.type = 'checkbox';
    favBox.onchange = function () {
      self._renderHistory();
    };
    favLabel.appendChild(favBox);
    favLabel.appendChild(document.createTextNode(' ' + t('calc.favOnly')));
    this.favBox = favBox;
    hrow.appendChild(favLabel);
    hrow.appendChild(hexp);
    hrow.appendChild(himp);
    hrow.appendChild(hfile);
    hrow.appendChild(hclear);
    hrow.appendChild(toggleHist);
    hcard.appendChild(hrow);
    this.histEl = el('div', 'history');
    hcard.appendChild(this.histEl);
    this.hfilter = hfilter;
    rightCol.appendChild(hcard);

    // ── Переменные и функции ────────────────────────────────
    const dcard = el('div', 'card');
    dcard.appendChild(el('h2', null, t('calc.defsTitle')));
    const drow = el('div', 'row');
    this.defInput = el('input', 'field');
    this.defInput.type = 'text';
    this.defInput.placeholder = t('calc.defsEmpty');
    this.defInput.setAttribute('aria-label', t('calc.defsTitle'));
    const dadd = el('button', 'btn', '+');
    dadd.setAttribute('aria-label', t('calc.defsTitle'));
    dadd.onclick = function () {
      self._addDef(self.defInput.value);
    };
    this.defInput.onkeydown = function (ev) {
      if (ev.key === 'Enter') {
        self._addDef(self.defInput.value);
      }
    };
    drow.appendChild(this.defInput);
    drow.appendChild(dadd);
    dcard.appendChild(drow);
    this.defListEl = el('div', 'defs');
    dcard.appendChild(this.defListEl);
    dcard.appendChild(el('div', 'hint', t('calc.defsHint')));
    rightCol.appendChild(dcard);
    this._renderDefs();

    rightCol.appendChild(railBtn);

    wrap.appendChild(leftCol);
    wrap.appendChild(rightCol);

    this.root.appendChild(wrap);
    this._renderPad();
    this.render();
    this._renderHistory();
  };

  CalcView.prototype._renderPad = function () {
    const self = this;
    this.pad.innerHTML = '';
    this.pad.className = 'pad';
    this.sciPad.innerHTML = '';

    const extra = [];
    if (this.st.sci) {
      extra.push.apply(extra, SCI_KEYS);
    }
    if (this.st.prog) {
      extra.push.apply(extra, PROG_KEYS);
    }

    function addKey(k, parent) {
      const b = el(
        'button',
        'key' + (k.kind ? ' ' + k.kind : '') + (k.wide ? ' wide' : ''),
        k.label
      );
      const nice = k.act && KEY_NAMES[k.act] ? KEY_NAMES[k.act] + ': ' + k.label : k.label;
      b.setAttribute('aria-label', nice);
      b.setAttribute('tabindex', '0');
      b.onclick = function () {
        self.press(k);
      };
      b.onkeydown = function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          self.press(k);
        }
      };
      parent.appendChild(b);
    }

    if (extra.length) {
      extra.forEach(function (k) {
        addKey(k, self.sciPad);
      });
      self.sciPad.style.display = '';
    } else {
      self.sciPad.style.display = 'none';
    }
    BASIC_KEYS.forEach(function (k) {
      addKey(k, self.pad);
    });
  };

  /** Единая точка обработки нажатия. */
  CalcView.prototype.press = function (k) {
    const st = this.st;
    if (k.act) {
      const a = k.act;
      if (a === 'clear') {
        st.clearAll();
        this.render();
        return;
      }
      if (a === 'backspace') {
        st.backspace();
        this.render();
        return;
      }
      if (a === 'dot') {
        st.digit('.');
        this.render();
        return;
      }
      if (a === 'negate') {
        this._negate();
        return;
      }
      if (a === 'percent') {
        this._percent();
        return;
      }
      if (a === 'eq') {
        this._commit();
        return;
      }
      if (a.indexOf('op:') === 0) {
        st.operator(a.slice(3));
        this.render();
        return;
      }
      if (a.indexOf('insert:') === 0) {
        this._insert(a.slice(7));
        return;
      }
      if (a.indexOf('fn:') === 0) {
        this._fn(a.slice(3));
        return;
      }
      if (a.indexOf('hex:') === 0) {
        this._hexDigit(a.slice(4));
        return;
      }
      if (a.indexOf('bin:') === 0) {
        this._binary(a.slice(4));
        return;
      }
    }
    if (/^[0-9]$/.test(k.label)) {
      st.digit(k.label);
      this.render();
    }
  };

  CalcView.prototype._negate = function () {
    const st = this.st;
    if (st.cur && st.cur.charAt(0) === '-') {
      st.cur = st.cur.slice(1);
    } else {
      st.cur = '-' + (st.cur === '0' ? '' : st.cur);
    }
    st._replaceOperand(st.cur);
    this.render();
  };

  CalcView.prototype._percent = function () {
    const st = this.st;
    if (st.acc === null || st.acc === undefined) {
      // Без накопленного аккумулятора «%» — это деление на 100.
      try {
        st.cur = F.fmt(st.value() / 100);
        st._replaceOperand(st.cur);
        this.render();
      } catch (e) {
        st.setError(e);
        this.render();
      }
      return;
    }
    try {
      // «200 + 10 %» = 200 + 20, а не 200 + 0.1 — как в обычном калькуляторе.
      st.cur = F.fmt((st.acc * st.value()) / 100);
      st._replaceOperand(st.cur);
      this.render();
    } catch (e) {
      st.setError(e);
      this.render();
    }
  };

  CalcView.prototype._insert = function (text) {
    const st = this.st;
    if (st.err) {
      st.reset();
    }
    if (st.resetNext) {
      if (st.op === null || st.op === undefined) {
        st.expr = '';
        st.exprKinds = [];
        st.acc = null;
        st.op = null;
      }
      st.cur = '';
      st.resetNext = false;
    }
    st.cur = (st.cur === '0' || st.cur === '' ? '' : st.cur) + text;
    st.expr = (st.expr || '') + text;
    st.exprKinds = st.exprKinds || [];
    st.exprKinds.push('fn');
    this.render();
  };

  CalcView.prototype._fn = function (what) {
    const st = this.st;
    try {
      let v;
      if (what === '^2') {
        v = Math.pow(st.value(), 2);
      } else if (what === '!') {
        v = P.evaluate(st.cur + '!');
      } else if (what === 'inv') {
        const x = st.value();
        if (x === 0) {
          throw P.ExprError(t('calc.err.divZero'));
        }
        v = 1 / x;
      } else {
        throw P.ExprError(t('calc.err.unknownOp'));
      }
      st.cur = st.expr = F.fmt(v);
      st.exprKinds = ['num'];
      st.acc = v;
      st.op = null;
      st.resetNext = true;
      this.render();
    } catch (e) {
      st.setError(e);
      this.render();
    }
  };

  CalcView.prototype._hexDigit = function (ch) {
    const st = this.st;
    if (!st.prog) {
      st.prog = true;
      this._renderPad();
    }
    if (st.progBase < 16) {
      st.progBase = 16;
      this.baseBox.value = '16';
    }
    if (st.resetNext) {
      st.cur = '';
      st.resetNext = false;
    }
    st.cur = (st.cur === '0' ? '' : st.cur) + ch;
    st.expr = (st.expr || '') + ch;
    this.render();
  };

  CalcView.prototype._binary = function (op) {
    const st = this.st;
    try {
      const v = P.evaluate('(' + st.cur + ') ' + op + ' (' + (st.acc || 0) + ')');
      st.cur = st.expr = F.fmt(v);
      st.exprKinds = ['num'];
      st.acc = v;
      st.resetNext = true;
      this.render();
    } catch (e) {
      st.setError(e);
      this.render();
    }
  };

  CalcView.prototype._commit = function () {
    const st = this.st;
    const before = (st.expr || '').trim();
    const v = st.commit();
    if (v === null) {
      this.render();
      return;
    }
    if (this.history && before) {
      this.history.add(before, st.ans);
    }
    this.render();
    this._renderHistory();
  };

  CalcView.prototype.render = function () {
    const st = this.st;
    this.resultEl.textContent = st.display();
    this.resultEl.classList.toggle('err', !!st.err);
    this.exprEl.textContent = st.renderExpr();
    this.memEl.innerHTML = '';
    if (st.memory !== 0) {
      const b = el('b', null, 'M = ' + F.fmt(st.memory));
      this.memEl.appendChild(b);
    }
    // Дисплей ужимается, чтобы длинные числа не вылезали за край.
    const len = (st.display() || '').length;
    this.resultEl.style.fontSize = len > 26 ? '24px' : len > 16 ? '32px' : len > 10 ? '40px' : '';
  };

  CalcView.prototype._renderHistory = function () {
    const self = this;
    this.histEl.innerHTML = '';
    if (!this.history) {
      return;
    }
    const q = (this.hfilter.value || '').toLowerCase();
    const favOnly = this.favBox && this.favBox.checked;
    const items = this.history
      .all()
      .filter(function (e) {
        if (favOnly && !e.fav) {
          return false;
        }
        if (!q) {
          return true;
        }
        return e.expr.toLowerCase().indexOf(q) >= 0 || e.result.toLowerCase().indexOf(q) >= 0;
      })
      .slice(-40)
      .reverse();

    if (!items.length) {
      this.histEl.appendChild(el('div', 'hint', t('calc.histEmpty')));
      return;
    }
    items.forEach(function (e) {
      const rowWrap = el('div', 'h-item-wrap');
      // WCAG 2.1.1 / 4.1.2: история — настоящие кнопки, работают с клавиатуры.
      const d = el('button', 'h-item');
      d.setAttribute('aria-label', t('calc.histItemAria', { expr: e.expr, result: e.result }));
      d.appendChild(el('div', 'h-expr', e.expr));
      d.appendChild(el('div', 'h-res', '= ' + e.result));
      d.onclick = function () {
        self.st.expr = e.expr;
        self.st.exprKinds = ['num'];
        self.st.cur = e.result;
        self.st.resetNext = true;
        self.st.err = null;
        self.render();
      };
      const star = el('button', 'h-fav' + (e.fav ? ' on' : ''), e.fav ? '★' : '☆');
      star.title = e.fav ? t('calc.favRemove') : t('calc.favAdd');
      star.setAttribute('aria-label', e.fav ? t('calc.favRemove') : t('calc.favAdd'));
      star.setAttribute('aria-pressed', e.fav ? 'true' : 'false');
      star.onclick = function (ev) {
        ev.stopPropagation();
        self.history.toggleFav(e.expr, e.result);
        self._renderHistory();
      };
      rowWrap.appendChild(d);
      rowWrap.appendChild(star);
      self.histEl.appendChild(rowWrap);
    });
  };

  CalcView.prototype._exportHistory = function () {
    if (!this.history) {
      return;
    }
    const data = JSON.stringify(this.history.all(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'history.json';
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 1000);
  };

  /** Копирование без Clipboad API (старые браузеры, http://). */
  CalcView.prototype._fallbackCopy = function (text, done) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) {
      // Копирование не критично — молча выходим.
    }
  };

  /** Модальное окно со списком горячих клавиш. */
  CalcView.prototype._showShortcuts = function () {
    const overlay = el('div', 'modal-overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', t('calc.shortcutsTitle'));
    const box = el('div', 'modal-box');
    box.appendChild(el('h2', null, t('calc.shortcutsTitle')));
    const list = el('ul', 'sc-list');
    ['digits', 'ops', 'dot', 'eq', 'backspace', 'esc', 'percent', 'pi'].forEach(function (k) {
      list.appendChild(el('li', null, t('calc.sc.' + k)));
    });
    box.appendChild(list);
    const close = el('button', 'btn primary', t('calc.shortcutsClose'));
    const dismiss = function () {
      document.removeEventListener('keydown', onKey);
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };
    function onKey(ev) {
      if (ev.key === 'Escape') {
        dismiss();
      }
    }
    close.onclick = dismiss;
    overlay.onclick = function (ev) {
      if (ev.target === overlay) {
        dismiss();
      }
    };
    box.appendChild(close);
    overlay.appendChild(box);
    document.addEventListener('keydown', onKey);
    this.root.appendChild(overlay);
    if (close.focus) {
      close.focus();
    }
  };

  CalcView.prototype._defs = function () {
    window.CW.userDefs = window.CW.userDefs || { vars: {}, funcs: {} };
    return window.CW.userDefs;
  };

  /** Имя не занято встроенной константой/функцией и не ключевое слово. */
  CalcView.prototype._nameAllowed = function (name) {
    const P = window.CW.parser;
    const ud = this._defs();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      return false;
    }
    if (
      /^(and|or|xor|not|shl|shr|mod|rem)$/.test(name) ||
      name === 'i' ||
      name === 'I' ||
      name === 'j'
    ) {
      return false;
    }
    if (name in P.CONSTANTS && !(name in ud.vars)) {
      return false;
    }
    if (name in P.FUNCTIONS && !(name in ud.funcs)) {
      return false;
    }
    return true;
  };

  /** Разобрать строку «имя = значение» или «имя(x) = выражение». */
  CalcView.prototype._addDef = function (text) {
    const raw = String(text || '').trim();
    if (!raw) {
      return;
    }
    const P = window.CW.parser;
    const ud = this._defs();
    let m = /^([A-Za-z_][A-Za-z0-9_]*)\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*=\s*(.+)$/.exec(raw);
    if (m) {
      const name = m[1];
      const arg = m[2];
      const body = m[3];
      if (!this._nameAllowed(name)) {
        this._defErr = t('calc.err.badName', { name: name });
        this._renderDefs();
        return;
      }
      try {
        const compiled = P.compileVars(body, [arg], this.st.deg);
        P.defineUserFunction(name, 1, function (x) {
          return compiled(x);
        });
        ud.funcs[name] = { arg: arg, body: body };
        this._defErr = null;
        this.defInput.value = '';
        this._renderDefs();
      } catch (e) {
        this._defErr = e.message || t('calc.err.defParse');
        this._renderDefs();
      }
      return;
    }
    m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/.exec(raw);
    if (m) {
      const name = m[1];
      const rhs = m[2];
      if (!this._nameAllowed(name)) {
        this._defErr = t('calc.err.badName', { name: name });
        this._renderDefs();
        return;
      }
      try {
        const value = P.evaluate(rhs, this.st.deg);
        P.setVar(name, value);
        ud.vars[name] = value;
        this._defErr = null;
        this.defInput.value = '';
        this._renderDefs();
      } catch (e) {
        this._defErr = e.message || t('calc.err.defParse');
        this._renderDefs();
      }
      return;
    }
    this._defErr = t('calc.err.defParse');
    this._renderDefs();
  };

  CalcView.prototype._renderDefs = function () {
    const self = this;
    if (!this.defListEl) {
      return;
    }
    this.defListEl.innerHTML = '';
    const ud = this._defs();
    if (this._defErr) {
      this.defListEl.appendChild(el('div', 'hint err', this._defErr));
    }
    const vnames = Object.keys(ud.vars);
    const fnames = Object.keys(ud.funcs);
    if (!vnames.length && !fnames.length) {
      if (!this._defErr) {
        this.defListEl.appendChild(el('div', 'hint', t('calc.defsEmpty')));
      }
      return;
    }
    fnames.forEach(function (n) {
      const row = el('div', 'def-row');
      row.appendChild(
        el('span', 'def-text', n + '(' + ud.funcs[n].arg + ') = ' + ud.funcs[n].body)
      );
      const rm = el('button', 'def-rm', '✕');
      rm.setAttribute('aria-label', t('calc.defsRemove') + ': ' + n);
      rm.onclick = function () {
        window.CW.parser.removeUserFunction(n);
        delete ud.funcs[n];
        self._defErr = null;
        self._renderDefs();
      };
      row.appendChild(rm);
      self.defListEl.appendChild(row);
    });
    vnames.forEach(function (n) {
      const row = el('div', 'def-row');
      row.appendChild(el('span', 'def-text', n + ' = ' + F.fmt(ud.vars[n])));
      const rm = el('button', 'def-rm', '✕');
      rm.setAttribute('aria-label', t('calc.defsRemove') + ': ' + n);
      rm.onclick = function () {
        delete window.CW.parser.CONSTANTS[n];
        delete ud.vars[n];
        self._defErr = null;
        self._renderDefs();
      };
      row.appendChild(rm);
      self.defListEl.appendChild(row);
    });
  };

  // ── Клавиатура ────────────────────────────────────────────
  CalcView.prototype._bindKeys = function () {
    const self = this;
    document.addEventListener('keydown', function (ev) {
      // Клавиатуру калькулятора перехватываем только на активной вкладке.
      if (!self.root.classList.contains('active')) {
        return;
      }
      // Не перехватываем ввод, когда фокус в поле ввода/выбора.
      const target = /** @type {Element} */ (ev.target);
      const tag = (target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (ev.key !== 'Escape') {
          return;
        }
      }
      // Enter/пробел на сфокусированном элементе управления — отдаём элементу,
      // чтобы не дублировать нажатие кнопки «=» и не блокировать активацию.
      const onControl =
        target.closest && target.closest('button, a, [role="button"], [role="tab"]');
      if (onControl && (ev.key === 'Enter' || ev.key === ' ')) {
        return;
      }
      const k = ev.key;
      if (/^[0-9]$/.test(k)) {
        ev.preventDefault();
        self.press({ label: k });
        return;
      }
      if (k === '.' || k === ',') {
        ev.preventDefault();
        self.press({ label: ',', act: 'dot' });
        return;
      }
      if (k === '+') {
        ev.preventDefault();
        self.press({ act: 'op:add' });
        return;
      }
      if (k === '-') {
        ev.preventDefault();
        self.press({ act: 'op:sub' });
        return;
      }
      if (k === '*' || k === 'x' || k === 'X') {
        ev.preventDefault();
        self.press({ act: 'op:mul' });
        return;
      }
      if (k === '/') {
        ev.preventDefault();
        self.press({ act: 'op:div' });
        return;
      }
      if (k === '%') {
        ev.preventDefault();
        self.press({ act: 'percent' });
        return;
      }
      if (k === '^') {
        ev.preventDefault();
        self.press({ act: 'op:pow' });
        return;
      }
      if (k === '(') {
        ev.preventDefault();
        self.press({ act: 'insert:(' });
        return;
      }
      if (k === ')') {
        ev.preventDefault();
        self.press({ act: 'insert:)' });
        return;
      }
      // Shift+= на US-раскладке даёт «+», но '=' тоже должен работать.
      if (k === '=' || k === 'Enter' || k === 'Return') {
        ev.preventDefault();
        self._commit();
        return;
      }
      if (k === 'Backspace') {
        ev.preventDefault();
        self.press({ act: 'backspace' });
        return;
      }
      if (k === 'Escape' || k === 'Delete') {
        ev.preventDefault();
        self.press({ act: 'clear' });
        return;
      }
      if (k === 'p' || k === 'з') {
        ev.preventDefault();
        self.press({ act: 'insert:π' });
        return;
      }
      if (k === 'e' && !ev.ctrlKey) {
        /* e как константа не перехватываем */
      }
    });
  };

  return { CalcView: CalcView, BASIC_KEYS: BASIC_KEYS };
})();

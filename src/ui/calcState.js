/* Состояние калькулятора: acc / op / cur / reset / ans / память.
 *
 * Порядок вызовов важен. Ключевое правило, которого не было в Python-версии:
 * вставка операнда (цифра, MR, ANS) НИКОГДА не сбрасывает отложенный
 * оператор. Если пользователь набрал «5 +» и жмёт MR — «+» должен остаться.
 */
'use strict';
window.CW = window.CW || {};
window.CW.calcState = (function () {
  const P = window.CW.parser;
  const F = window.CW.format;
  const t = window.CW.i18n.t;

  function CalcState(opts) {
    opts = opts || {};
    this.deg = opts.deg !== false;
    this.sci = false;
    this.prog = false;
    this.progBase = 16;
    this.progBits = 64;
    this.memory = 0;
    this.ans = '0';
    this.reset();
  }

  CalcState.prototype.reset = function () {
    this.acc = null;
    this.op = null;
    this.cur = '0';
    this.resetNext = false;
    this.expr = '';
    this.err = null;
  };

  CalcState.prototype.clearAll = function () {
    this.reset();
    this.memory = 0;
    this.ans = '0';
  };

  /** Текущий операнд как число (для apply/commit). */
  CalcState.prototype.value = function () {
    const v = this._parse(this.cur);
    return v;
  };

  CalcState.prototype._parse = function (text) {
    const t = String(text == null ? '' : text).trim();
    if (t === '') {
      return 0;
    }
    if (this.prog) {
      return this._parseProg(t);
    }
    try {
      return P.evaluate(t, this.deg);
    } catch (e) {
      throw P.ExprError(e.message || String(e));
    }
  };

  /** Ввод в программистском режиме идёт по основанию, а не как выражение. */
  CalcState.prototype._parseProg = function (text) {
    const t = String(text).trim().replace(/\s+/g, '');
    if (t === '') {
      return 0;
    }
    // Чистый набор цифр (включая hex-буквы A–F) — число в текущем основании.
    // Иначе hex-буквы уходили бы в парсер выражений и падали там.
    if (/^-?[0-9a-zA-Z]+$/.test(t) && this._isBaseDigits(t)) {
      return this._parseBase(t);
    }
    // Константы и выражения вроде «2+3» всё ещё считаем парсером.
    try {
      return P.evaluate(t, this.deg);
    } catch (e) {
      throw P.ExprError(e.message || String(e));
    }
  };

  /** Все символы — допустимые цифры текущего основания? */
  CalcState.prototype._isBaseDigits = function (t) {
    const digits = '0123456789abcdef';
    let body = t.toLowerCase();
    if (body[0] === '-') {
      body = body.slice(1);
    }
    if (!body) {
      return false;
    }
    for (let i = 0; i < body.length; i++) {
      const d = digits.indexOf(body[i]);
      if (d < 0 || d >= this.progBase) {
        return false;
      }
    }
    return true;
  };

  CalcState.prototype._parseBase = function (t) {
    const digits = '0123456789abcdef';
    let body = t.toLowerCase();
    let neg = false;
    if (body[0] === '-') {
      neg = true;
      body = body.slice(1);
    }
    let v = 0;
    for (let i = 0; i < body.length; i++) {
      const d = digits.indexOf(body[i]);
      if (d < 0 || d >= this.progBase) {
        throw P.ExprError(t('calc.err.badDigit', { d: body[i], base: this.progBase }));
      }
      v = v * this.progBase + d;
    }
    return neg ? -v : v;
  };

  /** Заменить хвостовой операнд выражения (для «5 + <ввод>»). */
  CalcState.prototype._replaceOperand = function (text) {
    const kinds = this.exprKinds || [];
    const expr = this.expr || '';
    if (kinds.length && kinds[kinds.length - 1] === 'num') {
      // Отрезаем хвостовой токен-операнд и добавляем новый.
      let cut = expr.length;
      const tail = expr.trimEnd();
      const m = /([\d.eEπφτ∞i]+)$/.exec(tail);
      if (m) {
        cut = tail.length - m[1].length;
      }
      this.expr = expr.slice(0, cut) + text;
      kinds[kinds.length - 1] = 'num';
      this.exprKinds = kinds;
    } else {
      this.expr = (this.expr || '') + text;
      kinds.push('num');
      this.exprKinds = kinds;
    }
  };

  /**
   * Вставить операнд, который пользователь начал набирать.
   * Сбрасывает накопленное только если оператора действительно нет.
   */
  CalcState.prototype.beginOperand = function (text) {
    if (this.err) {
      this.reset();
    }
    if (this.op !== null && this.op !== undefined) {
      // Оператор ждёт правую часть — она и заменяет то, что набиралось.
      this._replaceOperand(text);
      this.cur = text;
    } else {
      if (this.resetNext) {
        this.expr = '';
        this.exprKinds = [];
        this.acc = null;
        this.op = null;
      }
      this.expr = (this.expr || '') + text;
      this.exprKinds = this.exprKinds || [];
      this.exprKinds.push('num');
      this.cur = text;
    }
    this.resetNext = true;
  };

  /** Продолжить набор цифр внутри текущего операнда. */
  CalcState.prototype.digit = function (d) {
    if (this.err) {
      this.reset();
    }
    if (this.resetNext) {
      if (this.op === null || this.op === undefined) {
        this.expr = '';
        this.exprKinds = [];
        this.acc = null;
        this.op = null;
      }
      this.cur = '';
      this.resetNext = false;
    }
    if (d === '.' && this.cur.indexOf('.') >= 0) {
      return;
    }
    if (this.cur === '0' && d !== '.') {
      this.cur = '';
    }
    if (d === '.') {
      this.cur = this.cur === '' ? '0.' : this.cur + d;
    } else {
      this.cur += d;
    }
    this._replaceOperand(this.cur);
  };

  /** Нажатие оператора: применяет накопленную операцию, если она есть. */
  CalcState.prototype.operator = function (name) {
    if (this.err) {
      return;
    }
    const op = this.op;
    if (op) {
      // «5 + 3 *» — применяем «+» и запоминаем «*».
      const r = this.apply(op, this.acc, this.value());
      if (r === null) {
        return;
      }
      this.acc = r;
    } else {
      const v = this.value();
      if (v === null) {
        return;
      }
      this.acc = v;
    }
    this.op = name;
    this.cur = '0';
    this.resetNext = false;
    this.expr = (this.expr || '') + ' ' + opText(name) + ' ';
    this.exprKinds = this.exprKinds || [];
    this.exprKinds.push('op');
  };

  function opText(name) {
    return { add: '+', sub: '−', mul: '×', div: '÷', pow: '^', mod: '%' }[name] || name;
  }

  /** Применить бинарную операцию, вернуть null при ошибке. */
  CalcState.prototype.apply = function (op, a, b) {
    try {
      switch (op) {
        case 'add':
          return this._scalar(a + b);
        case 'sub':
          return this._scalar(a - b);
        case 'mul':
          return this._scalar(a * b);
        case 'div':
          return this._scalar(this._divide(a, b));
        case 'pow':
          return this._scalar(Math.pow(this._num(a), this._num(b)));
        case 'mod':
          return this._scalar(this._num(a) % this._num(b));
        default:
          throw P.ExprError(t('calc.err.unknownOperator', { op: op }));
      }
    } catch (e) {
      this.setError(e);
      return null;
    }
  };

  CalcState.prototype._divide = function (a, b) {
    if (typeof b === 'object' && b !== null) {
      throw P.ExprError(t('calc.err.complexDiv'));
    }
    if (b === 0) {
      throw P.ExprError(t('calc.err.divZero'));
    }
    return this._num(a) / b;
  };

  CalcState.prototype._num = function (v) {
    if (typeof v === 'object' && v !== null) {
      throw P.ExprError(t('calc.err.realExpected'));
    }
    return v;
  };

  CalcState.prototype._scalar = function (v) {
    if (typeof v === 'object' && v !== null) {
      return v;
    }
    if (typeof v === 'number' && !Number.isFinite(v)) {
      throw P.ExprError(t('calc.err.range'));
    }
    return v;
  };

  /** «=»: вычислить накопленное выражение. */
  CalcState.prototype.commit = function () {
    if (this.err) {
      return null;
    }
    const op = this.op;
    const acc = this.acc;

    if (!op) {
      // Без оператора — просто напечатанное число (или выражение вроде 2^8).
      try {
        const v = this.value();
        this.ans = this.render(v);
        P.setAns(v);
        this.expr = '';
        this.exprKinds = [];
        this.cur = this.ans;
        this.resetNext = true;
        return v;
      } catch (e) {
        this.setError(e);
        return null;
      }
    }

    try {
      const rhs = this.value();
      const res = this.apply(op, acc, rhs);
      if (res === null) {
        return null;
      }
      this.ans = this.render(res);
      P.setAns(res);
      this.expr = this.ans;
      this.exprKinds = ['num'];
      this.cur = this.ans;
      this.acc = res;
      this.op = null;
      this.resetNext = true;
      return res;
    } catch (e) {
      this.setError(e);
      return null;
    }
  };

  /** Значение для отображения на дисплее. */
  CalcState.prototype.display = function () {
    if (this.err) {
      return this.err;
    }
    if (this.prog && !this.resetNext && this.cur) {
      try {
        const v = this._parse(this.cur);
        if (typeof v === 'number' && !Number.isFinite(v)) {
          return v > 0 ? 'inf' : v < 0 ? '-inf' : 'nan';
        }
        return this.renderProg(v);
      } catch (e) {
        return this.cur;
      }
    }
    // Защита: не отображать Infinity/NaN как обычное число
    const curVal = this._parse(this.cur);
    if (typeof curVal === 'number' && !Number.isFinite(curVal)) {
      return curVal > 0 ? 'inf' : curVal < 0 ? '-inf' : 'nan';
    }
    return this.cur || '0';
  };

  CalcState.prototype.setError = function (e) {
    this.err = e && e.message ? e.message : String(e);
  };

  CalcState.prototype.render = function (v) {
    return typeof v === 'object' && v !== null ? F.fmtComplex(v) : F.fmt(v);
  };

  const BASE_LABEL = { 2: 'BIN', 8: 'OCT', 10: 'DEC', 16: 'HEX' };

  /** Четыре представления числа для программистского режима. */
  CalcState.prototype.renderProg = function (v) {
    const n = typeof v === 'object' && v !== null ? v.re : v;
    if (typeof n !== 'number' || !Number.isFinite(n)) {
      return n === Infinity || n === -Infinity ? (n < 0 ? '-inf' : 'inf') : 'nan';
    }
    const i = Math.trunc(n);
    const neg = i < 0;
    const a = Math.abs(i);
    const bits = this.progBits;
    let mask = bits >= 32 && a < Math.pow(2, bits) ? Math.pow(2, bits) - 1 : null;
    if (mask !== null && a > mask) {
      mask = null;
    }

    function inBase(x, base) {
      if (x === 0) {
        return '0';
      }
      const digits = '0123456789ABCDEF';
      let out = '';
      while (x > 0) {
        out = digits[x % base] + out;
        x = Math.floor(x / base);
      }
      return out;
    }
    const lines = [
      ['HEX', (neg ? '-' : '') + inBase(a, 16)],
      ['DEC', (neg ? '-' : '') + String(a)],
      ['OCT', (neg ? '-' : '') + inBase(a, 8)],
      ['BIN', (neg ? '-' : '') + inBase(a, 2)],
    ];
    return lines
      .map(function (r) {
        return r[0] + '  ' + r[1];
      })
      .join('\n');
  };

  CalcState.prototype.baseLabel = function () {
    return BASE_LABEL[this.progBase] || String(this.progBase);
  };

  // ── Память ────────────────────────────────────────────────
  CalcState.prototype.memAdd = function () {
    try {
      this.memory += this._num(this.value());
      P.setMemory(this.memory);
    } catch (e) {
      this.setError(e);
    }
  };
  CalcState.prototype.memSub = function () {
    try {
      this.memory -= this._num(this.value());
      P.setMemory(this.memory);
    } catch (e) {
      this.setError(e);
    }
  };
  CalcState.prototype.memRecall = function () {
    this.beginOperand(F.fmt(this.memory));
  };
  CalcState.prototype.memClear = function () {
    this.memory = 0;
    P.setMemory(0);
  };
  CalcState.prototype.insertAns = function () {
    this.beginOperand(this.ans);
  };

  /** Клавиша Backspace. */
  CalcState.prototype.backspace = function () {
    if (this.err) {
      this.reset();
      return;
    }
    if (!this.cur || this.cur === '0') {
      return;
    }
    this.cur = this.cur.slice(0, -1);
    if (this.cur === '' || this.cur === '-') {
      this.cur = '0';
    }
    if (this.cur === '0' && this.op === null) {
      this.expr = '';
      this.exprKinds = [];
    } else {
      this._replaceOperand(this.cur);
    }
  };

  CalcState.prototype.toggleDeg = function () {
    this.deg = !this.deg;
    return this.deg;
  };

  CalcState.prototype.renderExpr = function () {
    if (this.err) {
      return '';
    }
    return (this.expr || '').trim();
  };

  return { CalcState: CalcState, opText: opText, BASE_LABEL: BASE_LABEL };
})();

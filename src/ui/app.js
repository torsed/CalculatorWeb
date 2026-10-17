/* Сборка интерфейса: вкладки, переключение тем, маршрутизация модулей. */
'use strict';
window.CW = window.CW || {};
window.CW.app = (function () {
  const F = window.CW.format;
  const t = window.CW.i18n.t;

  const TABS = [
    { id: 'calc', label: t('common.tab.calc') },
    { id: 'graph', label: t('common.tab.graph') },
    { id: 'conv', label: t('common.tab.conv') },
    { id: 'stats', label: t('common.tab.stats') },
    { id: 'matrix', label: t('common.tab.matrix') },
    { id: 'numth', label: t('common.tab.numth') },
    { id: 'solver', label: t('common.tab.solver') },
    { id: 'analysis', label: t('common.tab.analysis') },
    { id: 'phys', label: t('common.tab.phys') },
    { id: 'chem', label: t('common.tab.chem') },
    { id: 'geom', label: t('common.tab.geom') },
    { id: 'finance', label: t('common.tab.finance') },
    { id: 'util', label: t('common.tab.util') },
    { id: 'date', label: t('common.tab.date') },
    { id: 'prob', label: t('common.tab.prob') },
    { id: 'prog', label: t('common.tab.prog') },
    { id: 'gen', label: t('common.tab.gen') },
    { id: 'elem', label: t('common.tab.elem') },
  ];

  /**
   * Создаёт элемент. Опционально принимает объект opts вместо строки класса:
   *   { cls, text, label, attrs, props, on }
   * Имя модуля для скринридера копируется из placeholder, если не задано явно:
   * иначе поля формы остаются без доступного имени.
   */
  function el(tag, cls, text) {
    let opts = null;
    if (cls !== null && typeof cls === 'object') {
      opts = cls;
      cls = opts.cls;
    }
    const n = document.createElement(tag);

    if (opts) {
      if (opts.text !== undefined) {
        n.textContent = opts.text;
      }
      if (opts.attrs) {
        Object.keys(opts.attrs).forEach(function (k) {
          n.setAttribute(k, opts.attrs[k]);
        });
      }
      if (opts.props) {
        Object.keys(opts.props).forEach(function (k) {
          n[k] = opts.props[k];
        });
      }
      if (opts.on) {
        Object.keys(opts.on).forEach(function (k) {
          n.addEventListener(k, opts.on[k]);
        });
      }
      if (opts.label) {
        n.setAttribute('aria-label', opts.label);
      }
    }

    if (cls) {
      n.className = cls;
    }
    if (text !== undefined) {
      n.textContent = text;
    }

    const isField = tag === 'input' || tag === 'textarea' || tag === 'select';
    if (isField && !n.getAttribute('aria-label') && !n.getAttribute('aria-labelledby')) {
      const ph = n.getAttribute('placeholder') || n.getAttribute('title');
      if (ph) {
        n.setAttribute('aria-label', ph);
      }
    }
    return n;
  }

  function App(root) {
    this.root = root;
    this.theme = localStorage.getItem('cw.theme') || 'dark';
    this.history = new window.CW.history.History();
    this.calcView = null;
    this.graphView = null;
    this._build();
    const savedTab = localStorage.getItem('cw.tab');
    const valid = TABS.some(function (t) {
      return t.id === savedTab;
    });
    this.show(valid ? savedTab : 'calc');
  }

  App.prototype._build = function () {
    const self = this;
    document.documentElement.setAttribute('data-theme', this.theme);

    this.root.innerHTML = '';
    const skip = document.querySelector('.skip-link');
    if (skip) {
      skip.textContent = t('common.skipLink');
    }
    const app = el('div', {
      cls: 'app',
      attrs: { role: 'main', 'aria-label': t('common.appAria') },
    });

    const bar = el('div', 'topbar');
    const brand = el('h1', 'brand', t('common.brand'));
    brand.style.fontSize = 'inherit';
    brand.style.fontWeight = 'inherit';
    bar.appendChild(brand);

    // WAI-ARIA APG Tabs: tablist + roving tabindex + стрелки/Home/End.
    const tablist = el('div', {
      cls: 'tablist',
      attrs: { role: 'tablist', 'aria-label': t('common.sections') },
    });
    tablist.style.cssText = 'display:contents;';
    this.tabs = [];
    TABS.forEach(function (t, idx) {
      const b = el('button', 'tab', t.label);
      b.setAttribute('role', 'tab');
      b.id = 'tab-' + t.id;
      b.setAttribute('aria-controls', 'page-' + t.id);
      b.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      b.onclick = function () {
        self.show(t.id);
        b.focus();
      };
      b.onkeydown = function (ev) {
        let next = null;
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
          ev.preventDefault();
          const dir = ev.key === 'ArrowRight' ? 1 : -1;
          next = self.tabs[(idx + dir + self.tabs.length) % self.tabs.length];
        } else if (ev.key === 'Home') {
          ev.preventDefault();
          next = self.tabs[0];
        } else if (ev.key === 'End') {
          ev.preventDefault();
          next = self.tabs[self.tabs.length - 1];
        }
        if (next) {
          self.show(next.id);
          next.node.focus();
        }
      };
      self.tabs.push({ id: t.id, node: b });
      tablist.appendChild(b);
    });
    bar.appendChild(tablist);

    bar.appendChild(el('div', 'spacer'));

    const themeBtn = el('button', 'icon-btn', this.theme === 'dark' ? '☀' : '☾');
    themeBtn.title = t('common.theme.change');
    themeBtn.setAttribute(
      'aria-label',
      t(this.theme === 'dark' ? 'common.theme.now.dark' : 'common.theme.now.light')
    );
    themeBtn.onclick = function () {
      self.theme = self.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', self.theme);
      localStorage.setItem('cw.theme', self.theme);
      themeBtn.textContent = self.theme === 'dark' ? '☀' : '☾';
      themeBtn.setAttribute(
        'aria-label',
        t(self.theme === 'dark' ? 'common.theme.now.dark' : 'common.theme.now.light')
      );
      if (self.graphView) {
        self.graphView.render();
      }
    };
    bar.appendChild(themeBtn);

    // Переключатель языка: ru ⇄ en. Смена языка перезагружает страницу,
    // чтобы весь уже построенный интерфейс пересобрался на новом языке.
    const langBtn = el('button', 'lang-btn', 'RU');
    langBtn.textContent = window.CW.i18n.getLocale().toUpperCase();
    langBtn.title = t('common.lang.change');
    langBtn.setAttribute('aria-label', t('common.lang.change'));
    langBtn.onclick = function () {
      const next = window.CW.i18n.getLocale() === 'ru' ? 'en' : 'ru';
      window.CW.i18n.setLocale(next);
      window.location.reload();
    };
    bar.appendChild(langBtn);

    const pages = el('div', 'pages');
    this.pageNodes = {};
    TABS.forEach(function (t) {
      const p = el('div', { cls: 'page', attrs: { role: 'tabpanel', tabindex: '0' } });
      p.id = 'page-' + t.id;
      p.setAttribute('aria-labelledby', 'tab-' + t.id);
      self.pageNodes[t.id] = p;
      pages.appendChild(p);
    });

    app.appendChild(bar);
    app.appendChild(pages);
    // WCAG 4.1.3: смена вкладки объявляется скринридеру, визуально скрыто.
    this._pageStatus = el('div', {
      cls: 'visually-hidden',
      attrs: { role: 'status', 'aria-live': 'polite' },
    });
    app.appendChild(this._pageStatus);
    this.root.appendChild(app);

    this._mountCalc();
    this._mountGraph();
    const PG = window.CW.pages;
    PG.mountConv(this);
    PG.mountStats(this);
    PG.mountMatrix(this);
    PG.mountNumTheory(this);
    PG.mountSolver(this);
    PG.mountAnalysis(this);
    PG.mountPhys(this);
    PG.mountChem(this);
    PG.mountGeom(this);
    PG.mountFinance(this);
    PG.mountUtil(this);
    PG.mountDate(this);
    PG.mountProb(this);
    PG.mountProg(this);
    PG.mountGen(this);
    PG.mountElements(this);

    this._labelFields();
  };

  /**
   * Раздаёт доступные имена полям, которым он не достался при создании.
   * Большинство полей задаёт placeholder уже после el(), поэтому подстановка
   * внутри el() не срабатывает — проходим по готовому DOM один раз.
   */
  App.prototype._labelFields = function () {
    this.root.querySelectorAll('input, textarea, select').forEach(function (f) {
      if (f.type === 'hidden') {
        return;
      }
      if (f.getAttribute('aria-label') || f.getAttribute('aria-labelledby')) {
        return;
      }
      if (f.id && document.querySelector('label[for="' + f.id + '"]')) {
        return;
      }
      if (f.closest('label')) {
        return;
      }
      const hint = f.getAttribute('placeholder') || f.getAttribute('title');
      if (hint) {
        f.setAttribute('aria-label', hint);
        return;
      }
      // У selects берём имя из выбранной опции — это точнее, чем «поле».
      if (f.tagName === 'SELECT' && f.options.length) {
        const opt = f.options[f.selectedIndex];
        if (opt && opt.textContent.trim()) {
          f.setAttribute('aria-label', opt.textContent.trim());
        }
      }
    });
  };

  App.prototype.show = function (id) {
    try {
      localStorage.setItem('cw.tab', id);
    } catch (e) {
      // приватный режим — не критично
    }
    this.tabs.forEach(function (t) {
      const sel = t.id === id;
      t.node.setAttribute('aria-selected', sel ? 'true' : 'false');
      t.node.setAttribute('tabindex', sel ? '0' : '-1');
    });
    const self = this;
    Object.keys(this.pageNodes).forEach(function (k) {
      const active = k === id;
      self.pageNodes[k].classList.toggle('active', active);
      if (active) {
        self.pageNodes[k].removeAttribute('hidden');
      } else {
        self.pageNodes[k].setAttribute('hidden', '');
      }
    });
    if (this._pageStatus) {
      const tab = this.tabs.filter(function (t) {
        return t.id === id;
      })[0];
      this._pageStatus.textContent = t('common.sectionOpen', {
        name: tab ? tab.node.textContent : id,
      });
    }
    // Холст рисуется только когда виден: иначе размеры нулевые.
    if (id === 'graph' && this.graphView) {
      this.graphView.render();
    }
  };

  // ── Калькулятор ──────────────────────────────────────────
  App.prototype._mountCalc = function () {
    this.calcView = new window.CW.calcView.CalcView(this.pageNodes.calc, this.history);
  };

  // ── График ───────────────────────────────────────────────
  App.prototype._mountGraph = function () {
    const self = this;
    const page = this.pageNodes.graph;
    page.innerHTML = '';

    const wrap = el('div', 'graph-wrap');
    const canvas = document.createElement('canvas');
    canvas.id = 'graph-canvas';
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('aria-label', t('graph.aria'));
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-describedby', 'graph-kbd-hint');
    const readout = el('div', 'graph-readout', '');
    // role=status: иначе aria-label на div без роли запрещён (axe aria-prohibited-attr).
    readout.setAttribute('role', 'status');
    readout.setAttribute('aria-live', 'polite');
    readout.setAttribute('aria-label', t('graph.readoutAria'));
    wrap.appendChild(canvas);
    wrap.appendChild(readout);
    page.appendChild(wrap);

    const list = el('div', 'fn-list');
    page.appendChild(list);
    page.appendChild(this._rangeRow());
    page.appendChild(this._paramRow());

    const row = el('div', 'row');
    row.style.marginTop = '10px';
    const addBtn = el('button', 'btn primary', t('graph.add'));
    addBtn.onclick = function () {
      const fn = { fx: 'sin(x)', color: self._nextColor(), show: true };
      self._addFunction(fn);
    };
    const resetBtn = el('button', 'btn', t('graph.reset'));
    resetBtn.onclick = function () {
      self.graphView.resetView();
    };
    const pngBtn = el('button', 'btn', 'PNG');
    pngBtn.onclick = function () {
      if (!self.graphView.exportPng('graph.png')) {
        self._toast(t('graph.pngFail'));
      }
    };
    const svgBtn = el('button', 'btn', 'SVG');
    svgBtn.onclick = function () {
      if (!self.graphView.exportSvg('graph.svg')) {
        self._toast(t('graph.svgFail'));
      }
    };
    const intersectBtn = el('button', 'btn', t('graph.intersections'));
    intersectBtn.onclick = function () {
      const pts = self.graphView.findIntersections();
      if (pts.length === 0) {
        self._toast(t('graph.noIntersections'));
        return;
      }
      const lines = pts.map(function (p, i) {
        return t('graph.intersectLine', { n: i + 1, x: F.fmt(p.x, 8), y: F.fmt(p.y, 8) });
      });
      readout.textContent = lines.join('\n');
    };
    const fitBtn = el('button', 'btn', t('graph.fitY'));
    fitBtn.onclick = function () {
      if (!self.graphView.autofit()) {
        self._toast(t('graph.fitFail'));
      }
    };
    const csvBtn = el('button', 'btn', 'CSV');
    csvBtn.onclick = function () {
      if (!self.graphView.exportCsv('graph.csv')) {
        self._toast(t('graph.csvFail'));
      }
    };
    const tableBtn = el('button', 'btn', t('graph.table'));
    tableBtn.onclick = function () {
      const t = self.graphView.valueTable(10);
      const titles = ['x'].concat(
        t.fns.map(function (f, i) {
          return 'y' + (i + 1);
        })
      );
      const lines = [titles.join('   ')];
      t.rows.forEach(function (r) {
        lines.push(
          r
            .map(function (v) {
              return Number.isFinite(v) ? F.fmt(v, 4) : '—';
            })
            .join('   ')
        );
      });
      readout.textContent = lines.join('\n');
    };
    const hint = el('div', {
      cls: 'hint',
      attrs: { id: 'graph-kbd-hint' },
      text: t('graph.hint'),
    });
    row.appendChild(addBtn);
    row.appendChild(resetBtn);
    row.appendChild(fitBtn);
    row.appendChild(pngBtn);
    row.appendChild(svgBtn);
    row.appendChild(csvBtn);
    row.appendChild(tableBtn);
    row.appendChild(intersectBtn);
    page.appendChild(row);
    page.appendChild(hint);

    this.graphView = new window.CW.graph.GraphView(canvas);
    // WCAG 2.1.1 / 2.5.7: всё, что делает мышь (пан/зум), доступно с клавиатуры.
    canvas.addEventListener('keydown', function (ev) {
      const g = self.graphView;
      const dx = (g.xmax - g.xmin) * 0.1;
      const dy = (g.ymax - g.ymin) * 0.1;
      let handled = true;
      if (ev.key === 'ArrowLeft') {
        g.xmin -= dx;
        g.xmax -= dx;
      } else if (ev.key === 'ArrowRight') {
        g.xmin += dx;
        g.xmax += dx;
      } else if (ev.key === 'ArrowUp') {
        g.ymin += dy;
        g.ymax += dy;
      } else if (ev.key === 'ArrowDown') {
        g.ymin -= dy;
        g.ymax -= dy;
      } else if (ev.key === '+' || ev.key === '=') {
        g.xmin += dx / 2;
        g.xmax -= dx / 2;
        g.ymin += dy / 2;
        g.ymax -= dy / 2;
      } else if (ev.key === '-' || ev.key === '_') {
        g.xmin -= dx / 2;
        g.xmax += dx / 2;
        g.ymin -= dy / 2;
        g.ymax += dy / 2;
      } else if (ev.key === '0' || ev.key === 'Home') {
        g.resetView();
      } else {
        handled = false;
      }
      if (handled) {
        ev.preventDefault();
        g.render();
        self._syncRangeInputs();
        readout.textContent = t('graph.view', { min: F.fmt(g.xmin, 4), max: F.fmt(g.xmax, 4) });
      }
    });
    this.graphView.onHover = function () {
      readout.textContent = self.graphView.hoverText();
    };
    this.graphView.onChange = function () {
      self._syncRangeInputs();
    };
    // Поля диапазона создаются до graphView, поэтому заполняем их значениями
    // текущего вида сразу — иначе первое же изменение не пройдёт валидацию.
    this._syncRangeInputs();
    this._addFunction({ fx: 'sin(x)', color: window.CW.graph.COLORS[0], show: true });
  };

  App.prototype._nextColor = function () {
    const COLORS = window.CW.graph.COLORS;
    return COLORS[this.graphView.functions.length % COLORS.length];
  };

  App.prototype._addFunction = function (fn) {
    const self = this;
    const P = window.CW.parser;
    fn.mode = fn.mode || 'y';
    fn.show = true;

    // Пересобираем все компиляторы функции в зависимости от режима.
    const compileAll = function () {
      try {
        fn.f = P.compileFn(fn.fx, true);
        fn.g = fn.mode === 'param' ? P.compileFn(fn.gy || '0', true) : null;
        fn.error = null;
      } catch (e) {
        fn.error = e.message || String(e);
        fn.f = function () {
          throw e;
        };
        fn.g = null;
      }
    };
    compileAll();
    this.graphView.functions.push(fn);

    const row = el('div', 'fn-row');
    const sw = el('button', 'swatch');
    sw.style.background = fn.color;
    sw.setAttribute('aria-label', t('graph.colorFn', { fx: fn.fx }));
    sw.title = t('graph.changeColor');

    const modeSel = el('select', 'field fn-mode');
    [
      ['graph.mode.y', 'y'],
      ['graph.mode.polar', 'polar'],
      ['graph.mode.param', 'param'],
    ].forEach(function (p) {
      const o = el('option', null, t(p[0]));
      o.value = p[1];
      modeSel.appendChild(o);
    });
    modeSel.value = fn.mode;
    modeSel.setAttribute('aria-label', t('graph.mode'));

    const wrapInput = el('div', 'fn-inputs');
    const input = el('input');
    input.type = 'text';
    input.value = fn.fx;
    input.placeholder = fn.mode === 'polar' ? t('graph.ph.fxPolar') : t('graph.ph.fx');
    input.setAttribute('aria-label', t('graph.fnInput'));
    const input2 = el('input');
    input2.type = 'text';
    input2.value = fn.gy || 'cos(t)';
    input2.placeholder = t('graph.fnInputY');
    input2.setAttribute('aria-label', t('graph.fnInputY'));
    input2.style.display = fn.mode === 'param' ? '' : 'none';
    wrapInput.appendChild(input);
    wrapInput.appendChild(input2);

    const eye = el('button', 'btn', '●');
    eye.setAttribute('aria-label', t('graph.toggleFn', { fx: fn.fx }));
    eye.setAttribute('aria-pressed', 'true');
    eye.title = t('graph.toggle');
    const del = el('button', 'btn', '×');
    del.setAttribute('aria-label', t('graph.delFn', { fx: fn.fx }));
    del.title = t('graph.del');

    const repaint = function () {
      row.style.borderColor = fn.error ? 'var(--err)' : '';
      self.graphView.render();
    };
    input.oninput = function () {
      fn.fx = input.value;
      compileAll();
      repaint();
    };
    input2.oninput = function () {
      fn.gy = input2.value;
      compileAll();
      repaint();
    };
    modeSel.onchange = function () {
      fn.mode = modeSel.value;
      input2.style.display = fn.mode === 'param' ? '' : 'none';
      input.placeholder = fn.mode === 'polar' ? t('graph.ph.fxPolar') : t('graph.ph.fx');
      compileAll();
      repaint();
    };
    if (fn.error) {
      row.style.borderColor = 'var(--err)';
    }
    eye.onclick = function () {
      fn.show = !fn.show;
      eye.style.opacity = fn.show ? '1' : '0.35';
      eye.setAttribute('aria-pressed', fn.show ? 'true' : 'false');
      self.graphView.render();
    };
    del.onclick = function () {
      const i = self.graphView.functions.indexOf(fn);
      if (i >= 0) {
        self.graphView.functions.splice(i, 1);
      }
      row.remove();
      self.graphView.render();
    };
    sw.onclick = function () {
      const idx = self.graphView.functions.indexOf(fn);
      const next = window.CW.graph.COLORS[(idx + 1) % window.CW.graph.COLORS.length];
      fn.color = next;
      sw.style.background = next;
      self.graphView.render();
    };

    row.appendChild(sw);
    row.appendChild(modeSel);
    row.appendChild(wrapInput);
    row.appendChild(eye);
    row.appendChild(del);
    this.pageNodes.graph.querySelector('.fn-list').appendChild(row);
    this.graphView.render();
  };

  App.prototype._rangeRow = function () {
    const self = this;
    const card = el('div', 'card');
    card.style.marginTop = '10px';
    card.appendChild(el('h2', null, t('graph.range')));
    const row = el('div', 'row');
    this.rangeInputs = {};
    [
      ['xmin', 'X min'],
      ['xmax', 'X max'],
      ['ymin', 'Y min'],
      ['ymax', 'Y max'],
    ].forEach(function (p) {
      const wrapEl = el('div', 'row');
      wrapEl.style.flex = '1 1 110px';
      const input = el('input', 'field');
      input.type = 'text';
      input.id = 'graph-' + p[0];
      input.style.flex = '1 1 auto';
      input.setAttribute('aria-label', p[1]);
      const label = document.createElement('label');
      label.textContent = p[1];
      label.setAttribute('for', input.id);
      label.style.color = 'var(--sub)';
      label.style.fontSize = '12px';
      input.onchange = function () {
        const xmin = parseFloat(self.rangeInputs.xmin.value);
        const xmax = parseFloat(self.rangeInputs.xmax.value);
        const ymin = parseFloat(self.rangeInputs.ymin.value);
        const ymax = parseFloat(self.rangeInputs.ymax.value);
        if (![xmin, xmax, ymin, ymax].every(Number.isFinite)) {
          self._syncRangeInputs();
          return;
        }
        try {
          self.graphView.setRange(xmin, xmax, ymin, ymax);
          self.graphView.render();
        } catch (err) {
          self._toast(err.message || String(err));
          self._syncRangeInputs();
        }
      };
      wrapEl.appendChild(label);
      wrapEl.appendChild(input);
      self.rangeInputs[p[0]] = input;
      row.appendChild(wrapEl);
    });
    card.appendChild(row);

    // Log scale checkboxes
    const logRow = el('div', 'row');
    logRow.style.marginTop = '8px';
    logRow.style.alignItems = 'center';
    logRow.style.gap = '16px';
    const logXLabel = el('label', 'check-row');
    const logXCheckbox = el('input');
    logXCheckbox.type = 'checkbox';
    logXCheckbox.id = 'graph-log-x';
    logXCheckbox.onchange = function () {
      self.graphView.setLogScale('x', this.checked);
    };
    logXLabel.appendChild(logXCheckbox);
    logXLabel.appendChild(document.createTextNode(t('graph.logX')));
    logRow.appendChild(logXLabel);

    const logYLabel = el('label', 'check-row');
    const logYCheckbox = el('input');
    logYCheckbox.type = 'checkbox';
    logYCheckbox.id = 'graph-log-y';
    logYCheckbox.onchange = function () {
      self.graphView.setLogScale('y', this.checked);
    };
    logYLabel.appendChild(logYCheckbox);
    logYLabel.appendChild(document.createTextNode(t('graph.logY')));
    logRow.appendChild(logYLabel);

    card.appendChild(logRow);
    return card;
  };

  // Ползунки параметров a–d и интервал θ/t для полярного/параметрического режимов.
  App.prototype._paramRow = function () {
    const self = this;
    const card = el('div', 'card');
    card.style.marginTop = '10px';
    card.appendChild(el('h2', null, t('graph.paramsTitle')));

    const row = el('div', 'row');
    self.paramInputs = {};
    ['A', 'B', 'C', 'D'].forEach(function (name) {
      const w = el('div', 'row param-cell');
      const label = document.createElement('label');
      label.textContent = name + ' =';
      label.setAttribute('for', 'graph-param-' + name);
      label.style.color = 'var(--sub)';
      label.style.fontSize = '12px';
      const input = el('input', 'field');
      input.type = 'range';
      input.id = 'graph-param-' + name;
      input.min = '-10';
      input.max = '10';
      input.step = '0.1';
      const def = name === 'A' ? 1 : name === 'B' ? 1 : 0;
      input.value = String(def);
      input.style.flex = '1 1 auto';
      input.setAttribute('aria-label', t('graph.paramAria', { name: name }));
      const out = el('span', 'hint', input.value);
      out.style.minWidth = '36px';
      out.style.textAlign = 'right';
      input.oninput = function () {
        window.CW.parser.setVar(name, parseFloat(input.value));
        out.textContent = input.value;
        self.graphView.render();
      };
      window.CW.parser.setVar(name, def);
      w.appendChild(label);
      w.appendChild(input);
      w.appendChild(out);
      self.paramInputs[name] = input;
      row.appendChild(w);
    });
    card.appendChild(row);

    // Интервал параметра θ/t для неразрывных (полярных/параметрических) кривых.
    const domRow = el('div', 'row');
    domRow.style.marginTop = '8px';
    [
      ['tmin', '0'],
      ['tmax', String(2 * Math.PI)],
    ].forEach(function (p) {
      const w = el('div', 'row');
      w.style.flex = '1 1 110px';
      const input = el('input', 'field');
      input.type = 'text';
      input.id = 'graph-' + p[0];
      input.value = p[1];
      input.style.flex = '1 1 auto';
      input.setAttribute('aria-label', t('graph.domain') + ' ' + p[0]);
      const label = document.createElement('label');
      label.textContent = t('graph.domain') + ' ' + p[0];
      label.setAttribute('for', input.id);
      label.style.color = 'var(--sub)';
      label.style.fontSize = '12px';
      input.onchange = function () {
        const lo = parseFloat(self.tRangeInputs.tmin.value);
        const hi = parseFloat(self.tRangeInputs.tmax.value);
        if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi === lo) {
          return;
        }
        self.graphView.tmin = lo;
        self.graphView.tmax = hi;
        self.graphView.render();
      };
      w.appendChild(label);
      w.appendChild(input);
      self.tRangeInputs = self.tRangeInputs || {};
      self.tRangeInputs[p[0]] = input;
      domRow.appendChild(w);
    });
    card.appendChild(domRow);
    card.appendChild(el('div', 'hint', t('graph.paramsHint')));
    return card;
  };

  App.prototype._syncRangeInputs = function () {
    if (!this.rangeInputs || !this.graphView) {
      return;
    }
    const g = this.graphView;
    if (document.activeElement === this.rangeInputs.xmin) {
      return;
    }
    this.rangeInputs.xmin.value = F.fmt(g.xmin, 6);
    this.rangeInputs.xmax.value = F.fmt(g.xmax, 6);
    this.rangeInputs.ymin.value = F.fmt(g.ymin, 6);
    this.rangeInputs.ymax.value = F.fmt(g.ymax, 6);
  };

  App.prototype._toast = function (msg) {
    const t = el('div', { cls: null, attrs: { role: 'status', 'aria-live': 'polite' }, text: msg });
    t.style.cssText =
      'position:fixed;bottom:18px;left:50%;transform:translateX(-50%);' +
      'background:var(--card);border:1px solid var(--err);color:var(--err);' +
      'padding:9px 15px;border-radius:10px;font-size:13px;z-index:99;';
    document.body.appendChild(t);
    setTimeout(function () {
      t.remove();
    }, 2600);
  };

  return { App: App, TABS: TABS, el: el };
})();

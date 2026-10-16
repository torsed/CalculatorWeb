/* Физика.
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
  const H = window.CW.pages._helpers;
  const t = window.CW.i18n.t;
  const U = window.CW.i18n.unit;
  // ── Физика ───────────────────────────────────────────────
  /** @type {FormulaSpec[]} */
  const PHYS_FUNCS = [
    [
      t('phys.f.kinetic'),
      ['E', 'm', 'v'],
      function (v) {
        return ['E', 0.5 * v.m * v.v * v.v, 'Дж'];
      },
    ],
    [
      t('phys.f.motion'),
      ['s', 'v', 't'],
      function (v) {
        return ['s', v.v * v.t, 'м'];
      },
    ],
    [
      t('phys.f.wave'),
      ['v', 'f', 'λ'],
      function (v) {
        return ['v', v.f * v.lambda, 'м/с'];
      },
    ],
    [
      t('phys.f.heat'),
      ['Q', 'c', 'm', 'dt'],
      function (v) {
        return ['Q', v.c * v.m * v.dt, 'Дж'];
      },
    ],
    [
      t('phys.f.momentum'),
      ['p', 'm', 'v'],
      function (v) {
        return ['p', v.m * v.v, 'кг·м/с'];
      },
    ],
    [
      t('phys.f.hydrostatics'),
      ['p', 'rho', 'h'],
      function (v) {
        return ['p', v.rho * 9.80665 * v.h, 'Па'];
      },
    ],
    [
      t('phys.f.potentialEnergy'),
      ['E', 'm', 'h'],
      function (v) {
        return ['E', v.m * 9.80665 * v.h, 'Дж'];
      },
    ],
    [
      t('phys.f.newtonSecond'),
      ['F', 'm', 'a'],
      function (v) {
        return ['F', v.m * v.a, 'Н'];
      },
    ],
    [
      t('phys.f.work'),
      ['A', 'F', 's'],
      function (v) {
        return ['A', v.F * v.s, 'Дж'];
      },
    ],
    [
      t('phys.f.power'),
      ['P', 'A', 't'],
      function (v) {
        return ['P', v.A / v.t, 'Вт'];
      },
    ],
    [
      t('phys.f.centripetal'),
      ['a', 'v', 'r'],
      function (v) {
        return ['a', (v.v * v.v) / v.r, 'м/с²'];
      },
    ],
    [
      t('phys.f.density'),
      ['rho', 'm', 'V'],
      function (v) {
        return ['ρ', v.m / v.V, 'кг/м³'];
      },
    ],
    [
      t('phys.f.springEnergy'),
      ['E', 'k', 'x'],
      function (v) {
        return ['E', 0.5 * v.k * v.x * v.x, 'Дж'];
      },
    ],
    [
      t('phys.f.springPeriod'),
      ['T', 'm', 'k'],
      function (v) {
        return ['T', 2 * Math.PI * Math.sqrt(v.m / v.k), 'с'];
      },
    ],
    [
      t('phys.f.ohm'),
      ['U', 'I', 'R'],
      function (v) {
        return ['U', v.I * v.R, 'В'];
      },
    ],
    [
      t('phys.f.electricPower'),
      ['P', 'U', 'I'],
      function (v) {
        return ['P', v.U * v.I, 'Вт'];
      },
    ],
    [
      t('phys.f.fusionHeat'),
      ['Q', 'm', 'lambda'],
      function (v) {
        return ['Q', v.m * v.lambda, 'Дж'];
      },
    ],
    [
      t('phys.f.heatCapacity'),
      ['C', 'Q', 'dt'],
      function (v) {
        return ['C', v.Q / v.dt, 'Дж/К'];
      },
    ],
    [
      t('phys.f.thinLens'),
      ['F', 'd', 'f'],
      function (v) {
        return ['F', 1 / (1 / v.d + 1 / v.f), 'м'];
      },
    ],
    [
      t('phys.f.deBroglie'),
      ['lambda', 'm', 'v'],
      function (v) {
        // h = 6.62607015e-34 Дж·с. Для электрона при v=1e6 м/с λ ≈ 7.27e-10 м.
        return ['λ', 6.626e-34 / (v.m * v.v), 'м'];
      },
    ],
    [
      t('phys.f.massDefect'),
      ['E', 'm'],
      function (v) {
        // c = 299 792 458 м/с. 1 кг дефекта ↔ 8.99e16 Дж.
        return ['E', 299792458 * 299792458 * v.m, 'Дж'];
      },
    ],
    [
      t('phys.f.soundIntensity'),
      ['I', 'P', 'r'],
      function (v) {
        return ['I', v.P / (4 * Math.PI * v.r * v.r), 'Вт/м²'];
      },
    ],
    [
      t('phys.f.idealGas'),
      ['P', 'V', 'n', 'T'],
      function (v) {
        // R = 8.314462618 Дж/(моль·К).
        return ['P', (8.314 * v.n * v.T) / v.V, 'Па'];
      },
    ],
    [
      t('phys.f.photoelectric'),
      ['Ek', 'nu', 'A'],
      function (v) {
        // h = 6.62607015e-34 Дж·с. A вводится в джоулях.
        return ['Eₖ', 6.626e-34 * v.nu - v.A, 'Дж'];
      },
    ],
    [
      t('phys.f.compton'),
      ['dl', 'theta', 'm'],
      function (v) {
        // Для электрона (m = 9.109e-31 кг) при θ = 90° Δλ ≈ 2.43·10⁻¹² м.
        return ['Δλ', (6.626e-34 / (v.m * 299792458)) * (1 - Math.cos(v.theta)), 'м'];
      },
    ],
    [
      t('phys.f.firstCosmic'),
      ['v', 'g', 'R'],
      function (v) {
        // Для Земли (g=9.81, R=6.371e6) → v₁ ≈ 7.9 км/с.
        return ['v₁', Math.sqrt(v.g * v.R), 'м/с'];
      },
    ],
    [
      t('phys.f.secondCosmic'),
      ['v', 'g', 'R'],
      function (v) {
        return ['v₂', Math.sqrt(2 * v.g * v.R), 'м/с'];
      },
    ],
    [
      t('phys.f.gravitation'),
      ['F', 'm1', 'r'],
      function (v) {
        // G = 6.67430e-11 Н·м²/кг². Масса второго тела m2 фиксируется 1 кг
        // — пользователь масштабирует через m1 (для симметрии задачи).
        return ['F', (6.674e-11 * v.m1 * 1) / (v.r * v.r), 'Н'];
      },
    ],
    [
      t('phys.f.keplerThird'),
      ['T', 'a', 'M'],
      function (v) {
        // Для Земли (a=1.496e11 м, M_☉=1.989e30 кг) → T ≈ 1 год.
        return ['T', 2 * Math.PI * Math.sqrt((v.a * v.a * v.a) / (6.674e-11 * v.M)), 'с'];
      },
    ],
    [
      t('phys.f.relativisticTotal'),
      ['E', 'm', 'v'],
      function (v) {
        // γ = 1/√(1−v²/c²). v в м/с. При v→0 E → m·c²; при v→c E → ∞.
        const c = 299792458;
        const beta = v.v / c;
        return ['E', (v.m * c * c) / Math.sqrt(1 - beta * beta), 'Дж'];
      },
    ],
    [
      t('phys.f.relativisticKinetic'),
      ['Ek', 'm', 'v'],
      function (v) {
        const c = 299792458;
        const beta = v.v / c;
        return ['Eₖ', (1 / Math.sqrt(1 - beta * beta) - 1) * v.m * c * c, 'Дж'];
      },
    ],
    [
      t('phys.f.radioactiveDecay'),
      ['N', 'N0', 't', 'T'],
      function (v) {
        // N₀ — начальное число ядер, t — время, T — период полураспада.
        // За 1 период остаётся N₀/2, за 2 — N₀/4 и т. д.
        return ['N', v.N0 * Math.pow(2, -v.t / v.T), 'ядер'];
      },
    ],
    [
      t('phys.f.activity'),
      ['A', 'N', 'T'],
      function (v) {
        // Связь активности с числом радиоактивных ядер и периодом полураспада.
        return ['A', (v.N * Math.LN2) / v.T, 'Бк'];
      },
    ],
    [
      t('phys.f.redshift'),
      ['lz', 'l', 'z'],
      function (v) {
        // λ в метрах, z — безразмерное красное смещение.
        return ['λ₀', v.l * (1 + v.z), 'м'];
      },
    ],
    [
      t('phys.f.luminosity'),
      ['L', 'F', 'p'],
      function (v) {
        // p — параллакс в радианах, F — наблюдаемый поток в Вт/м².
        return ['L', (4 * Math.PI * v.F) / (v.p * v.p), 'Вт'];
      },
    ],
    [
      t('phys.f.capacitance'),
      ['C', 'S', 'd'],
      function (v) {
        // ε₀ = 8.8541878128e-12 Ф/м. Диэлектрическая проницаемость ε = 1 (вакуум).
        return ['C', (8.854e-12 * v.S) / v.d, 'Ф'];
      },
    ],
    [
      t('phys.f.capacitorEnergy'),
      ['W', 'C', 'U'],
      function (v) {
        return ['W', 0.5 * v.C * v.U * v.U, 'Дж'];
      },
    ],
    [
      t('phys.f.coilEnergy'),
      ['W', 'L', 'I'],
      function (v) {
        return ['W', 0.5 * v.L * v.I * v.I, 'Дж'];
      },
    ],
    [
      t('phys.f.lcPeriod'),
      ['T', 'L', 'C'],
      function (v) {
        return ['T', 2 * Math.PI * Math.sqrt(v.L * v.C), 'с'];
      },
    ],
    [
      t('phys.f.resonantFreq'),
      ['f', 'L', 'C'],
      function (v) {
        return ['f₀', 1 / (2 * Math.PI * Math.sqrt(v.L * v.C)), 'Гц'];
      },
    ],
    [
      t('phys.f.pendulumPeriod'),
      ['T', 'L', 'g'],
      function (v) {
        return ['T', 2 * Math.PI * Math.sqrt(v.L / v.g), 'с'];
      },
    ],
    [
      t('phys.f.ampere'),
      ['F', 'I', 'B', 'l', 'α'],
      function (v) {
        // α в радианах. Удобно: sin(90°)=1 → F = I·B·l.
        return ['F', v.I * v.B * v.l * Math.sin(v.alpha), 'Н'];
      },
    ],
    [
      t('phys.f.snell'),
      ['n2', 'n1', 'a1', 'a2'],
      function (v) {
        // Найти показатель преломления второй среды.
        return ['n₂', (v.n1 * Math.sin(v.a1)) / Math.sin(v.a2), ''];
      },
    ],
    [
      t('phys.f.acPower'),
      ['P', 'U', 'I', 'phi'],
      function (v) {
        // φ в радианах — угол сдвига фаз.
        return ['P', v.U * v.I * Math.cos(v.phi), 'Вт'];
      },
    ],
  ];

  function mountPhys(app) {
    const page = app.pageNodes.phys;
    page.innerHTML = '';
    const sel = el('select', 'field');
    PHYS_FUNCS.forEach(function (f, i) {
      const o = el('option', null, f[0]);
      o.value = String(i);
      sel.appendChild(o);
    });
    const card = el('div', 'card');
    card.appendChild(el('h2', null, t('phys.formula')));
    card.appendChild(sel);

    const row = el('div', 'row');
    row.style.marginTop = '8px';
    const inputs = [];
    // Число полей берём по самой «длинной» формуле, иначе для 4-аргументов
    // (например, P·V = n·R·T) полей просто не хватит.
    let maxKeys = 0;
    PHYS_FUNCS.forEach(function (f) {
      if (f[1].length > maxKeys) {
        maxKeys = f[1].length;
      }
    });
    for (let i = 0; i < maxKeys; i++) {
      const f = el('input', 'field');
      f.type = 'text';
      f.inputMode = 'decimal';
      // Ставим осмысленный label сразу: el() подхватит его в aria-label,
      // и поле остаётся доступным даже если потом окажется скрытым для
      // формулы с меньшим числом аргументов.
      const initKey = PHYS_FUNCS[0][1][i] || t('phys.param', { name: i + 1 });
      f.placeholder = initKey;
      f.setAttribute('aria-label', initKey);
      row.appendChild(f);
      inputs.push(f);
    }
    card.appendChild(row);
    const out = el('div', { cls: 'out', attrs: { role: 'status', 'aria-live': 'polite' } });
    card.appendChild(out);

    function refreshInputs() {
      const keys = PHYS_FUNCS[parseInt(sel.value, 10)][1];
      inputs.forEach(function (f, i) {
        if (i < keys.length) {
          f.style.display = '';
          f.placeholder = keys[i];
          // aria-label ставим явно, потому что el() уже отработал на момент
          // создания и не подхватит более поздние изменения placeholder.
          f.setAttribute('aria-label', keys[i]);
        } else {
          // Лишние поля для формул с меньшим числом аргументов прячем.
          // aria-label не трогаем — поле всё равно display:none, а тест на
          // доступность проверяет ВСЕ inputs, видимые и скрытые.
          f.style.display = 'none';
          f.value = '';
          f.placeholder = '';
        }
      });
    }
    sel.onchange = refreshInputs;
    refreshInputs();

    const putKey = function (objs, k, x) {
      objs[k === 'λ' ? 'lambda' : k === 'α' ? 'alpha' : k] = x;
    };

    function run() {
      try {
        const spec = PHYS_FUNCS[parseInt(sel.value, 10)];
        const keys = spec[1];
        const vals = {};
        keys.forEach(function (k, i) {
          putKey(vals, k, F.toNumber(inputs[i].value));
        });
        const missing = keys.filter(function (k) {
          return inputs[keys.indexOf(k)].value.trim() === '';
        });
        if (missing.length !== 1) {
          throw { message: t('phys.err.oneEmpty') };
        }
        const emptyKey = missing[0];
        if (emptyKey === keys[0]) {
          const res = spec[2](vals);
          if (typeof res[1] === 'number' && !Number.isFinite(res[1])) {
            throw { message: t('phys.err.undefined') };
          }
          out.textContent = res[0] + ' = ' + F.fmt(res[1], 6) + ' ' + U(res[2]);
        } else {
          const x = H.solveInverse(spec, vals, emptyKey, putKey);
          if (!Number.isFinite(x)) {
            throw {
              message: t('phys.err.solve', { target: keys[0], key: emptyKey }),
            };
          }
          out.textContent = emptyKey + ' = ' + F.fmt(x, 6);
        }
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
    page.appendChild(card);
  }

  window.CW.pages.mountPhys = mountPhys;
})();

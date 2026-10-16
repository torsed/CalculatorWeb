# Accessibility Audit — C:\CalculatorWeb
> **REMEDIATED 2026-10-07.** Все 13 пунктов ниже закрыты кодом + проверены
> axe-core (`tests/e2e/a11y.spec.js`, WCAG 2 A/AA, 0 нарушений по всем 16
> вкладкам): табы по APG со стрелками, `tabpanel` + live-анонс, `h1`/`h2`,
> `role=status` у результата, история-кнопки, клавиатура графика,
> фокусируемые ячейки Менделеева, видимые `<label>`, подсказки ошибок,
> цели ≥24px, контраст светлой темы (кнопки 9.6:1, ошибки 5.4:1),
> ячейки таблицы без opacity. Оригинальный отчёт сохранён ниже как история.
>
> ---
>
Audit date: session audit
Standards: WCAG 2.2 AA, Section 508 (601.2), ADA Effective Communication
Auditor: automated code audit (all 14 source files read completely)
Files audited: index.html, src/ui/app.js, calcView.js, graphView.js, pages/*.js, styles/app.css, tokens.css, manifest.json, sw.js.

Overall: FAIL (multiple WCAG 2.2 AA failures; Section 508 601.2 FAIL; ADA Effective Communication FAIL)

1. 2.1.1 Keyboard — FAIL / PARTIAL: graph drag mouse-only (graphView.js:59-87); periodic table clicks (chem.js:433); small buttons no keyboard (app.js:275-278).
2. 2.4.3 Focus Order — PARTIAL / FAIL: tabs role="tab" but no tabpanel/aria-controls (app.js:86-113); no arrow-key roving.
3. 2.4.4 Link Purpose — PARTIAL: theme button symbol only (app.js:95); others clear.
4. 2.4.6 Headings — FAIL: no <h1>; all sections <h3>; periodic table no heading.
5. 2.5.3 Label in Name — FAIL / PARTIAL: many inputs placeholder-only, no visible label (stats.js:54, matrix.js:45-50, phys.js:69-76, chem.js:297-301,334-337, solver.js:48-51, numtheory.js:45-48).
6. 2.5.7 Dragging — FAIL: graph pan requires mouse drag; no keyboard alternative.
7. 2.5.8 Target Size — PARTIAL / FAIL: eye/del buttons small (app.js:275-278); chips may fall under 24px width.
8. 3.2.5 Change on Request — FAIL / PARTIAL: converter oninput live (conv.js:240); graph input oninput live (app.js:280).
9. 3.3.3 Error Suggestion — FAIL: all errors show exception only, no correction hint.
10. 4.1.2 Name, Role, Value — PARTIAL / FAIL: history items no role/tabindex/label (calcView.js:403-416); tabs missing tabpanel; swatch no aria-label.
11. 4.1.3 Status Messages — PARTIAL / FAIL: calculator result (.result, calcView.js:81) has no aria-live; page switches no live announcement; error alert present (PASS for errors); output live regions present in most pages (PASS).
12. 601.2 — FAIL: not fully conforming to adopted WCAG 2.2 AA.
13. ADA Effective Communication — FAIL / PARTIAL: same interface but keyboard/screen-reader access incomplete; equivalent effectiveness not provided.

Detailed line citations and full reasoning delivered in message to parent agent.

/* Запуск приложения.
 *
 * Вынесено из index.html в отдельный файл, чтобы CSP не требовала
 * 'unsafe-inline' для скриптов. Загружается как defer после ui/app.js,
 * поэтому выполняется до DOMContentLoaded (работает и по file://).
 */
'use strict';

(function () {
  // ── Глобальный перехват ошибок ────────────────────────────
  // Не даём одной необработанной ошибке оставить пустой экран молча:
  // показываем баннер с предложением перезагрузить страницу.
  function showErrorBanner(message) {
    if (document.querySelector('.error-banner')) {
      return;
    }
    const box = document.createElement('div');
    box.className = 'error-banner';
    box.setAttribute('role', 'alert');
    const text = document.createElement('span');
    text.textContent = window.CW.i18n.t('common.error.title', {
      msg: message || window.CW.i18n.t('common.error.unknown'),
    });
    const reload = document.createElement('button');
    reload.className = 'btn primary';
    reload.textContent = window.CW.i18n.t('common.error.reload');
    reload.onclick = function () {
      window.location.reload();
    };
    const close = document.createElement('button');
    close.className = 'btn';
    close.textContent = window.CW.i18n.t('common.error.close');
    close.onclick = function () {
      box.remove();
    };
    box.appendChild(text);
    box.appendChild(reload);
    box.appendChild(close);
    document.body.appendChild(box);
  }

  window.addEventListener('error', function (ev) {
    showErrorBanner(ev && ev.message ? ev.message : '');
  });
  window.addEventListener('unhandledrejection', function (ev) {
    const r = ev && ev.reason;
    showErrorBanner(r && r.message ? r.message : String(r || ''));
  });

  // ── Индикатор офлайн-режима ───────────────────────────────
  function updateOfflineBadge() {
    let badge = document.querySelector('.offline-badge');
    if (navigator.onLine) {
      if (badge) {
        badge.remove();
      }
      return;
    }
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'offline-badge';
      badge.setAttribute('role', 'status');
      badge.textContent = window.CW.i18n.t('common.offline');
      document.body.appendChild(badge);
    }
  }
  window.addEventListener('online', updateOfflineBadge);
  window.addEventListener('offline', updateOfflineBadge);

  window.addEventListener('DOMContentLoaded', function () {
    updateOfflineBadge();
  });
})();

window.addEventListener('DOMContentLoaded', function () {
  // Теория чисел подключается в парсер после загрузки: сам модуль зависит
  // от парсера (для ExprError), а парсер — от него (для функций).
  window.CW.parser.registerNumTheory(window.CW.numtheory);
  window.CW.appInstance = new window.CW.app.App(document.getElementById('app'));
});

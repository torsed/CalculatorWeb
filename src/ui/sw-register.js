/* Регистрация Service Worker.
 *
 * Вынесено из index.html в отдельный файл, чтобы CSP не требовала
 * 'unsafe-inline' для скриптов.
 */
'use strict';
(function () {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  function showUpdateToast(worker) {
    const existing = document.querySelector('.update-toast');
    if (existing) {
      existing.remove();
    }
    const box = document.createElement('div');
    box.className = 'update-toast';
    box.setAttribute('role', 'status');
    const text = document.createElement('span');
    text.textContent = window.CW.i18n.t('common.sw.update');
    const reload = document.createElement('button');
    reload.className = 'btn primary';
    reload.textContent = window.CW.i18n.t('common.sw.reload');
    reload.onclick = function () {
      // skipWaiting ждёт сигнала — без него воркер не активируется.
      worker.postMessage('skipWaiting');
      window.location.reload();
    };
    const close = document.createElement('button');
    close.className = 'btn';
    close.textContent = window.CW.i18n.t('common.sw.later');
    close.onclick = function () {
      if (worker && worker.onstatechange) {
        worker.onstatechange = null;
      }
      box.remove();
    };
    box.appendChild(text);
    box.appendChild(reload);
    box.appendChild(close);
    document.body.appendChild(box);
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('sw.js')
      .then(function (reg) {
        // Новая версия скачалась, но текущая страница её ещё не использует.
        // Без явного предложения пользователь останется на старом коде навсегда:
        // sw.js зовёт skipWaiting, поэтому достаточно перезагрузки.
        const announce = function (worker) {
          if (!worker) {
            return;
          }
          worker.onstatechange = function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(worker);
            }
          };
        };
        reg.onupdatefound = function () {
          announce(reg.installing);
        };
        // Страница могла загрузиться раньше регистрации — проверяем текущий worker.
        if (reg.waiting && navigator.serviceWorker.controller) {
          showUpdateToast(reg.waiting);
        }
      })
      .catch(function (err) {
        console.warn('ServiceWorker registration failed:', err);
      });
  });
})();

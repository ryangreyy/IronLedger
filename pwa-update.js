/* Keeps installed PWA shells from hanging onto stale HTML/CSS after deploys. */
(function () {
  'use strict';

  var VERSION = '269';
  var KEY = 'ig-pwa-version';

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  try {
    var standalone = isStandalone();

    /* A normal browser tab always fetches fresh HTML on navigation, so
       there's nothing to force there — just remember the version cheaply
       and stop. Only an installed (standalone) shell can get stuck on a
       stale cached copy of the page. */
    if (!standalone) {
      if (localStorage.getItem(KEY) !== VERSION) {
        try { localStorage.setItem(KEY, VERSION); } catch (e) {}
      }
      return;
    }

    var url = new URL(window.location.href);
    var urlIsCurrent = url.searchParams.get('v') === VERSION;

    /* Both must already be true to skip — the stored flag AND the URL
       itself carrying the current version marker. If either is stale,
       force one full navigation through a cache-busted URL so installed
       shells cannot keep running an old HTML/app.js pair. */
    var storedIsCurrent = localStorage.getItem(KEY) === VERSION;
    if (storedIsCurrent && urlIsCurrent) return;

    var cleanups = [];

    if ('serviceWorker' in navigator) {
      cleanups.push(
        navigator.serviceWorker.getRegistrations()
          .then(function (regs) { return Promise.all(regs.map(function (reg) { return reg.unregister(); })); })
      );
    }

    if ('caches' in window) {
      cleanups.push(
        caches.keys()
          .then(function (keys) { return Promise.all(keys.map(function (key) { return caches.delete(key); })); })
      );
    }

    /* Only recorded as "handled" right here, in the same step as the
       actual cache-busted reload — never before. */
    function finish() {
      if (document.documentElement.hasAttribute('data-locked')) {
        window.addEventListener('ig:applock-unlocked', finish, { once: true });
        return;
      }
      try { localStorage.setItem(KEY, VERSION); } catch (e) {}
      url.searchParams.set('v', VERSION);
      url.searchParams.set('pwa-refresh', Date.now().toString(36));
      window.location.replace(url.href);
    }

    Promise.all(cleanups).then(finish, finish);
  } catch (e) {}
})();

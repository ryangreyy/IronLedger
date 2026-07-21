/* Keeps installed PWA shells from hanging onto stale HTML/CSS after deploys. */
(function () {
  'use strict';

  var VERSION = '224';
  var KEY = 'ig-pwa-version';

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  try {
    var cleanups = [];

    if (localStorage.getItem(KEY) !== VERSION) {
      localStorage.setItem(KEY, VERSION);

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
    }

    function refreshStandaloneUrl() {
      var url = new URL(window.location.href);
      if (isStandalone() && url.searchParams.get('v') !== VERSION) {
        url.searchParams.set('v', VERSION);
        window.location.replace(url.href);
      }
    }

    Promise.all(cleanups).then(refreshStandaloneUrl).catch(refreshStandaloneUrl);
  } catch (e) {}
})();

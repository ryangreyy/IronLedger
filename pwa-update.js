/* Keeps installed PWA shells from hanging onto stale HTML/CSS after deploys. */
(function () {
  'use strict';

  var VERSION = '319';
  var KEY = 'ig-pwa-version';
  var EXPECTED_UPDATER = 'pwa-update.js?v=95';
  var EXPECTED_MANIFEST = 'manifest.json?v=105';
  var EXPECTED_APP = 'app.js?v=220';

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  try {
    window.__IG_PWA_VERSION = VERSION;

    function attrContains(el, expected) {
      return !!(el && (el.getAttribute('src') || el.getAttribute('href') || '').indexOf(expected) !== -1);
    }

    function pageAssetsAreCurrent() {
      var updater = document.querySelector('script[src*="pwa-update.js"]');
      var manifest = document.querySelector('link[rel="manifest"]');
      var app = document.querySelector('script[src*="app.js"]');
      if (updater && !attrContains(updater, EXPECTED_UPDATER)) return false;
      if (manifest && !attrContains(manifest, EXPECTED_MANIFEST)) return false;
      if (app && !attrContains(app, EXPECTED_APP)) return false;
      return true;
    }

    var standalone = isStandalone();
    var assetsAreCurrent = pageAssetsAreCurrent();

    /* A normal browser tab always fetches fresh HTML on navigation. Only
       record the version when this document is actually using the current
       asset tags; stale HTML must not poison the installed PWA's marker. */
    if (!standalone) {
      if (assetsAreCurrent && localStorage.getItem(KEY) !== VERSION) {
        try { localStorage.setItem(KEY, VERSION); } catch (e) {}
      }
      return;
    }

    var url = new URL(window.location.href);
    var urlIsCurrent = url.searchParams.get('v') === VERSION;
    var storedIsCurrent = localStorage.getItem(KEY) === VERSION;
    if (assetsAreCurrent && urlIsCurrent) {
      if (!storedIsCurrent) {
        try { localStorage.setItem(KEY, VERSION); } catch (e) {}
      }
      watchForNextVersion();
      return;
    }

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

    function finish() {
      if (document.documentElement.hasAttribute('data-locked')) {
        window.addEventListener('ig:applock-unlocked', finish, { once: true });
        return;
      }
      url.searchParams.set('v', VERSION);
      url.searchParams.set('pwa-refresh', Date.now().toString(36));
      window.location.replace(url.href);
    }

    Promise.all(cleanups).then(finish, finish);

    function watchForNextVersion() {
      var checking = false;
      function check() {
        if (checking) return;
        checking = true;
        fetch('/pwa-update.js?latest=' + Date.now().toString(36), { cache: 'no-store' })
          .then(function (r) { return r.text(); })
          .then(function (txt) {
            var m = txt.match(/var VERSION = '([^']+)'/);
            if (!m || m[1] === VERSION) return;
            try { localStorage.removeItem(KEY); } catch (e) {}
            var next = new URL(window.location.href);
            next.searchParams.set('v', m[1]);
            next.searchParams.set('pwa-refresh', Date.now().toString(36));
            window.location.replace(next.href);
          })
          .catch(function () {})
          .then(function () { checking = false; });
      }
      window.addEventListener('pageshow', check);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) check();
      });
    }
  } catch (e) {}
})();

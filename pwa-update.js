/* Keeps installed PWA shells from hanging onto stale HTML/CSS after deploys. */
(function () {
  'use strict';

  var VERSION = '228';
  var KEY = 'ig-pwa-version';

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
  }

  try {
    /* Only act when the deploy version actually changed. Previously the
       standalone URL refresh ran on EVERY page load, and since nav links
       carry no ?v param it re-appended one and hard-reloaded on every tap —
       a visible double-load. Now the whole routine no-ops once the shell is
       current, so normal navigation is left untouched. */
    if (localStorage.getItem(KEY) === VERSION) return;
    localStorage.setItem(KEY, VERSION);

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

    /* One-time hard refresh right after a new deploy so an installed shell
       drops stale HTML — runs once per version bump, never per navigation. */
    function refreshStandaloneUrl() {
      if (!isStandalone()) return;
      var url = new URL(window.location.href);
      if (url.searchParams.get('v') === VERSION) return;
      url.searchParams.set('v', VERSION);
      window.location.replace(url.href);
    }

    Promise.all(cleanups).then(refreshStandaloneUrl).catch(refreshStandaloneUrl);
  } catch (e) {}
})();

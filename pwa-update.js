/* Keeps installed PWA shells from hanging onto stale HTML/CSS after deploys. */
(function () {
  'use strict';

  var VERSION = '233';
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
       itself carrying the current version marker. Previously the flag was
       written unconditionally up front, before it was known whether the
       forced reload below would actually run. If isStandalone() ever came
       back false on that first pass (a real risk right at PWA cold-launch,
       where display-mode can be momentarily unsettled), the shell would
       mark itself "current" without ever having reloaded — and every
       future launch would then skip this whole block forever, permanently
       stuck on stale cached HTML/JS with no way to self-heal. */
    if (localStorage.getItem(KEY) === VERSION && urlIsCurrent) return;

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
       actual reload (or the decision that no reload is needed because the
       URL already carries the current version) — never before. */
    function finish() {
      try { localStorage.setItem(KEY, VERSION); } catch (e) {}
      if (!urlIsCurrent) {
        url.searchParams.set('v', VERSION);
        window.location.replace(url.href);
      }
    }

    Promise.all(cleanups).then(finish, finish);
  } catch (e) {}
})();

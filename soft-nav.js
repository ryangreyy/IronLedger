/* soft-nav.js — opt-in client-side ("soft") navigation. FEATURE-FLAGGED,
   OFF BY DEFAULT. When on, navigating between the pages listed in
   SOFT_PAGES swaps just #main-content behind a crossfade instead of a
   full document reload, so nav/background/login session stay mounted and
   nothing reloads. Any link outside that set falls back to normal
   navigation, as does any error — so this can never trap the user.

   Enable/disable without a console (phone-friendly):
     ?softnav=1  turns it on,  ?softnav=0  turns it off.
   Or the Settings toggle, which sets the same localStorage flag.

   POC scope: Dashboard <-> Training (both load app.js, which exposes
   window.__IG_activate to re-wire + re-render the swapped-in page). */
(function () {
  'use strict';

  var FLAG = 'ig-softnav';

  /* URL-param enable/disable, then strip the param from the address bar. */
  try {
    var q = new URLSearchParams(location.search);
    if (q.has('softnav')) {
      if (q.get('softnav') === '1') localStorage.setItem(FLAG, '1');
      else localStorage.removeItem(FLAG);
      q.delete('softnav');
      history.replaceState(history.state, '',
        location.pathname + (q.toString() ? '?' + q.toString() : '') + location.hash);
    }
  } catch (e) {}

  function enabled() { try { return localStorage.getItem(FLAG) === '1'; } catch (e) { return false; } }
  if (!enabled()) return;

  var SOFT_PAGES = ['index.html', 'dashboard.html', 'training.html'];
  var CONTENT = '#main-content';
  var busy = false;

  function pageName(url) {
    try {
      var u = new URL(url, location.href);
      if (u.origin !== location.origin) return null;
      return (u.pathname.split('/').pop() || 'index.html');
    } catch (e) { return null; }
  }
  function isSoft(url) { return SOFT_PAGES.indexOf(pageName(url)) !== -1; }

  /* Re-execute the incoming page's inline body scripts (e.g. the page-tab
     handler) — innerHTML alone never runs <script>. Wrapped in an IIFE so
     repeated runs can't collide on top-level declarations. Shared libs
     (app.js, nav.js, firebase…) have a src and are skipped — they stay
     loaded once. */
  function runBodyScripts(doc) {
    doc.querySelectorAll('body script:not([src])').forEach(function (old) {
      var txt = (old.textContent || '').trim();
      if (!txt) return;
      var s = document.createElement('script');
      s.textContent = '(function(){\n' + txt + '\n})();';
      document.body.appendChild(s);
      s.parentNode.removeChild(s);
    });
  }

  function updateNavActive(name) {
    document.querySelectorAll('.nav-links a[href]').forEach(function (a) {
      a.classList.toggle('nav-current', pageName(a.getAttribute('href')) === name);
    });
    document.querySelectorAll('.mobile-bottom-nav a[href]').forEach(function (a) {
      a.classList.toggle('mbn-active', pageName(a.getAttribute('href')) === name);
    });
  }

  function navigate(url, push) {
    if (busy) return;
    busy = true;
    fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var next = doc.querySelector(CONTENT);
        var cur = document.querySelector(CONTENT);
        if (!next || !cur) { busy = false; location.href = url; return; } // hard fallback
        var apply = function () {
          if (push) history.pushState({ soft: 1 }, '', url);
          cur.innerHTML = next.innerHTML;
          if (doc.title) document.title = doc.title;
          updateNavActive(pageName(url));
          runBodyScripts(doc);
          if (typeof window.__IG_activate === 'function') window.__IG_activate();
          window.scrollTo(0, 0);
        };
        var finish = function () { busy = false; };
        if (document.startViewTransition) {
          document.startViewTransition(apply).finished.then(finish, finish);
        } else {
          apply(); finish();
        }
      })
      .catch(function () { busy = false; location.href = url; });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (a.hasAttribute('download')) return;
    if (a.hasAttribute('target') && a.getAttribute('target') !== '_self') return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (!isSoft(location.href) || !isSoft(href)) return; // only between soft pages
    var target = new URL(href, location.href);
    if (target.href === location.href) { e.preventDefault(); return; } // same page
    e.preventDefault();
    navigate(target.href, true);
  }, true);

  window.addEventListener('popstate', function () {
    if (isSoft(location.href)) navigate(location.href, false);
  });
})();

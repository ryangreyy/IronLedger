/* soft-nav.js — client-side navigation for IronGladiator pages.
   Swaps the page body area without reloading the whole app shell. The
   normal browser navigation remains the fallback on any unsupported page
   or runtime error. */
(function () {
  'use strict';

  var ROOT_ID = 'ig-soft-root';
  var HEAD_ASSET = 'data-soft-nav-head';
  var PAGE_SCRIPTS = { 'yoga.js': true };
  /* The app-shell page list lives in nav.js (window.IG_APP_PAGES), which
     loads before this file on every page. Keeping one copy avoids the two
     lists silently drifting apart when a page is added or renamed. If it's
     somehow missing, isSoft() matches nothing and every link falls back to
     ordinary browser navigation — slower, but correct. */
  var SOFT_PAGES = window.IG_APP_PAGES || [];
  var PAGE_CACHE = window.__IG_PAGE_CACHE = window.__IG_PAGE_CACHE || {};
  var PAGE_CACHE_TTL = 5 * 60 * 1000;
  var busy = false;

  function pageName(url) {
    try {
      var u = new URL(url, location.href);
      if (u.origin !== location.origin) return null;
      return (u.pathname.split('/').pop() || 'index.html').toLowerCase();
    } catch (e) { return null; }
  }

  function isSoft(url) {
    return SOFT_PAGES.indexOf(pageName(url)) !== -1;
  }

  function absoluteUrl(url) {
    try { return new URL(url, location.href).href; }
    catch (e) { return ''; }
  }

  function fetchPageHtml(url) {
    var href = absoluteUrl(url);
    if (!href) return Promise.reject(new Error('Bad navigation URL'));

    var cached = PAGE_CACHE[href];
    var now = Date.now();
    if (cached && cached.html && now - cached.time < PAGE_CACHE_TTL) {
      return Promise.resolve(cached.html);
    }
    if (cached && cached.promise) return cached.promise;

    var promise = fetch(href, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('Navigation fetch failed');
        return r.text();
      })
      .then(function (html) {
        PAGE_CACHE[href] = { html: html, time: Date.now() };
        return html;
      }, function (err) {
        delete PAGE_CACHE[href];
        throw err;
      });

    PAGE_CACHE[href] = { promise: promise, time: now };
    return promise;
  }

  function prefetchPage(url) {
    if (!isSoft(url)) return;
    fetchPageHtml(url).catch(function () {});
  }

  function scriptName(src) {
    try { return new URL(src, location.href).pathname.split('/').pop().toLowerCase(); }
    catch (e) { return ''; }
  }

  function assetUrl(el) {
    return el && (el.getAttribute('src') || el.getAttribute('href') || '');
  }

  function hasLoadedAsset(url) {
    if (!url) return true;
    var target;
    try { target = new URL(url, location.href); } catch (e) { return true; }
    return Array.from(document.querySelectorAll('script[src],link[href]')).some(function (el) {
      try {
        var loaded = new URL(assetUrl(el), location.href);
        if (el.tagName === 'SCRIPT') return loaded.pathname === target.pathname;
        return loaded.href === target.href;
      }
      catch (e) { return false; }
    });
  }

  function keepBodyNode(node) {
    if (node.nodeType !== 1) return false;
    if (node.tagName === 'SCRIPT') return true;
    if (node.tagName === 'NAV') return true;
    if (node.classList.contains('applock')) return true;
    if (node.classList.contains('mobile-bottom-nav')) return true;
    return false;
  }

  function ensureRoot() {
    var root = document.getElementById(ROOT_ID);
    if (root) return root;

    root = document.createElement('div');
    root.id = ROOT_ID;

    var firstScript = Array.from(document.body.children).find(function (el) {
      return el.tagName === 'SCRIPT';
    });
    document.body.insertBefore(root, firstScript || null);

    Array.from(document.body.childNodes).forEach(function (node) {
      if (node === root || keepBodyNode(node)) return;
      root.appendChild(node);
    });
    return root;
  }

  function pageFragment(doc) {
    var frag = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach(function (node) {
      if (keepBodyNode(node)) return;
      frag.appendChild(document.importNode(node, true));
    });
    return frag;
  }

  function syncHead(doc) {
    document.querySelectorAll('[' + HEAD_ASSET + ']').forEach(function (el) { el.remove(); });

    doc.head.querySelectorAll('link[rel="stylesheet"]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || hasLoadedAsset(href)) return;
      var clone = document.importNode(link, true);
      clone.setAttribute(HEAD_ASSET, '1');
      document.head.appendChild(clone);
    });

    doc.head.querySelectorAll('style').forEach(function (style) {
      var clone = document.importNode(style, true);
      clone.setAttribute(HEAD_ASSET, '1');
      document.head.appendChild(clone);
    });
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = new URL(src, location.href).href;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function loadHeadScripts(doc) {
    var chain = Promise.resolve();
    doc.head.querySelectorAll('script[src]').forEach(function (s) {
      var src = s.getAttribute('src');
      if (!src || hasLoadedAsset(src)) return;
      chain = chain.then(function () { return loadScript(src); });
    });
    return chain;
  }

  function runInlineScript(old) {
    var txt = (old.textContent || '').trim();
    if (!txt) return;
    var s = document.createElement('script');
    s.textContent = '(function(){\n' + txt + '\n})();';
    document.body.appendChild(s);
    s.parentNode.removeChild(s);
  }

  function runBodyScripts(doc) {
    var chain = Promise.resolve();
    doc.querySelectorAll('body script').forEach(function (old) {
      var src = old.getAttribute('src');
      if (!src) {
        chain = chain.then(function () { runInlineScript(old); });
        return;
      }

      var name = scriptName(src);
      if (PAGE_SCRIPTS[name]) {
        chain = chain.then(function () { return loadScript(src); });
        return;
      }

      if (!hasLoadedAsset(src)) {
        chain = chain.then(function () { return loadScript(src); });
      }
    });
    return chain;
  }

  function updateNavActive(name) {
    document.querySelectorAll('.nav-links a[href]').forEach(function (a) {
      a.classList.toggle('nav-current', pageName(a.getAttribute('href')) === name);
    });
    document.querySelectorAll('.mobile-bottom-nav a[href]').forEach(function (a) {
      a.classList.toggle('mbn-active', pageName(a.getAttribute('href')) === name);
    });
    var signOut = document.getElementById('signOut');
    if (signOut) signOut.style.display = name === 'settings.html' ? '' : 'none';
    if (typeof window.igCheckFeedNotifications === 'function') window.igCheckFeedNotifications();
  }

  function scrollAfterNavigation(target) {
    if (target.hash) {
      var id = decodeURIComponent(target.hash.slice(1));
      var el = id && document.getElementById(id);
      if (el) { el.scrollIntoView({ behavior: 'instant', block: 'start' }); return; }
    }
    window.scrollTo(0, 0);
  }

  function navigate(url, push) {
    if (busy) return;
    busy = true;
    var target = new URL(url, location.href);

    fetchPageHtml(target.href)
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var root = ensureRoot();
        var frag = pageFragment(doc);
        var targetUsesApp = !!doc.querySelector('script[src*="app.js"]');

        var apply = function () {
          if (push) history.pushState({ soft: 1 }, '', target.href);
          document.body.className = doc.body.className || '';
          syncHead(doc);
          root.replaceChildren(frag);
          if (doc.title) document.title = doc.title;
          updateNavActive(pageName(target.href));
        };

        var afterApply = function () {
          return loadHeadScripts(doc)
            .then(function () { return runBodyScripts(doc); })
            .then(function () {
              if (targetUsesApp && typeof window.__IG_activate === 'function') window.__IG_activate();
              scrollAfterNavigation(target);
            });
        };

        var finish = function () { busy = false; };
        var fail = function () { busy = false; location.href = target.href; };

        if (document.startViewTransition) {
          document.startViewTransition(apply).finished.then(function () {
            afterApply().then(finish, fail);
          }, fail);
        } else {
          apply();
          afterApply().then(finish, fail);
        }
      })
      .catch(function () { busy = false; location.href = target.href; });
  }

  ensureRoot();

  window.IGSoftNavPrefetch = prefetchPage;

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    if (a.hasAttribute('download')) return;
    if (a.hasAttribute('target') && a.getAttribute('target') !== '_self') return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (!isSoft(location.href) || !isSoft(href)) return;
    var target = new URL(href, location.href);
    if (target.href === location.href) { e.preventDefault(); return; }
    e.preventDefault();
    navigate(target.href, true);
  }, true);

  window.addEventListener('popstate', function () {
    if (isSoft(location.href)) navigate(location.href, false);
  });
})();

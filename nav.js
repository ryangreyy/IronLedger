(function () {
  var EMBLEMS = {
    gladius:'ti-sword', scutum:'ti-shield', summit:'ti-mountain', inferno:'ti-flame',
    surge:'ti-bolt', iron:'ti-barbell', duellum:'ti-swords', target:'ti-target',
    anchor:'ti-anchor', skull:'ti-skull', securis:'ti-axe', tridens:'ti-spade',
    serpens:'ti-dna-2', taurus:'ti-chess-rook', corona:'ti-crown', dagger:'ti-tools',
    storm:'ti-tornado', rex:'ti-chess-king'
  };

  function profileLink() {
    return document.querySelector('.mobile-bottom-nav a[href="profile.html"]');
  }

  function applyPhoto(el, url, zoom, posX, posY) {
    el.style.cssText = 'overflow:hidden;background:transparent;position:relative;';
    el.innerHTML = '';
    var img = document.createElement('img');
    img.alt = '';
    img.style.cssText = 'position:absolute;object-fit:fill;display:block;';
    img.onload = function () {
      var cW = el.offsetWidth || 24;
      var cH = el.offsetHeight || 24;
      var z = zoom != null ? zoom : 1;
      var px = posX != null ? posX : 50;
      var py = posY != null ? posY : 50;
      var base = Math.max(cW / img.naturalWidth, cH / img.naturalHeight);
      var dW = img.naturalWidth * base * z;
      var dH = img.naturalHeight * base * z;
      img.style.width = dW + 'px';
      img.style.height = dH + 'px';
      img.style.left = -((dW - cW) * px / 100) + 'px';
      img.style.top = -((dH - cH) * py / 100) + 'px';
    };
    img.src = url;
    el.appendChild(img);
  }

  function renderBottomNavAvatar() {
    var state = window.__igBottomNavAvatarState;
    var link = profileLink();
    if (!state || !link) return;
    var old = link.querySelector('i, .mbn-avatar');
    if (!old) return;
    var el = document.createElement('span');
    el.className = 'mbn-avatar';
    var profilePhoto = state.avatarPhotoUrl || '';
    var fallbackPhoto = state.photoURL || '';
    var icon = state.avatarId && EMBLEMS[state.avatarId];
    if (profilePhoto) {
      applyPhoto(el, profilePhoto, state.avatarZoom, state.avatarPosX, state.avatarPosY);
    } else if (icon) {
      el.style.cssText = 'background:' + (state.avatarBgColor || '#8b1c1c') +
        ';box-shadow:inset 0 0 0 2px ' + (state.avatarRingColor || '#d4af37') + ';';
      el.innerHTML = '<i class="ti ' + icon + '" style="font-size:12px;color:' +
        (state.avatarIconColor || '#fff') + ';line-height:1;" aria-hidden="true"></i>';
    } else if (fallbackPhoto) {
      applyPhoto(el, fallbackPhoto, null, null, null);
    } else if (state.displayName || state.email) {
      el.textContent = (state.displayName || state.email || '?').charAt(0).toUpperCase();
    } else {
      return;
    }
    old.replaceWith(el);
  }

  window.IGSyncBottomNavAvatar = function (state) {
    window.__igBottomNavAvatarState = Object.assign({}, window.__igBottomNavAvatarState || {}, state || {});
    renderBottomNavAvatar();
  };

  var style = document.createElement('style');
  style.textContent =
    '.mobile-bottom-nav{' +
      'display:none;position:fixed;box-sizing:content-box;' +
      'top:auto !important;bottom:0;left:0;right:0;' +
      'height:58px;z-index:999;' +
      'flex-direction:row;align-items:stretch;' +
      'background:#0d0f12;' +
      'box-shadow:inset 0 1px 0 rgba(210,185,110,.2),0 -6px 24px rgba(0,0,0,.55);' +
      'padding-bottom:max(env(safe-area-inset-bottom,0px),20px);' +
    '}' +
    '.mbn-item{' +
      'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'gap:3px;padding:6px 0 4px;text-decoration:none;' +
      'color:rgba(255,255,255,.22);' +
      'font-size:9px;font-family:"JetBrains Mono",monospace;font-weight:700;' +
      'letter-spacing:.06em;text-transform:uppercase;' +
      '-webkit-tap-highlight-color:transparent;transition:color .12s;' +
    '}' +
    '.mbn-item i{font-size:22px;line-height:1;}' +
    '.mbn-item svg{display:block;}' +
    '.mbn-icon-wrap{position:relative;display:inline-flex;}' +
    '.mbn-notif-dot{' +
      'position:absolute;top:-2px;right:-4px;width:9px;height:9px;border-radius:50%;' +
      'background:#ef4444;border:1.5px solid #0d0f12;box-sizing:border-box;' +
    '}' +
    '[data-theme="light"] .mbn-notif-dot{border-color:#EEF1F5;}' +
    '.mbn-avatar{' +
      'width:24px;height:24px;border-radius:50%;overflow:hidden;flex-shrink:0;' +
      'display:flex;align-items:center;justify-content:center;position:relative;' +
      'font-family:"JetBrains Mono",monospace;font-weight:700;font-size:11px;color:#fff;' +
      'background:#8b1c1c;transition:box-shadow .12s;' +
    '}' +
    '.mbn-avatar img{width:100%;height:100%;object-fit:cover;display:block;}' +
    '.mbn-item.mbn-active .mbn-avatar{box-shadow:0 0 0 2px #c1272d;}' +
    '.mbn-item.mbn-active{color:#c1272d;}' +
    '.mbn-item:not(.mbn-active):active{color:rgba(255,255,255,.55);}' +
    '[data-theme="light"] .mobile-bottom-nav{background:#EEF1F5;box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 -6px 20px rgba(24,30,45,.12);border-top:1px solid rgba(18,23,33,.10);}' +
    '[data-theme="light"] .mbn-item:not(.mbn-active){color:rgba(18,23,33,.34);}' +
    '[data-theme="light"] .mbn-item:not(.mbn-active):active{color:rgba(18,23,33,.6);}' +
    '@media(max-width:700px){' +
      '.mobile-bottom-nav{display:flex;}' +
      'body{padding-bottom:calc(58px + max(env(safe-area-inset-bottom,0px),20px)) !important;}' +
    '}' +
    /* Six evenly-split flex items leave the longest label ("Dashboard")
       very little margin on the narrowest current iPhones — trims the
       label size a touch so there's real breathing room instead of a
       near-exact fit that a small rendering difference could tip over. */
    '@media(max-width:400px){' +
      '.mbn-item{font-size:8px;letter-spacing:.03em;}' +
    '}';
  document.head.appendChild(style);

  var p = location.pathname.split('/').pop();
  if (!p || p === '/') p = 'index.html';

  var items = [
    ['index.html',    'ti-home',        'Home',     ['index.html', '']],
    ['feed.html',     'ti-layout-list', 'Feed',     ['feed.html']],
    ['training.html', 'ti-barbell',     'Training', ['training.html']],
    ['dashboard.html','#cal',           'Dashboard',['dashboard.html']],
    ['macros.html',   'ti-apple',       'Macros',   ['macros.html']],
    ['profile.html',  'ti-user-circle', 'Profile',  ['profile.html']],
  ];

  var bar = document.createElement('div');
  bar.className = 'mobile-bottom-nav';
  bar.setAttribute('role', 'navigation');
  bar.setAttribute('aria-label', 'Main navigation');
  function iconHtml(name) {
    if (name === '#cal') {
      var day = new Date().getDate();
      return '<svg class="mbn-cal" viewBox="0 0 24 24" width="22" height="22" fill="none" ' +
        'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">' +
        '<rect x="3.5" y="4.5" width="17" height="16.5" rx="2.4"/><path d="M3.5 9H20.5"/>' +
        '<path d="M8 2.6V6"/><path d="M16 2.6V6"/>' +
        '<text x="12" y="17.4" text-anchor="middle" font-size="9.5" font-weight="700" ' +
        'fill="currentColor" stroke="none" font-family="JetBrains Mono,monospace">' + day + '</text>' +
      '</svg>';
    }
    return '<i class="ti ' + name + '" aria-hidden="true"></i>';
  }

  bar.innerHTML = items.map(function (item) {
    var active = item[3].indexOf(p) >= 0 ? ' mbn-active' : '';
    var icon = iconHtml(item[1]);
    if (item[0] === 'feed.html') {
      icon = '<span class="mbn-icon-wrap">' + icon +
        '<span class="mbn-notif-dot" id="mbnFeedNotifDot" style="display:none;"></span></span>';
    }
    return '<a href="' + item[0] + '" class="mbn-item' + active + '">' +
      icon +
      '<span>' + item[2] + '</span>' +
    '</a>';
  }).join('');

  function mount() { document.body.appendChild(bar); renderBottomNavAvatar(); }
  if (document.body) { mount(); } else { document.addEventListener('DOMContentLoaded', mount); }

  /* ---- Feed notification dot ----
     Lit only for NEW stuff — a friend training today or a challenge
     landing that the user hasn't already seen — not for "is this
     still true right now." A plain state check (pending challenge
     exists / friend trained today) would never clear on its own: a
     friend who trained at 8am is still "trained today" at 8pm even
     after the user has already looked, so the dot would sit lit all
     day regardless of whether anything was actually new to them.
     Instead this fingerprints the current set of (pending challenge
     ids + friend uids who trained today) and compares it against the
     last fingerprint stored in localStorage. Visiting feed.html — the
     page that actually shows this stuff — stamps the current
     fingerprint as "seen" and clears the dot; the dot only reappears
     once the fingerprint changes again (a new challenge, or another
     friend training). Lives here (not app.js) since nav.js is the
     only script guaranteed to load on every page. */
  function igLocalISO(d) {
    var x = d || new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  }

  function igFeedSeenKey(uid) { return 'ig-feed-seen-' + uid; }

  function igComputeFeedSignal(fdb, uid, todayISO) {
    var challengeIdsP = fdb.collection('headToHead')
      .where('opponentUid', '==', uid).where('status', '==', 'pending').get()
      .then(function (snap) { return snap.docs.map(function (d) { return d.id; }).sort(); })
      .catch(function () { return []; });

    var friendUidsTodayP = Promise.all([
      fdb.collection('friendRequests').where('fromUid', '==', uid).where('status', '==', 'accepted').get(),
      fdb.collection('friendRequests').where('toUid',   '==', uid).where('status', '==', 'accepted').get(),
    ]).then(function (res) {
      var friendUids = {};
      res[0].docs.forEach(function (d) { var f = d.data().toUid;   if (f && f !== uid) friendUids[f] = true; });
      res[1].docs.forEach(function (d) { var f = d.data().fromUid; if (f && f !== uid) friendUids[f] = true; });
      var uids = Object.keys(friendUids);
      if (!uids.length) return [];
      /* A private friend never lights the dot -- even just signaling
         "this account did something today" is activity the feed itself
         would show, so it gets the same treatment as the feed proper. */
      return Promise.all(uids.map(function (fUid) {
        return Promise.all([
          fdb.collection('users/' + fUid + '/sessions').where('dateRaw', '==', todayISO).limit(1).get(),
          fdb.doc('users/' + fUid + '/settings/main').get(),
        ]).then(function (res) {
          if (res[0].empty) return null;
          var settings = res[1].exists ? res[1].data() : {};
          return settings.isPrivate ? null : fUid;
        }).catch(function () { return null; });
      })).then(function (results) { return results.filter(Boolean).sort(); });
    }).catch(function () { return []; });

    return Promise.all([challengeIdsP, friendUidsTodayP]).then(function (res) {
      return { challengeIds: res[0], friendUids: res[1] };
    });
  }

  function checkFeedNotifications() {
    var dot = document.getElementById('mbnFeedNotifDot');
    if (!dot || typeof firebase === 'undefined' || !firebase.apps.length) return;
    var user = firebase.auth().currentUser;
    if (!user) { dot.style.display = 'none'; return; }
    var fdb = firebase.firestore();
    var uid = user.uid;
    var onFeedPage = (location.pathname.split('/').pop() || 'index.html') === 'feed.html';

    igComputeFeedSignal(fdb, uid, igLocalISO()).then(function (signal) {
      var hasAnything = signal.challengeIds.length > 0 || signal.friendUids.length > 0;
      var signalStr = JSON.stringify(signal);
      var key = igFeedSeenKey(uid);

      if (onFeedPage) {
        try { localStorage.setItem(key, signalStr); } catch (e) {}
        dot.style.display = 'none';
        return;
      }
      if (!hasAnything) { dot.style.display = 'none'; return; }
      var seen = null;
      try { seen = localStorage.getItem(key); } catch (e) {}
      dot.style.display = (signalStr !== seen) ? 'block' : 'none';
    });
  }
  window.igCheckFeedNotifications = checkFeedNotifications;

  if (typeof firebase !== 'undefined' && firebase.apps.length) {
    firebase.auth().onAuthStateChanged(function () { checkFeedNotifications(); });
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) checkFeedNotifications();
  });
  window.addEventListener('pageshow', function () { checkFeedNotifications(); });

  /* ---- Prefetch other pages so navigation feels instant ----
     Plain fetch() (not <link rel=prefetch>) so this actually works on
     Safari, which has never reliably supported rel=prefetch. A warm
     HTTP cache entry is all a normal <a href> navigation needs to load
     near-instantly afterward. */
  var prefetched = {};
  function prefetchUrl(url) {
    if (!url || prefetched[url] || url === p) return;
    prefetched[url] = true;
    fetch(url, { credentials: 'same-origin' }).catch(function () {});
  }

  // Idle: warm the 6 most-visited pages (bottom nav) ahead of any tap.
  var idlePrefetch = function () {
    items.forEach(function (item) { prefetchUrl(item[0]); });
  };
  if ('requestIdleCallback' in window) requestIdleCallback(idlePrefetch, { timeout: 2000 });
  else setTimeout(idlePrefetch, 1500);

  // Intent: the instant a finger/cursor touches ANY nav link (before
  // the tap/click even completes), warm that specific destination too
  // -- covers the desktop/hamburger links (settings, tools, guide,
  // running, yoga) that aren't in the idle-prefetch set above.
  function onIntent(e) {
    var a = e.target.closest && e.target.closest('a[href*=".html"]');
    if (a) prefetchUrl(a.getAttribute('href'));
  }
  document.addEventListener('touchstart', onIntent, { passive: true });
  document.addEventListener('mousedown', onIntent);
}());

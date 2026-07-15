/* nav-auth.js — shared nav auth handler */
(function () {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

  const EMBLEMS = [
    { id:'gladius',  icon:'ti-sword'      },
    { id:'scutum',   icon:'ti-shield'     },
    { id:'summit',   icon:'ti-mountain'   },
    { id:'inferno',  icon:'ti-flame'      },
    { id:'surge',    icon:'ti-bolt'       },
    { id:'iron',     icon:'ti-barbell'    },
    { id:'duellum',  icon:'ti-swords'     },
    { id:'target',   icon:'ti-target'     },
    { id:'anchor',   icon:'ti-anchor'     },
    { id:'skull',    icon:'ti-skull'      },
    { id:'securis',  icon:'ti-axe'        },
    { id:'tridens',  icon:'ti-spade'      },
    { id:'serpens',  icon:'ti-dna-2'      },
    { id:'taurus',   icon:'ti-chess-rook' },
    { id:'corona',   icon:'ti-crown'      },
    { id:'dagger',   icon:'ti-tools'      },
    { id:'storm',    icon:'ti-tornado'    },
    { id:'rex',      icon:'ti-chess-king' },
  ];

  function applyNavPhoto(el, url, zoom, posX, posY) {
    el.style.cssText = 'overflow:hidden;background:transparent;position:relative;';
    el.innerHTML = '';
    const img = document.createElement('img');
    img.alt = '';
    img.style.cssText = 'position:absolute;object-fit:fill;';
    img.onload = function () {
      const cW = el.offsetWidth  || 36;
      const cH = el.offsetHeight || 36;
      const z  = zoom  != null ? zoom  : 1;
      const px = posX  != null ? posX  : 50;
      const py = posY  != null ? posY  : 50;
      const base = Math.max(cW / img.naturalWidth, cH / img.naturalHeight);
      const dW = img.naturalWidth  * base * z;
      const dH = img.naturalHeight * base * z;
      img.style.width  = dW + 'px';
      img.style.height = dH + 'px';
      img.style.left   = -((dW - cW) * px / 100) + 'px';
      img.style.top    = -((dH - cH) * py / 100) + 'px';
      el.style.opacity = '1';
    };
    img.src = url;
    el.appendChild(img);
  }

  /* Mirrors the top-nav avatar into the bottom nav's Profile icon so the
     nav bar visually says "this is you" instead of a generic person icon. */
  function syncBottomNavAvatar(user, avatarId, ringColor, bgColor, iconColor, avatarPhotoUrl) {
    const profileLink = document.querySelector('.mobile-bottom-nav a[href="profile.html"]');
    if (!profileLink) return;
    const old = profileLink.querySelector('i, .mbn-avatar');
    if (!old) return;
    const el = document.createElement('span');
    el.className = 'mbn-avatar';
    const emb = avatarId && EMBLEMS.find(e => e.id === avatarId);
    if (avatarPhotoUrl || (user && user.photoURL && !emb)) {
      el.innerHTML = `<img src="${avatarPhotoUrl || user.photoURL}" alt="">`;
    } else if (emb) {
      el.style.cssText = `background:${bgColor||'#8b1c1c'};box-shadow:inset 0 0 0 2px ${ringColor||'#d4af37'};`;
      el.innerHTML = `<i class="ti ${emb.icon}" style="font-size:12px;color:${iconColor||'#fff'};line-height:1;" aria-hidden="true"></i>`;
    } else if (user) {
      el.textContent = (user.displayName || user.email || '?').charAt(0).toUpperCase();
    } else {
      return;
    }
    old.replaceWith(el);
  }

  function applyAvatar(el, user, avatarId, ringColor, bgColor, iconColor, avatarPhotoUrl, avatarZoom, avatarPosX, avatarPosY) {
    syncBottomNavAvatar(user, avatarId, ringColor, bgColor, iconColor, avatarPhotoUrl);
    if (!el) return;
    if (avatarPhotoUrl) {
      applyNavPhoto(el, avatarPhotoUrl, avatarZoom, avatarPosX, avatarPosY);
      return; // opacity set inside applyNavPhoto's img.onload
    }
    const emb = avatarId && EMBLEMS.find(e => e.id === avatarId);
    if (emb) {
      el.style.cssText = `background:${bgColor||'#8b1c1c'};box-shadow:inset 0 0 0 2.5px ${ringColor||'#d4af37'};display:flex;align-items:center;justify-content:center;`;
      el.innerHTML = `<i class="ti ${emb.icon}" style="font-size:15px;color:${iconColor||'#fff'};line-height:1;" aria-hidden="true"></i>`;
    } else if (user && user.photoURL) {
      el.style.cssText = '';
      el.innerHTML = `<img src="${user.photoURL}" alt="">`;
    } else if (user) {
      el.style.cssText = '';
      el.innerHTML = '';
      el.textContent = (user.displayName || user.email || '?').charAt(0).toUpperCase();
    } else {
      el.style.cssText = '';
      el.innerHTML = '';
    }
    el.style.opacity = '1';
  }

  const auth = firebase.auth();
  const db   = firebase.firestore();

  const navSignedIn  = document.getElementById('nav-signed-in');
  const navSignedOut = document.getElementById('nav-signed-out');
  const navUserName  = document.getElementById('nav-user-name');
  const navAvatarEl  = document.getElementById('nav-avatar');
  const signOutBtn   = document.getElementById('signOut');

  if (signOutBtn) signOutBtn.addEventListener('click', () => auth.signOut());

  auth.onAuthStateChanged(async user => {
    try { localStorage.setItem('ig-signedin-guess', user ? '1' : '0'); } catch (e) {}
    if (!user) {
      /* Login wall: none of these pages are reachable while signed out —
         bounce to the home page, which hosts the sign-in / create-account
         gate. (data-authredirect kept the page hidden until now.) */
      location.replace('/index.html');
      return;
    }
    /* Signed in — reveal the page (the head guard may have hidden it). */
    document.documentElement.removeAttribute('data-authredirect');
    if (user) {
      if (navSignedOut) { navSignedOut.style.display = 'none'; }
      if (navSignedIn)  { navSignedIn.style.display = 'flex'; navSignedIn.style.opacity = '0'; }
      if (navUserName)  navUserName.textContent = user.displayName || user.email.split('@')[0];
      try {
        const snap = await db.doc(`users/${user.uid}/settings/main`).get();
        const d = snap.data() || {};
        if (d.username && navUserName) navUserName.textContent = d.username;
        applyAvatar(navAvatarEl, user, d.avatarId, d.avatarRingColor, d.avatarBgColor, d.avatarIconColor, d.avatarPhotoUrl, d.avatarZoom, d.avatarPosX, d.avatarPosY);
      } catch (_) {
        applyAvatar(navAvatarEl, user, null, null, null, null, null, null, null, null);
      }
      if (navSignedIn) navSignedIn.style.opacity = '1';
    } else {
      if (navSignedIn)  navSignedIn.style.display  = 'none';
      if (navSignedOut) { navSignedOut.style.display = ''; requestAnimationFrame(() => requestAnimationFrame(() => { navSignedOut.style.opacity = '1'; })); }
      applyAvatar(navAvatarEl, null, null, null, null, null, null, null, null, null);
    }
  });

  /* Hamburger toggle */
  const hamburger  = document.getElementById('nav-hamburger');
  const navLinksEl = document.getElementById('nav-links');
  if (hamburger && navLinksEl) {
    hamburger.addEventListener('click', e => { e.stopPropagation(); navLinksEl.classList.toggle('open'); });
    navLinksEl.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinksEl.classList.remove('open')));
    document.addEventListener('click', () => navLinksEl.classList.remove('open'));
  }
})();

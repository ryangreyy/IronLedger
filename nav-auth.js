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

  function applyAvatar(el, user, avatarId, ringColor, bgColor, iconColor, avatarPhotoUrl) {
    if (!el) return;
    if (avatarPhotoUrl) {
      el.style.cssText = 'overflow:hidden;background:transparent;';
      el.innerHTML = `<img src="${avatarPhotoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">`;
      return;
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
    if (user) {
      if (navSignedIn)  navSignedIn.style.display  = 'flex';
      if (navSignedOut) navSignedOut.style.display = 'none';
      if (navUserName)  navUserName.textContent = user.displayName || user.email.split('@')[0];
      try {
        const snap = await db.doc(`users/${user.uid}/settings/main`).get();
        const d = snap.data() || {};
        applyAvatar(navAvatarEl, user, d.avatarId, d.avatarRingColor, d.avatarBgColor, d.avatarIconColor, d.avatarPhotoUrl);
      } catch (_) {
        applyAvatar(navAvatarEl, user, null, null, null, null, null);
      }
    } else {
      if (navSignedIn)  navSignedIn.style.display  = 'none';
      if (navSignedOut) navSignedOut.style.display = '';
      applyAvatar(navAvatarEl, null, null, null, null, null);
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

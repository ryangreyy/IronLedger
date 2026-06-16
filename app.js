/* IRONGLADIATOR — Interactive logic, Firebase auth, and per-user data sync.
   Load order: firebase SDKs → firebase-config.js → data.js → this file. */

/* Always start at the very top — prevents browser scroll restoration on refresh */
history.scrollRestoration = 'manual';
if (location.hash) history.replaceState(null, null, location.pathname + location.search);
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
window.addEventListener('load', () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));

/* Arm the reveal animation before the first paint.
   Without this, .reveal elements are fully visible (no JS = no hidden state).
   With this, they start at opacity:0 and are revealed by the IO or rAF below. */
document.body.classList.add('js-loaded');
requestAnimationFrame(() => {
  document.querySelectorAll('.reveal').forEach(s => {
    if (s.getBoundingClientRect().top < window.innerHeight * 0.95) s.classList.add('in');
  });
});

/* ===== CONFETTI BURST =============================================
   Spawns small particles that fly outward from the center of anchorEl. */
function spawnConfetti(anchorEl) {
  const rect   = anchorEl.getBoundingClientRect();
  const cx     = rect.left + rect.width  / 2;
  const cy     = rect.top  + rect.height / 2;
  const colors = ['#C1272D','#F0565B','#e8eaef','#9a9ea8','#5BD6E6','#ffffff'];
  const count  = 16;
  for (let i = 0; i < count; i++) {
    const dot   = document.createElement('div');
    const size  = 5 + Math.random() * 5;
    const angle = (i / count) * 360 + (Math.random() - 0.5) * 22;
    const dist  = 28 + Math.random() * 32;
    const tx    = Math.cos(angle * Math.PI / 180) * dist;
    const ty    = Math.sin(angle * Math.PI / 180) * dist;
    Object.assign(dot.style, {
      position: 'fixed', left: cx + 'px', top: cy + 'px',
      width: size + 'px', height: size + 'px',
      background: colors[i % colors.length],
      borderRadius: Math.random() > 0.35 ? '50%' : '2px',
      pointerEvents: 'none', zIndex: '9999',
    });
    document.body.appendChild(dot);
    const anim = dot.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${tx}px),calc(-50% + ${ty}px)) scale(0.2)`, opacity: 0 },
    ], { duration: 480 + Math.random() * 240, easing: 'ease-out', fill: 'forwards' });
    anim.addEventListener('finish', () => dot.remove());
  }
}

/* ===== NEW-PR MEDALLION STAMP =====================================
   Slams the IronGladiator medallion down as a "NEW PR" wax seal. */
function showPrStamp(lift, wt) {
  if (document.querySelector('.pr-stamp-overlay')) return;
  const ov = document.createElement('div');
  ov.className = 'pr-stamp-overlay';
  ov.innerHTML =
    '<div class="pr-stamp">' +
      '<img src="favicon.svg?v=2" alt="" style="width:150px;height:150px;filter:drop-shadow(0 0 26px rgba(193,39,45,.5));">' +
      '<div class="pr-tag">NEW PR</div>' +
      '<span class="pr-lift">' + lift + ' · ' + wt + ' lbs</span>' +
    '</div>';
  document.body.appendChild(ov);
  setTimeout(() => spawnConfetti(ov), 220);
  setTimeout(() => ov.remove(), 2000);
}

/* ===== LOCAL DATE HELPER ==========================================
   Always use the device's local calendar date, never UTC.
   Accepts an optional Date object; defaults to now. */
function localDateISO(d) {
  const t = d instanceof Date ? d : new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

/* ===== FIREBASE INIT ============================================== */
firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();

/* ===== DOM HANDLES ================================================ */
const authScreen   = document.getElementById('auth-screen');
const mainContent  = document.getElementById('main-content');
const navSignedIn  = document.getElementById('nav-signed-in');
const navSignedOut = document.getElementById('nav-signed-out');
const navUserName  = document.getElementById('nav-user-name');
const navAvatar    = document.getElementById('nav-avatar');
const authError    = document.getElementById('authError');

/* ===== IRON EMBLEMS =============================================== */
const EMBLEMS = [
  { id:'gladius',  icon:'ti-sword',      label:'Gladius'   },
  { id:'scutum',   icon:'ti-shield',     label:'Scutum'    },
  { id:'summit',   icon:'ti-mountain',   label:'Summit'    },
  { id:'inferno',  icon:'ti-flame',      label:'Inferno'   },
  { id:'surge',    icon:'ti-bolt',       label:'Surge'     },
  { id:'iron',     icon:'ti-barbell',    label:'Iron'      },
  { id:'duellum',  icon:'ti-swords',     label:'Duellum'   },
  { id:'target',   icon:'ti-target',     label:'Target'    },
  { id:'anchor',   icon:'ti-anchor',     label:'Anchor'    },
  { id:'skull',    icon:'ti-skull',      label:'Skull'     },
  { id:'securis',  icon:'ti-axe',        label:'Securis'   },
  { id:'tridens',  icon:'ti-spade',      label:'Tridens'   },
  { id:'serpens',  icon:'ti-dna-2',      label:'Serpens'   },
  { id:'taurus',   icon:'ti-chess-rook', label:'Taurus'    },
  { id:'corona',   icon:'ti-crown',      label:'Corona'    },
  { id:'dagger',   icon:'ti-tools',      label:'Dagger'    },
  { id:'storm',    icon:'ti-tornado',    label:'Storm'     },
  { id:'rex',      icon:'ti-chess-king', label:'Rex'       },
];
const RING_COLORS  = ['#d4af37','#c0c0c0','#cd7f32','#e63946','#ffffff','#4a9eff','#4ade80','#ff7eb3','#b78bff','#ff8a4c','#5bd6e6','#c9a84c'];
const BG_COLORS    = [
  '#1a1a26','#12161f','#0d1320','#1e2d42','#7a0e0e',
  '#1e3a24','#3a0e1e','#4a2010','#0d2640','#1a3020',
  '#2a3442','#222730',
  '#ffffff','#e0e0e0','#ffb3b3','#ffd6a0',
  '#fff176','#a5d6a7','#90caf9','#ce93d8',
  '#f48fb1','#80deea','#c5e1a5','#ffcc80',
];
const ICON_COLORS  = ['#ffffff','#f0f4f8','#d4af37','#ff5a5a','#ff8a4c','#ffd700','#4ade80','#5bd6e6','#4a9eff','#b78bff','#ff7eb3','#c9a84c'];

let currentUser = null;

function applyNavAvatar(user, avatarId, ringColor, bgColor, iconColor) {
  if (!navAvatar) return;
  const emb = avatarId && EMBLEMS.find(e => e.id === avatarId);
  if (emb) {
    navAvatar.style.cssText = `background:${bgColor||'#8b1c1c'};box-shadow:inset 0 0 0 2.5px ${ringColor||'#d4af37'};display:flex;align-items:center;justify-content:center;`;
    navAvatar.innerHTML = `<i class="ti ${emb.icon}" style="font-size:15px;color:${iconColor||'#fff'};line-height:1;" aria-hidden="true"></i>`;
  } else if (user && user.photoURL) {
    navAvatar.style.cssText = '';
    navAvatar.innerHTML = `<img src="${user.photoURL}" alt="">`;
  } else if (user) {
    navAvatar.style.cssText = '';
    navAvatar.innerHTML = '';
    navAvatar.textContent = (user.displayName || user.email || '?').charAt(0).toUpperCase();
  }
}

function showOnboardingModal(user) {
  let obName = user.displayName || '';
  let obId   = null;
  let obRing = '#d4af37';
  let obBg   = '#8b1c1c';
  let obIcon = '#ffffff';

  authScreen.style.display = 'none';

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  const card = document.createElement('div');
  card.className = 'onboarding-card';
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  /* ---- Step 1: Display name ---- */
  function renderStepName() {
    card.innerHTML = `
      <div class="eyebrow">Welcome to IronGladiator</div>
      <h2 class="title" style="margin:6px 0 6px;">What should we call you?</h2>
      <p class="sub" style="margin-bottom:22px;">This is your display name — shown next to your avatar in the nav.</p>
      <input id="ob-name" type="text" class="auth-input" placeholder="Display name"
             value="${obName.replace(/"/g,'&quot;')}" maxlength="30"
             style="width:100%;margin-bottom:16px;">
      <button id="ob-name-continue" class="btn btn-primary" style="width:100%;margin-bottom:10px;">Continue</button>
      <button id="ob-skip-name" class="btn btn-ghost" style="font-size:13px;padding:10px 16px;width:100%;">Skip for now</button>
    `;
    const input = document.getElementById('ob-name');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    async function advanceName() {
      const name = input.value.trim();
      if (name) {
        obName = name;
        try { await user.updateProfile({ displayName: name }); } catch(e) {}
        navUserName.textContent = name;
      }
      renderStepAvatar();
    }

    input.addEventListener('keydown', e => { if (e.key === 'Enter') advanceName(); });
    document.getElementById('ob-name-continue').addEventListener('click', advanceName);
    document.getElementById('ob-skip-name').addEventListener('click', renderStepAvatar);
  }

  /* ---- Step 2: Emblem picker ---- */
  function renderStepAvatar() {
    card.innerHTML = `
      <div class="eyebrow">Pick your emblem</div>
      <h2 class="title" style="margin:6px 0 6px;">Choose your Iron Emblem</h2>
      <p class="sub" style="margin-bottom:22px;">You can customize colors in Settings.</p>
      <div id="ob-emblem-grid" class="avatar-grid" style="margin-bottom:20px;"></div>
      <button id="ob-random" class="btn btn-ghost" style="font-size:13px;padding:10px 16px;width:100%;margin-bottom:8px;">Randomize for me</button>
      <button id="ob-skip-av" class="btn btn-ghost" style="font-size:13px;padding:10px 16px;width:100%;margin-bottom:8px;">Skip for now</button>
      <button id="ob-back-av" class="btn btn-ghost" style="font-size:13px;padding:6px 16px;width:100%;">← Back</button>
    `;
    const grid = document.getElementById('ob-emblem-grid');
    grid.innerHTML = EMBLEMS.map(e =>
      `<button class="avatar-option${obId === e.id ? ' av-selected' : ''}" data-id="${e.id}" title="${e.label}" style="background:${obBg};box-shadow:inset 0 0 0 2.5px ${obRing};">
        <i class="ti ${e.icon}" style="font-size:22px;color:${obIcon};line-height:1;" aria-hidden="true"></i>
      </button>`
    ).join('');
    grid.querySelectorAll('.avatar-option').forEach(btn => {
      btn.addEventListener('click', () => { obId = btn.dataset.id; renderStepColor(); });
    });
    document.getElementById('ob-random').addEventListener('click', () => {
      obId   = EMBLEMS[Math.floor(Math.random() * EMBLEMS.length)].id;
      obRing = RING_COLORS[Math.floor(Math.random() * RING_COLORS.length)];
      obBg   = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
      obIcon = ICON_COLORS[Math.floor(Math.random() * ICON_COLORS.length)];
      renderStepColor();
    });
    document.getElementById('ob-skip-av').addEventListener('click', () => finishOnboarding(false));
    document.getElementById('ob-back-av').addEventListener('click', renderStepName);
  }

  /* ---- Step 3: Color customization ---- */
  function renderStepColor() {
    const emb = EMBLEMS.find(e => e.id === obId);
    function previewHTML() {
      return `<div id="ob-preview" style="width:72px;height:72px;border-radius:50%;background:${obBg};box-shadow:inset 0 0 0 4px ${obRing};display:flex;align-items:center;justify-content:center;transition:background .15s,box-shadow .15s;">
        <i class="ti ${emb?.icon||'ti-sword'}" style="font-size:30px;color:${obIcon};line-height:1;" aria-hidden="true"></i>
      </div>`;
    }
    function swatchRow(id, colors, selected) {
      return colors.map(c =>
        `<div class="avatar-bg-swatch${selected === c ? ' bg-selected' : ''}" data-color="${c}" data-picker="${id}" style="background:${c};"></div>`
      ).join('');
    }
    card.innerHTML = `
      <div class="eyebrow">Almost there</div>
      <h2 class="title" style="margin:6px 0 6px;">Customize your colors</h2>
      <div style="display:flex;justify-content:center;margin-bottom:20px;" id="ob-preview-wrap">${previewHTML()}</div>
      <p class="ob-group-label" style="margin-bottom:8px;">Ring color</p>
      <div class="avatar-bg-grid" style="margin-bottom:14px;" id="ob-ring-picker">${swatchRow('ring', RING_COLORS, obRing)}</div>
      <p class="ob-group-label" style="margin-bottom:8px;">Background color</p>
      <div class="avatar-bg-grid" style="margin-bottom:14px;" id="ob-bg-picker">${swatchRow('bg', BG_COLORS, obBg)}</div>
      <p class="ob-group-label" style="margin-bottom:8px;">Icon color</p>
      <div class="avatar-bg-grid" style="margin-bottom:24px;" id="ob-icon-picker">${swatchRow('icon', ICON_COLORS, obIcon)}</div>
      <button id="ob-done" class="btn btn-primary" style="width:100%;margin-bottom:10px;">Done</button>
      <button id="ob-back-color" class="btn btn-ghost" style="font-size:13px;padding:10px 16px;width:100%;">← Back</button>
    `;
    card.querySelectorAll('.avatar-bg-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        const which = sw.dataset.picker;
        if (which === 'ring') obRing = sw.dataset.color;
        else if (which === 'bg') obBg = sw.dataset.color;
        else obIcon = sw.dataset.color;
        card.querySelectorAll(`[data-picker="${which}"]`).forEach(s => s.classList.remove('bg-selected'));
        sw.classList.add('bg-selected');
        const prev = document.getElementById('ob-preview');
        if (prev) {
          prev.style.background = obBg;
          prev.style.boxShadow = `inset 0 0 0 4px ${obRing}`;
          const ico = prev.querySelector('i');
          if (ico) ico.style.color = obIcon;
        }
      });
    });
    document.getElementById('ob-done').addEventListener('click', () => finishOnboarding(true));
    document.getElementById('ob-back-color').addEventListener('click', renderStepAvatar);
  }

  /* ---- Finish ---- */
  async function finishOnboarding(save) {
    overlay.remove();
    if (save && obId) {
      try {
        await db.collection('users').doc(user.uid).collection('settings').doc('main').set(
          { avatarId: obId, avatarRingColor: obRing, avatarBgColor: obBg, avatarIconColor: obIcon },
          { merge: true }
        );
      } catch(e) {}
      applyNavAvatar(user, obId, obRing, obBg, obIcon);
    }
  }

  renderStepName();
}

/* ===== HAMBURGER MENU ============================================= */
const navHamburger = document.getElementById('nav-hamburger');
const navLinksEl   = document.getElementById('nav-links');
navHamburger.addEventListener('click', e => {
  e.stopPropagation();
  navLinksEl.classList.toggle('open');
});
navLinksEl.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinksEl.classList.remove('open'));
});
document.addEventListener('click', () => navLinksEl.classList.remove('open'));

document.querySelector('nav .brand')?.addEventListener('click', e => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===== AUTH — SIGN IN / SIGN UP / SIGN OUT ========================
   Firebase watches auth state automatically — we just react to it. */

let isSignedIn      = false;  // used by scroll-trigger below
let authPromptShown = false;  // only auto-prompt once per page load

auth.onAuthStateChanged(user => {
  if (user) {
    /* ---- Signed in ---- */
    isSignedIn = true;
    currentUser = user;
    authScreen.style.display   = 'none';
    mainContent.style.display  = '';
    navSignedIn.style.display  = 'flex';
    navSignedOut.style.display = 'none';
    navUserName.textContent = user.displayName || user.email.split('@')[0];
    applyNavAvatar(user, null, null, null, null); // placeholder; overridden by onSnapshot once settings load
    initApp(user.uid);
  } else {
    /* ---- Signed out — show landing page, render empty cards ---- */
    isSignedIn = false;
    authScreen.style.display   = 'none';
    mainContent.style.display  = '';
    navSignedIn.style.display  = 'none';
    navSignedOut.style.display = '';
    initApp(null);   // renders all cards with empty data, returns before Firestore
  }
});

/* ---- Auth modal open / close ---- */
function openAuthModal()  { authScreen.style.display = ''; }
function closeAuthModal() { authScreen.style.display = 'none'; authPromptShown = true; }

document.getElementById('navSignIn').addEventListener('click', openAuthModal);
document.getElementById('navSignUp').addEventListener('click', () => {
  openAuthModal();
  setTimeout(() => { const el = document.getElementById('authEmail'); if (el) el.focus(); }, 60);
});
document.getElementById('authClose').addEventListener('click', closeAuthModal);
authScreen.addEventListener('click', e => { if (e.target === authScreen) closeAuthModal(); });

/* ===== HIDE NAV ON SCROLL DOWN, REVEAL ON SCROLL UP =============== */
(function () {
  const nav = document.querySelector('nav');
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > lastY && y > 80) {
      nav.classList.add('nav-hidden');       // scrolling down → hide
    } else {
      nav.classList.remove('nav-hidden');    // scrolling up → reveal
    }
    lastY = y;
  }, { passive: true });
})();

/* ===== SIGNED-OUT INPUT INTERCEPT ==================================
   Clicking any input, select, textarea, or button inside the page
   (not the nav or the auth modal) opens the sign-in modal when
   the visitor is not signed in. Uses capture phase so it fires
   before focus/change handlers. preventDefault() stops the input
   from gaining focus. */
document.addEventListener('mousedown', e => {
  if (isSignedIn) return;
  if (!e.target.closest('input, select, textarea, button')) return;
  if (e.target.closest('#auth-screen, nav')) return;  // modal + nav always work
  if (e.target.closest('#calc')) return;              // 1RM calc works without account
  if (e.target.closest('.add-session-grid')) return;  // log inputs: type freely, gate only on submit
  e.preventDefault();
  openAuthModal();
}, true);

/* ===== SCROLL-TRIGGERED AUTH PROMPT ================================
   After a signed-out visitor scrolls past "This Month at a Glance",
   automatically open the sign-in modal once. Dismissed = never again
   until next page load. */
(function setupScrollPrompt() {
  const trigger = document.getElementById('glance-title');
  if (!trigger) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      // Fires the moment the title's top edge scrolls above the viewport
      if (!e.isIntersecting && e.boundingClientRect.top < 0 && !isSignedIn && !authPromptShown) {
        authPromptShown = true;
        openAuthModal();
        io.disconnect();
      }
    });
  }, { threshold: 0 });
  io.observe(trigger);
})();

/* ===== PAGE REVEAL (runs for ALL visitors, signed in or out) ========= */
function animateCount(el) {
  const target = +el.dataset.count;
  const dur = 1100, start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const counted = new WeakSet();
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('[data-count]').forEach(n => {
        if (!counted.has(n)) { counted.add(n); animateCount(n); }
      });
      e.target.classList.add('in');
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(s => revealIO.observe(s));
/* Above-fold reveals handled by the requestAnimationFrame at the top of this file */

/* Google sign-in */
document.getElementById('googleSignIn').addEventListener('click', () => {
  authError.textContent = '';
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(r => { if (r.additionalUserInfo?.isNewUser) showOnboardingModal(r.user); })
    .catch(err => { authError.textContent = friendlyError(err.code); });
});

/* Email sign-in */
document.getElementById('emailSignIn').addEventListener('click', () => {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  authError.textContent = '';
  if (!email || !password) { authError.textContent = 'Please enter your email and password.'; return; }
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => { authError.textContent = friendlyError(err.code); });
});

/* Email sign-up (create account) */
document.getElementById('emailSignUp').addEventListener('click', () => {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  authError.textContent = '';
  if (!email || !password) { authError.textContent = 'Please enter an email and password.'; return; }
  if (password.length < 6)  { authError.textContent = 'Password must be at least 6 characters.'; return; }
  auth.createUserWithEmailAndPassword(email, password)
    .then(r => { showOnboardingModal(r.user); })
    .catch(err => { authError.textContent = friendlyError(err.code); });
});

/* Sign out */
document.getElementById('signOut').addEventListener('click', () => auth.signOut());

/* Custom lift dropdown — bypasses unreliable native datalist on mobile */
(function() {
  const input  = document.getElementById('logLift');
  const btn    = document.getElementById('liftDropdownBtn');
  const list   = document.getElementById('liftDropdownList');
  if (!input || !btn || !list) return;

  /* Detach native datalist so only our custom dropdown shows */
  input.removeAttribute('list');

  function allLifts() {
    return Array.from(document.querySelectorAll('#lift-options option')).map(o => o.value);
  }

  function render(filter) {
    const q    = (filter || '').toLowerCase();
    const opts = allLifts().filter(o => !q || o.toLowerCase().includes(q));
    list.innerHTML = opts.length
      ? opts.map(o => `<div class="lift-opt">${o}</div>`).join('')
      : '<div class="lift-opt lift-opt-empty">No matches</div>';
    list.querySelectorAll('.lift-opt:not(.lift-opt-empty)').forEach(el => {
      el.addEventListener('click', () => {
        input.value = el.textContent;
        close();
        input.focus();
      });
    });
  }

  function open() { render(input.value); list.style.display = ''; list.scrollTop = 0; }
  function close() { list.style.display = 'none'; }
  function isOpen() { return list.style.display !== 'none'; }

  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    isOpen() ? close() : open();
  });

  input.addEventListener('focus', () => open());
  input.addEventListener('input', () => { if (isOpen()) render(input.value); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  document.addEventListener('pointerdown', e => {
    if (!e.target.closest('.lift-wrap')) close();
  });
})();

/* ===== BODYWEIGHT: month nav + log submit ========================= */
document.getElementById('bwPrev')?.addEventListener('click', () => {
  const [yr, mo] = bwCurrentMonth.split('-').map(Number);
  const d = new Date(yr, mo - 2, 1);
  bwCurrentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  renderBodyweight();
});
document.getElementById('bwNext')?.addEventListener('click', () => {
  const [yr, mo] = bwCurrentMonth.split('-').map(Number);
  const d = new Date(yr, mo, 1);
  bwCurrentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  renderBodyweight();
});
(function(){
  const d = document.getElementById('bwDate');
  if (!d) return;
  d.value = new Date().toISOString().slice(0, 10);
  d.addEventListener('click', () => { try { d.showPicker(); } catch(e) {} });
})();

document.getElementById('bwSubmit')?.addEventListener('click', async () => {
  if (!currentUser) return;
  const weightVal = parseFloat(document.getElementById('bwInput').value);
  const dateVal   = document.getElementById('bwDate').value;
  if (!weightVal || weightVal <= 0 || !dateVal) return;
  try {
    await db.collection('users').doc(currentUser.uid).collection('bodyweight').add({
      weight: weightVal,
      date:   dateVal,
      ts:     firebase.firestore.FieldValue.serverTimestamp(),
    });
    document.getElementById('bwInput').value = '';
    bwCurrentMonth = dateVal.slice(0, 7);
  } catch(err) { showToast('Could not save weight entry — ' + (err?.message || 'check your connection.')); }
});

/* ── TOAST NOTIFICATIONS ──────────────────────────────────────────────────── */
function showToast(message, type = 'error') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast-in'));
  setTimeout(() => {
    el.classList.remove('toast-in');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, 4500);
}

/* Plain-English versions of Firebase auth error codes */
function friendlyError(code) {
  return ({
    'auth/user-not-found':      'No account found with that email.',
    'auth/wrong-password':      'Incorrect password — please try again.',
    'auth/email-already-in-use':'An account with that email already exists. Try signing in instead.',
    'auth/invalid-email':       'Please enter a valid email address.',
    'auth/weak-password':       'Password must be at least 6 characters.',
    'auth/too-many-requests':   'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user':'Sign-in window was closed — please try again.',
    'auth/invalid-credential':  'Email or password is incorrect.',
  })[code] || 'Something went wrong. Please try again.';
}

/* ===== CUSTOM DATE PICKER =========================================
   Self-contained white calendar widget — no external libraries.
   Hides the native <input type="date"> and replaces it with a
   styled trigger button + dropdown calendar built from scratch. */
function createDatePicker(inputId, initialDate) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const todayISO = localDateISO();
  const startISO = initialDate || todayISO;
  const [sy, sm] = startISO.split('-').map(Number);

  let state = { year: sy, month: sm - 1, selected: startISO };

  /* Hide native input, keep it in DOM so existing code still reads its value */
  input.type  = 'hidden';
  input.value = startISO;

  /* Build wrapper */
  const wrap = document.createElement('div');
  wrap.className = 'dp-wrap';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  /* Trigger button */
  const trigger = document.createElement('button');
  trigger.type      = 'button';
  trigger.className = 'dp-trigger';
  wrap.insertBefore(trigger, input);

  /* Popup */
  const popup = document.createElement('div');
  popup.className    = 'dp-popup';
  popup.style.display = 'none';
  wrap.appendChild(popup);

  function fmtDisplay(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${MONTHS[m - 1].slice(0, 3)} ${d}, ${y}`;
  }

  function renderTrigger() {
    trigger.innerHTML = `
      <span>${state.selected ? fmtDisplay(state.selected) : 'Select date'}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>`;
  }

  function renderCalendar() {
    const { year, month } = state;
    const firstDay     = new Date(year, month, 1).getDay();
    const daysInMonth  = new Date(year, month + 1, 0).getDate();

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += '<button class="dp-day dp-empty" disabled></button>';
    for (let d = 1; d <= daysInMonth; d++) {
      const iso  = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const sel  = iso === state.selected;
      const tod  = iso === todayISO;
      const fut  = iso > todayISO;
      cells += `<button class="dp-day${sel?' dp-selected':''}${tod&&!sel?' dp-today':''}"
                        data-date="${iso}" ${fut?'disabled':''}>${d}</button>`;
    }

    popup.innerHTML = `
      <div class="dp-header">
        <button class="dp-nav" data-dir="-1">&#8249;</button>
        <span class="dp-month-year">${MONTHS[month]} ${year}</span>
        <button class="dp-nav" data-dir="1">&#8250;</button>
      </div>
      <div class="dp-weekdays">${DAYS.map(d => `<span>${d}</span>`).join('')}</div>
      <div class="dp-grid">${cells}</div>`;
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    if (popup.style.display === 'none') {
      /* Position the popup relative to the trigger using screen coordinates,
         so it floats above card overflow:hidden boundaries */
      const rect = trigger.getBoundingClientRect();
      popup.style.top  = (rect.bottom + 6) + 'px';
      popup.style.left = rect.left + 'px';
      renderCalendar();
      popup.style.display = 'block';
      /* If it goes off the right edge, nudge it left */
      requestAnimationFrame(() => {
        const pr = popup.getBoundingClientRect();
        if (pr.right > window.innerWidth - 8)
          popup.style.left = Math.max(8, window.innerWidth - pr.width - 8) + 'px';
      });
    } else {
      popup.style.display = 'none';
    }
  });

  popup.addEventListener('click', e => {
    e.stopPropagation();
    const nav = e.target.closest('.dp-nav');
    if (nav) {
      state.month += +nav.dataset.dir;
      if (state.month < 0)  { state.month = 11; state.year--; }
      if (state.month > 11) { state.month = 0;  state.year++; }
      renderCalendar(); return;
    }
    const day = e.target.closest('.dp-day');
    if (day && !day.disabled) {
      state.selected = day.dataset.date;
      input.value    = state.selected;
      renderTrigger();
      popup.style.display = 'none';
    }
  });

  /* Close when clicking anywhere outside */
  document.addEventListener('click', () => { popup.style.display = 'none'; });

  renderTrigger();
}

/* ===== initApp — runs once after successful sign-in ===============
   Every feature below uses uid to keep each user's data separate. */

let unsubscribeSessions   = null;   // track live listeners so we can
let unsubscribeSettings   = null;   // clean them up on sign-out
let unsubscribeBodyweight = null;

let bwCurrentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
let bwAllEntries   = [];

const BW_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function renderBodyweight() {
  const svg   = document.getElementById('bwChart');
  const empty = document.getElementById('bwEmpty');
  const list  = document.getElementById('bwList');
  const label = document.getElementById('bwMonthLabel');
  if (!svg) return;

  const [yr, mo] = bwCurrentMonth.split('-').map(Number);
  if (label) label.textContent = `${BW_MONTHS[mo - 1]} ${yr}`;

  const entries = bwAllEntries
    .filter(e => e.date && e.date.startsWith(bwCurrentMonth))
    .sort((a, b) => a.date.localeCompare(b.date));

  /* Entry list (newest first) */
  if (list) {
    if (entries.length) {
      list.innerHTML = entries.slice().reverse().map(e => {
        const [, m, d] = e.date.split('-').map(Number);
        return `<div class="bw-entry">
          <span class="bw-entry-date">${BW_MONTHS[m-1]} ${d}</span>
          <span class="bw-entry-weight">${e.weight} lbs</span>
          <button class="bw-delete btn-icon" data-id="${e.id}" aria-label="Delete">&#x2715;</button>
        </div>`;
      }).join('');
      list.querySelectorAll('.bw-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!currentUser) return;
          try { await db.collection('users').doc(currentUser.uid).collection('bodyweight').doc(btn.dataset.id).delete(); }
          catch(err) { showToast('Could not delete entry — ' + (err?.message || 'check your connection.')); }
        });
      });
    } else {
      list.innerHTML = '';
    }
  }

  /* Chart */
  if (!entries.length) {
    svg.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  const W = 700, H = window.innerWidth < 640 ? 320 : 240;
  const padL = 52, padR = 24, padT = 24, padB = 52;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const weights = entries.map(e => e.weight);
  const minW = Math.min(...weights), maxW = Math.max(...weights);
  const padY = (maxW - minW) * 0.25 || 5;
  const lo = minW - padY, hi = maxW + padY, range = hi - lo;

  const n   = entries.length;
  const xOf = i => padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
  const yOf = w => padT + chartH - ((w - lo) / range) * chartH;

  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const y   = padT + (i / 4) * chartH;
    const val = (hi - (i / 4) * range).toFixed(1);
    grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    grid += `<text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="axis-label">${val}</text>`;
  }

  const coords = entries.map((e, i) => `${xOf(i).toFixed(1)},${yOf(e.weight).toFixed(1)}`);
  const area   = `M${xOf(0).toFixed(1)},${(padT + chartH).toFixed(1)} L${coords.join(' L')} L${xOf(n-1).toFixed(1)},${(padT+chartH).toFixed(1)}Z`;

  /* Show every Nth label so they don't overlap — 44px min spacing for a DD/MM label */
  const spacing = n > 1 ? chartW / (n - 1) : chartW;
  const step = spacing < 22 ? 3 : spacing < 44 ? 2 : 1;

  let dots = '', labels = '', vlines = '';
  entries.forEach((e, i) => {
    const x = xOf(i).toFixed(1), y = yOf(e.weight).toFixed(1);
    const [, m, d] = e.date.split('-').map(Number);
    const lbl = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}`;
    vlines += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${(padT + chartH).toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
    dots += `<circle cx="${x}" cy="${y}" r="5" fill="var(--accent)" stroke="var(--bg)" stroke-width="2.5"/>`;
    if (i % step === 0 || i === n - 1) {
      labels += `<text x="${x}" y="${H - 10}" text-anchor="middle" class="axis-label">${lbl}</text>`;
    }
  });

  svg.innerHTML =
    `<defs><linearGradient id="bwgrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
    </linearGradient></defs>` +
    `<rect x="${padL}" y="${padT}" width="${chartW}" height="${chartH}" rx="3" fill="rgba(255,255,255,0.04)"/>` +
    grid + vlines +
    `<path d="${area}" fill="url(#bwgrad)"/>` +
    `<path d="M${coords.join(' L')}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` +
    dots + labels;
}

function initApp(uid) {
  /* Tear down any listeners left from a previous session */
  if (unsubscribeSessions)   { unsubscribeSessions();   unsubscribeSessions   = null; }
  if (unsubscribeSettings)   { unsubscribeSettings();   unsubscribeSettings   = null; }
  if (unsubscribeBodyweight) { unsubscribeBodyweight(); unsubscribeBodyweight = null; }
  bwAllEntries = [];

  /* Shorthand helpers for this user's Firestore sub-collections */
  const sessionsRef = () => db.collection('users').doc(uid).collection('sessions');
  const settingsRef = () => db.collection('users').doc(uid).collection('settings').doc('main');

  let goalsDonePage = 1;
  let goalsDoneFilter = 'all';
  const GOALS_DONE_PAGE = 5;

  let calViewYear = new Date().getFullYear();
  let calViewMonth = new Date().getMonth();

  renderGoals(null);

  document.getElementById('calPrev').addEventListener('click', () => {
    calViewMonth--;
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calViewMonth++;
    if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
    renderCalendar();
  });

  document.addEventListener('click', () => {
    const pop = document.getElementById('calPopover');
    if (pop) pop.style.display = 'none';
  });

  /* ---- 1) ANIMATED COUNT-UP ----------------------------------------
     When a section scrolls into view, numbers count up from 0. */
  /* reveal observer now runs at top level — see initReveal() below */

  /* ---- 2) LIFT BREAKDOWN DONUT CHART ---------------------------------
   Shows what % of sets were spent on each lift for a selected day.
   Data comes from the user's logged sessions in Firebase. */

  function getDonutColor(cls) {
    return {
      squat: currentSettings?.colorSquat || '#D6FF3D',
      bench: currentSettings?.colorBench || '#5BD6E6',
      dead:  currentSettings?.colorDead  || '#FF8A4C',
      press: currentSettings?.colorPress || '#B78BFF',
      arm:   currentSettings?.colorPress || '#B78BFF',
      other: '#9AA0AC',
    }[cls] || '#9AA0AC';
  }

  function ptOnCircle(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: +(cx + r * Math.cos(rad)).toFixed(2), y: +(cy + r * Math.sin(rad)).toFixed(2) };
  }

  function segmentPath(cx, cy, ro, ri, a1, a2) {
    const large = (a2 - a1) > 180 ? 1 : 0;
    const os = ptOnCircle(cx, cy, ro, a1), oe = ptOnCircle(cx, cy, ro, a2);
    const is = ptOnCircle(cx, cy, ri, a1), ie = ptOnCircle(cx, cy, ri, a2);
    return `M${os.x} ${os.y} A${ro} ${ro} 0 ${large} 1 ${oe.x} ${oe.y} L${ie.x} ${ie.y} A${ri} ${ri} 0 ${large} 0 ${is.x} ${is.y}Z`;
  }

  function fmtDateDisplay(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}, ${y}`;
  }

  function renderDonut(sessions) {
    const sel    = document.getElementById('breakdownDate');
    const svg    = document.getElementById('donutChart');
    const legend = document.getElementById('donutLegend');
    const empty  = document.getElementById('donutEmpty');
    const note   = document.getElementById('breakdownNote');
    if (!sel || !svg) return;

    const dates = [...new Set(sessions.filter(s => s.dateRaw).map(s => s.dateRaw))].sort().reverse();
    sel.innerHTML = dates.length
      ? dates.map(d => `<option value="${d}">${fmtDateDisplay(d)}</option>`).join('')
      : '<option value="">Log a session to see your breakdown</option>';

    function draw(dateStr) {
      const day = sessions.filter(s => s.dateRaw === dateStr);
      if (!day.length) {
        if (svg) svg.innerHTML = '';
        if (legend) legend.innerHTML = '';
        if (empty) empty.style.display = '';
        return;
      }
      if (empty) empty.style.display = 'none';

      /* Group sessions by lift name, summing sets */
      const groups = {};
      day.forEach(s => {
        const key = s.lift || 'Other';
        const cls = liftToCls(s.lift) || 'other';
        if (!groups[key]) groups[key] = { lift: key, cls, sets: 0 };
        groups[key].sets += (s.sets || 1);
      });
      const items = Object.values(groups);
      const total = items.reduce((sum, g) => sum + g.sets, 0);

      const cx = 150, cy = 150, ro = 118, ri = 68;
      let angle = 0, paths = '', legendHTML = '';

      let defs = `<defs><linearGradient id="dg-raised" x1="150" y1="32" x2="150" y2="268" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#fff" stop-opacity="0.18"/><stop offset="100%" stop-color="#000" stop-opacity="0.2"/></linearGradient>`;

      items.forEach((g, i) => {
        const pct   = g.sets / total;
        const sweep = pct * 360;
        const color = getDonutColor(g.cls);
        const gap   = items.length > 1 ? 2 : 0;
        const d     = segmentPath(cx, cy, ro, ri, angle + gap/2, angle + sweep - gap/2);
        defs += `<filter id="dgf${i}" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="${color}" flood-opacity="0.55"/></filter>`;
        paths += `<path fill="${color}" filter="url(#dgf${i})" d="${d}"/><path fill="url(#dg-raised)" d="${d}" pointer-events="none"/>`;
        legendHTML += `
          <div class="donut-legend-row">
            <span class="donut-dot" style="background:linear-gradient(180deg,rgba(255,255,255,.18) 0%,rgba(0,0,0,.2) 100%),${color};box-shadow:0 2px 8px ${color}80"></span>
            <span class="donut-lift">${g.lift}</span>
            <span class="donut-pct">${Math.round(pct * 100)}%</span>
          </div>`;
        angle += sweep;
      });

      defs += '</defs>';
      svg.innerHTML = defs + paths +
        `<text x="150" y="142" text-anchor="middle" class="donut-center-n">${total}</text>
         <text x="150" y="163" text-anchor="middle" class="donut-center-l">total sets</text>`;
      if (legend) legend.innerHTML = legendHTML;
      if (note) note.textContent = `${items.length} lift${items.length !== 1 ? 's' : ''} · ${total} sets`;
    }

    sel.addEventListener('change', () => draw(sel.value));
    if (dates.length) draw(dates[0]);
  }

  /* ---- 3) EXERCISE HISTORY CHART ----------------------------------- */
  function renderHistoryChart(sessions) {
    const sel     = document.getElementById('historyLift');
    const svg     = document.getElementById('historyChart');
    const details = document.getElementById('historyDetails');
    const empty   = document.getElementById('historyEmpty');
    const note    = document.getElementById('historyNote');
    if (!sel || !svg) return;

    const lifts = [...new Set(sessions.filter(s => s.lift).map(s => s.lift))].sort();
    sel.innerHTML = lifts.length
      ? lifts.map(l => `<option value="${l}"${l === historySelectedLift ? ' selected' : ''}>${l}</option>`).join('')
      : '<option value="">Log sessions to see history</option>';

    if (!historySelectedLift && lifts.length) historySelectedLift = lifts[0];
    if (historySelectedLift && lifts.includes(historySelectedLift)) sel.value = historySelectedLift;

    function draw(liftName) {
      if (!liftName) return;
      historySelectedLift = liftName;

      const liftSessions = sessions
        .filter(s => s.lift === liftName && s.dateRaw)
        .sort((a, b) => a.dateRaw.localeCompare(b.dateRaw))
        .slice(-5);

      if (!liftSessions.length) {
        svg.innerHTML = '';
        if (details) details.innerHTML = '';
        if (empty)   empty.style.display = '';
        if (note)    note.textContent = '';
        return;
      }
      if (empty) empty.style.display = 'none';
      if (note)  note.textContent = `Last ${liftSessions.length} session${liftSessions.length !== 1 ? 's' : ''}`;

      const W = 700, H = window.innerWidth < 640 ? 320 : 240;
      const padL = 52, padR = 24, padT = 24, padB = 52;
      const chartW = W - padL - padR, chartH = H - padT - padB;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

      const weights = liftSessions.map(s => s.wt);
      const minW = Math.min(...weights), maxW = Math.max(...weights);
      const pad  = (maxW - minW) * 0.20 || 15;
      const lo   = minW - pad, hi = maxW + pad, range = hi - lo;

      const n    = liftSessions.length;
      const xOf  = i => padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
      const yOf  = w => padT + chartH - ((w - lo) / range) * chartH;

      let grid = '';
      for (let i = 0; i <= 4; i++) {
        const y   = padT + (i / 4) * chartH;
        const val = Math.round(hi - (i / 4) * range);
        grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}"
                       stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
        grid += `<text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end"
                       class="axis-label">${val}</text>`;
      }

      const coords = liftSessions.map((s, i) => `${xOf(i).toFixed(1)},${yOf(s.wt).toFixed(1)}`);
      const area   = `M${xOf(0).toFixed(1)},${(padT + chartH).toFixed(1)} L${coords.join(' L')} L${xOf(n-1).toFixed(1)},${(padT+chartH).toFixed(1)}Z`;

      let dots = '', labels = '', vlines = '';
      liftSessions.forEach((s, i) => {
        const x = xOf(i).toFixed(1), y = yOf(s.wt).toFixed(1);
        const [, m, d] = s.dateRaw.split('-').map(Number);
        const lbl = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}`;
        vlines += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${(padT + chartH).toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
        dots   += `<circle cx="${x}" cy="${y}" r="5" fill="var(--accent)" stroke="var(--bg)" stroke-width="2.5"/>`;
        labels += `<text x="${x}" y="${H - 10}" text-anchor="middle" class="axis-label">${lbl}</text>`;
      });

      svg.innerHTML =
        `<defs><linearGradient id="hgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.26"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient></defs>` +
        `<rect x="${padL}" y="${padT}" width="${chartW}" height="${chartH}" rx="3" fill="rgba(255,255,255,0.04)"/>` +
        grid + vlines +
        `<path d="${area}" fill="url(#hgrad)"/>` +
        `<path d="M${coords.join(' L')}" fill="none" stroke="var(--accent)"
               stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` +
        dots + labels;

      if (details) {
        details.innerHTML = liftSessions.slice().reverse().map(s => `
          <div class="history-detail-row">
            <span class="history-date">${fmtDateDisplay(s.dateRaw)}</span>
            <span class="history-wt">${s.wt} lbs</span>
            <span class="history-reps">${s.sets} × ${s.reps}</span>
            <span class="history-note${s.note ? ' has-note' : ''}">${s.note ? '★ ' + s.note : '—'}</span>
          </div>`).join('');
      }
    }

    sel.onchange = () => draw(sel.value);
    if (lifts.length) draw(historySelectedLift || lifts[0]);
  }

  /* ---- 4) ONE-REP-MAX CALCULATOR ----------------------------------- */
  const ormEl   = document.getElementById('orm');
  const pctBody = document.getElementById('pctBody');
  // Restore last-used values
  ['lift','weight','reps'].forEach(id => {
    const saved = localStorage.getItem('il_calc_' + id);
    if (saved) document.getElementById(id).value = saved;
  });
  function calc() {
    const w = +document.getElementById('weight').value || 0;
    const r = +document.getElementById('reps').value   || 1;
    const orm = r <= 1 ? w : Math.round(w * (1 + r / 30));
    ormEl.textContent = orm.toLocaleString();
    pctBody.innerHTML = pctRows.map(row => `
      <tr>
        <td>${row.reps}</td>
        <td class="pct-tag">${row.pct}%</td>
        <td class="w">${Math.round(orm * row.pct / 100 / 5) * 5} lbs</td>
        <td style="color:var(--text-dim)">${row.use}</td>
      </tr>`).join('');
  }
  ['lift','weight','reps'].forEach(id => document.getElementById(id).addEventListener('input', e => {
    localStorage.setItem('il_calc_' + id, e.target.value);
    calc();
  }));
  calc();

  /* ---- 4) TRAINING LOG --------------------------------------------- */

  /* Maps a lift name to a pill colour class. Unknown lifts → 'other' (neutral). */
  function liftToCls(name) {
    const n = (name || '').toLowerCase().trim();
    const custom = (currentSettings?.customLifts || []).find(l =>
      (typeof l === 'string' ? l : l.name).toLowerCase() === n
    );
    if (custom && typeof custom !== 'string' && custom.cls) return custom.cls;
    if (['squat','split squat','bulgarian split squats','hack squat','pendulum squat','bw squat','smith squat','leg press','lunges','hip thrust','rdl'].includes(n)) return 'squat';
    if (['bench','bench press','incline press','decline chest press','db flat press','db incline press','machine chest press','dips','push-up','chest fly','low chest fly','mid chest fly','high chest fly','pec dec'].includes(n)) return 'bench';
    if (['deadlift','rack pull'].includes(n))                                                        return 'dead';
    if (['row','barbell row','cable row','chest supported row','machine row','pulldown','lat pulldown','machine lat pulldown','cable lat pulldown','pull-up','t-bar row','lat pullover','shrugs'].includes(n)) return 'dead';
    if (['overhead press','ohp','arnold press','lateral raise','db lateral raise','cable lateral raise','machine lateral raise',
         'rear delt raise','front raise','face pull',
         'tricep pushdown','single arm tricep pushdown','db tricep extension','cable tricep extension','machine tricep extension',
         'overhead tricep','skull crusher','close grip bench',
         'bicep curl','db bicep curl','cable bicep curl','machine bicep curl','hammer curl','preacher curl','concentration curl'].includes(n)) return 'arm';
    if (['leg extension','leg curl','seated hamstring curl','lying hamstring curl','calf raise','adductors','abductors'].includes(n)) return 'squat';
    return 'other';
  }

  function formatDate(dateStr) {
    const [, m, d] = dateStr.split('-').map(Number);
    return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}`;
  }

  /* Shared state so both listeners can trigger a KPI refresh */
  let currentSessions = [];
  let currentSettings = null;
  let historySelectedLift = '';
  let currentPage = 1;
  const PAGE_SIZE = 12;

  /* ---- Guest mode: render empty card shells for signed-out visitors ----
     All render functions below are function declarations so they're
     hoisted and safe to call here before their definition sites.    */
  if (!uid) {
    currentSettings = {};
    applyUnit('lbs');
    updateKPIs();
    renderCalendar();
    renderFreq();
    renderNeglect();
    renderTracker();
    renderLog([]);
    return;
  }

  /* Apply unit label (lbs/kg) to key elements across the dashboard */
  function applyUnit(unit) {
    document.querySelectorAll('.unit-label').forEach(el => { el.textContent = unit; });
  }

  /* Apply default lift to the log form */
  function applyDefaultLift(lift) {
    const el = document.getElementById('logLift');
    if (el && lift) el.value = lift;
  }

  function updateKPIs() {
    const now        = new Date();
    const thisMonth  = now.getMonth();
    const thisYear   = now.getFullYear();

    /* Sessions that have a dateRaw, fall in the current calendar month, and aren't rest days */
    const monthSess  = currentSessions.filter(s => {
      if (!s.dateRaw || s.isRestDay) return false;
      const [y, m] = s.dateRaw.split('-').map(Number);
      return y === thisYear && m - 1 === thisMonth;
    });

    /* Volume = sets × reps × weight for each month session */
    const volume     = monthSess.reduce((sum, s) => sum + (s.sets * s.reps * s.wt), 0);
    const daysLifted = new Set(monthSess.map(s => s.dateRaw).filter(Boolean)).size;

    /* Streak = consecutive days with a session OR a logged rest day */
    const sessionDays = new Set(currentSessions.map(s => s.dateRaw).filter(Boolean));
    const restDays    = new Set(Array.isArray(currentSettings?.restDays) ? currentSettings.restDays : []);
    const activeDays  = new Set([...sessionDays, ...restDays]);
    let streak = 0;
    const cursor = new Date(); cursor.setHours(12, 0, 0, 0);
    for (let i = 0; i < 366; i++) {
      const iso = localDateISO(cursor);
      if (activeDays.has(iso)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        cursor.setDate(cursor.getDate() - 1); // nothing logged today yet — check yesterday
      } else {
        break;
      }
    }

    /* Rest day button state */
    const todayISO   = localDateISO();
    const isRestDay  = restDays.has(todayISO);
    const restBtn    = document.getElementById('restDayBtn');
    if (restBtn) {
      restBtn.textContent = isRestDay ? '✓ Rest Day Logged' : 'Log Rest Day';
      restBtn.classList.toggle('rest-day-active', isRestDay);
    }

    /* Big-3 = saved maxes from settings */
    const s = currentSettings;
    const big3 = s ? (s.squatMax || 0) + (s.benchMax || 0) + (s.deadMax || 0) : 0;

    /* Update the four cards */
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('kpi-sessions', daysLifted);
    set('kpi-streak',   streak);
    set('kpi-big3',     big3 ? big3.toLocaleString() : '—');

    set('kpi-sessions-delta', daysLifted ? 'days in the gym this month' : 'Add your first session below');
    set('kpi-streak-delta',   streak ? `day${streak !== 1 ? 's' : ''} in a row` : 'Log a session to start a streak');
    set('kpi-big3-delta',     s && big3 ? `${s.squatMax} + ${s.benchMax} + ${s.deadMax} lbs` : 'Set your maxes in Standards below');

    renderFreq();
    renderNeglect();
  }

  function renderNeglect() {
    const container = document.getElementById('neglectList');
    if (!container) return;

    const today = new Date(); today.setHours(12, 0, 0, 0);

    // Last logged date per lift (skip rest days)
    const lastSeen = {};
    (currentSessions || []).forEach(s => {
      if (!s.dateRaw || s.isRestDay) return;
      if (!lastSeen[s.lift] || s.dateRaw > lastSeen[s.lift]) lastSeen[s.lift] = s.dateRaw;
    });

    // Only consider lifts touched in the last 60 days
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 60);
    const cutoffISO = localDateISO(cutoff);

    // For each group, pick the single most neglected lift
    const groups = ['squat', 'bench', 'dead', 'arm'];
    const groupLabels = { squat: 'Legs', bench: 'Chest', dead: 'Back', arm: 'Arms' };
    const picks = [];

    groups.forEach(cls => {
      const best = Object.entries(lastSeen)
        .filter(([lift, date]) => liftToCls(lift) === cls && date >= cutoffISO)
        .map(([lift, date]) => ({
          lift, cls,
          days: Math.round((today - new Date(date + 'T12:00:00')) / 86400000)
        }))
        .filter(x => x.days >= 1)
        .sort((a, b) => b.days - a.days)[0];
      if (best) picks.push(best);
    });

    if (!picks.length) {
      container.innerHTML = `<div class="neglect-good">Nothing falling behind — you're staying balanced!</div>`;
      return;
    }

    const rows = picks.map(x => `
      <div class="neglect-row">
        <span class="pill ${x.cls}">${x.lift}</span>
        <span class="neglect-days">${x.days}d ago</span>
      </div>
    `).join('');

    const legend = picks.map(x => `
      <div class="cal-legend-item">
        <div class="cal-legend-dot ${x.cls}"></div>${groupLabels[x.cls]}
      </div>
    `).join('');

    container.innerHTML = rows + `<div class="neglect-legend">${legend}</div>`;
  }

  function renderFreq() {
    const container = document.getElementById('freqBars');
    if (!container) return;

    const now       = new Date();
    const thisYear  = now.getFullYear();
    const thisMonth = now.getMonth();
    const monthPad  = String(thisMonth + 1).padStart(2, '0');

    // Build session-derived day→cls map (same logic as renderCalendar)
    const sessionMap = {};
    (currentSessions || []).forEach(s => {
      if (!s.dateRaw || s.isRestDay) return;
      const [y, m, dayNum] = s.dateRaw.split('-').map(Number);
      if (y !== thisYear || m - 1 !== thisMonth) return;
      if (!sessionMap[dayNum]) sessionMap[dayNum] = liftToCls(s.lift) || 'other';
    });

    // Merge with manual calendar overrides — same priority as renderCalendar
    const calColors   = currentSettings?.calendarColors || {};
    const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
    const counts      = { squat: 0, bench: 0, dead: 0, arm: 0 };

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${thisYear}-${monthPad}-${String(d).padStart(2, '0')}`;
      const cls     = calColors[dateStr] || sessionMap[d];
      if (cls && cls !== 'rest' && cls !== 'other' && cls in counts) counts[cls]++;
    }

    const maxCount = Math.max(1, ...Object.values(counts));
    const labels   = { squat: 'Legs', bench: 'Chest', dead: 'Back', arm: 'Arms' };

    container.innerHTML = Object.entries(counts).map(([cls, count]) => `
      <div class="freq-row">
        <div class="freq-label">${labels[cls]}</div>
        <div class="freq-track"><div class="freq-fill ${cls}" style="width:${Math.round(count / maxCount * 100)}%"></div></div>
        <div class="freq-count ${cls}">${count || '—'}</div>
      </div>
    `).join('');
  }

  function renderLog(sessions) {
    currentSessions = sessions;
    const totalPages = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = sessions.slice(start, start + PAGE_SIZE);

    document.getElementById('logBody').innerHTML = sessions.length
      ? page.map(s => s.isRestDay ? `
          <tr data-id="${s.id}" class="rest-day-row">
            <td style="color:var(--text-dim);white-space:nowrap">${s.date}</td>
            <td><span class="pill rest">Rest Day</span></td>
            <td style="color:var(--text-dimmer)">—</td>
            <td style="color:var(--text-dimmer)">—</td>
            <td style="color:var(--text-dimmer)">—</td>
            <td class="row-actions">
              <button class="btn-delete" data-id="${s.id}" title="Remove">✕</button>
            </td>
          </tr>` : `
          <tr data-id="${s.id}">
            <td style="color:var(--text-dim);white-space:nowrap">${s.date}</td>
            <td><span class="pill ${liftToCls(s.lift)}">${s.lift}</span></td>
            <td>${s.sets} × ${s.reps}</td>
            <td>${s.wt} lbs</td>
            <td>${s.note
              ? '<span class="pr-flag">★ ' + s.note + '</span>'
              : '<span style="color:var(--text-dimmer)">—</span>'}</td>
            <td class="row-actions">
              <button class="btn-row-edit" data-id="${s.id}" title="Edit this session">✎</button>
              <button class="btn-delete"   data-id="${s.id}" title="Remove this session">✕</button>
            </td>
          </tr>`).join('')
      : `<tr><td colspan="7" style="color:var(--text-dimmer);text-align:center;padding:32px 0;">
           No sessions yet — add one above.
         </td></tr>`;

    const pag = document.getElementById('log-pagination');
    if (sessions.length > PAGE_SIZE) {
      pag.style.display = '';
      document.getElementById('log-page-info').textContent = `Page ${currentPage} of ${totalPages}`;
      document.getElementById('log-prev').disabled = currentPage <= 1;
      document.getElementById('log-next').disabled = currentPage >= totalPages;
    } else {
      pag.style.display = 'none';
    }
  }

  /* Builds an inline-editable version of a row */
  function buildEditRow(s) {
    const dateVal = s.dateRaw || localDateISO();
    return `
      <tr data-id="${s.id}" class="editing-row">
        <td><input id="ed-date" type="hidden" value="${dateVal}"></td>
        <td><input class="edit-field edit-wide" id="ed-lift" list="lift-options"
                   value="${s.lift}" autocomplete="off"></td>
        <td class="sets-reps-cell">
          <input class="edit-field edit-num" id="ed-sets" type="number" value="${s.sets}" min="1">
          <span style="color:var(--text-dimmer)">×</span>
          <input class="edit-field edit-num" id="ed-reps" type="number" value="${s.reps}" min="1">
        </td>
        <td><input class="edit-field edit-num" id="ed-wt" type="number" value="${s.wt}" step="5" min="1"></td>
        <td><input class="edit-field edit-wide" id="ed-note" type="text" value="${s.note}" placeholder="PR…"></td>
        <td class="row-actions">
          <button class="btn-save-edit" data-id="${s.id}" title="Save changes">Save</button>
          <button class="btn-cancel-edit btn-delete" data-id="${s.id}" title="Cancel">✕</button>
        </td>
      </tr>`;
  }

  /* Custom white calendar picker — no external libraries needed */
  createDatePicker('logDate');

  /* Live listener — rebuilds table instantly on any Firestore change */
  unsubscribeSessions = sessionsRef()
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      currentSessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const liftSessions = currentSessions.filter(s => !s.isRestDay);
      renderLog(currentSessions);
      renderDonut(liftSessions);
      renderHistoryChart(liftSessions);
      updateKPIs();
      renderCalendar();
    }, err => {
      console.error('Sessions error:', err.code, err.message);
      renderLog([]);
      updateKPIs();
      renderCalendar();
    });

  /* Bodyweight listener */
  if (uid) {
    unsubscribeBodyweight = db.collection('users').doc(uid).collection('bodyweight')
      .orderBy('date', 'asc')
      .onSnapshot(snap => {
        bwAllEntries = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBodyweight();
      }, err => console.error('BW error:', err));
  }

  /* Add session — also saves dateRaw so the edit form can pre-fill it */
  document.getElementById('addSession').addEventListener('click', () => {
    const dateVal = document.getElementById('logDate').value;
    const liftVal = document.getElementById('logLift').value;
    const sets    = +document.getElementById('logSets').value;
    const reps    = +document.getElementById('logReps').value;
    const wt      = +document.getElementById('logWeight').value;
    const note    = document.getElementById('logNote').value.trim();
    if (!dateVal || !sets || !reps || !wt) {
      alert('Please fill in date, sets, reps, and weight.'); return;
    }
    const lift = liftVal.trim();
    const cls  = liftToCls(lift);
    currentPage = 1;
    /* PR check: does this beat the best weight ever logged for this exact lift? */
    const prevBest = (currentSessions || [])
      .filter(s => (s.lift || '').toLowerCase() === lift.toLowerCase())
      .reduce((m, s) => Math.max(m, +s.wt || 0), 0);
    const isPR = prevBest > 0 && wt > prevBest;
    sessionsRef().add({ date: formatDate(dateVal), dateRaw: dateVal,
                        lift, cls, sets, reps, wt, note,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => {
        ['logSets','logReps','logWeight','logNote'].forEach(id => document.getElementById(id).value = '');
        if (isPR) showPrStamp(lift, wt);
      })
      .catch(err => showToast('Could not save session — ' + (err?.message || 'check your connection.')));
  });

  /* Unified click handler for edit / save / cancel / delete */
  document.getElementById('logBody').addEventListener('click', e => {

    /* ── Edit button: swap row to inline edit mode ── */
    const editBtn = e.target.closest('.btn-row-edit');
    if (editBtn) {
      const s = currentSessions.find(x => x.id === editBtn.dataset.id);
      const row = document.querySelector(`tr[data-id="${editBtn.dataset.id}"]`);
      if (s && row) {
        row.outerHTML = buildEditRow(s);
        setTimeout(() => createDatePicker('ed-date', s.dateRaw), 30);
      }
      return;
    }

    /* ── Save button: write edited values back to Firestore ── */
    const saveBtn = e.target.closest('.btn-save-edit');
    if (saveBtn) {
      const id      = saveBtn.dataset.id;
      const dateVal = document.getElementById('ed-date').value;
      const liftVal = document.getElementById('ed-lift').value;
      const sets    = +document.getElementById('ed-sets').value;
      const reps    = +document.getElementById('ed-reps').value;
      const wt      = +document.getElementById('ed-wt').value;
      const note    = document.getElementById('ed-note').value.trim();
      if (!dateVal || !sets || !reps || !wt) { showToast('Please fill in all fields.'); return; }
      const lift = liftVal.trim();
      const cls  = liftToCls(lift);
      sessionsRef().doc(id)
        .update({ date: formatDate(dateVal), dateRaw: dateVal, lift, cls, sets, reps, wt, note })
        .catch(err => showToast('Could not update session — ' + (err?.message || 'check your connection.')));
      return;
    }

    /* ── Cancel button: restore original row without saving ── */
    const cancelBtn = e.target.closest('.btn-cancel-edit');
    if (cancelBtn) { renderLog(currentSessions); return; }

    /* ── Delete button ── */
    const deleteBtn = e.target.closest('.btn-delete');
    if (deleteBtn) {
      if (confirm('Remove this session?')) {
        sessionsRef().doc(deleteBtn.dataset.id).delete()
          .catch(err => showToast('Could not delete session — ' + (err?.message || 'check your connection.')));
      }
    }
  });

  document.getElementById('log-prev').addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderLog(currentSessions); }
  });
  document.getElementById('log-next').addEventListener('click', () => {
    const totalPages = Math.ceil(currentSessions.length / PAGE_SIZE);
    if (currentPage < totalPages) { currentPage++; renderLog(currentSessions); }
  });

  document.getElementById('goals-prev').addEventListener('click', () => {
    if (goalsDonePage > 1) { goalsDonePage--; renderGoals(currentSettings && currentSettings.goals); }
  });
  document.getElementById('goals-next').addEventListener('click', () => {
    goalsDonePage++; renderGoals(currentSettings && currentSettings.goals);
  });

  /* ---- 5) ATHLETE PROFILE (WHERE YOU STAND) ------------------------ */

  function parseHeightToInches(str) {
    if (!str) return null;
    const s = str.toString().trim();
    const m = s.match(/^(\d+)\D+(\d+)/);
    if (m) return +m[1] * 12 + +m[2];
    const n = parseFloat(s);
    return (!isNaN(n) && n > 24) ? n : null;
  }

  function formatHeight(inches) {
    if (!inches) return '';
    return `${Math.floor(inches / 12)}'${inches % 12}"`;
  }

  function getIpfClass(weightLbs) {
    const kg = weightLbs / 2.2046;
    for (const c of [59, 66, 74, 83, 93, 105, 120]) { if (kg <= c) return c; }
    return '120+';
  }

  function getDnaType(sR, bR, dR) {
    const mx = Math.max(sR, bR, dR), mn = Math.min(sR, bR, dR);
    if (mx - mn < 0.25) return 'Well Balanced';
    if (dR === mx) return 'Posterior Chain Dominant';
    if (sR === mx) return 'Lower Body Dominant';
    return 'Upper Body Dominant';
  }

  /* ===== GLADIATOR RANK SYSTEM =====================================
     Maps a lift vs the bodyweight strength standards to a rank. */
  const RANK_NAMES = ['Recruit','Legionary','Centurion','Champion','Gladiator'];
  function rankWeightClass(bw) {
    const keys = Object.keys(bodyweightStandards).map(Number).sort((a,b) => a-b);
    for (const k of keys) if (bw <= k) return k;
    return keys[keys.length-1];
  }
  function liftTier(liftKey, max, bw) {
    const wc = rankWeightClass(bw);
    const th = bodyweightStandards[wc][liftKey];        // [Beginner..Elite]
    let passed = 0; for (const t of th) if (max >= t) passed++;
    return { passed, th };
  }
  function rankHex(rankIdx) {
    const cols = [['#8a6f4a','#c8923f'],['#c8923f','#f4d9a8'],['#9a9ea8','#e8eaef'],['#e8eaef','#ffffff'],['#C1272D','#F0565B']];
    const num  = ['I','II','III','IV','V'][rankIdx];
    return '<svg class="rank-hex" viewBox="0 0 60 70">' +
      '<polygon points="30,3 56,18 56,52 30,67 4,52 4,18" fill="#15171c" stroke="' + cols[rankIdx][0] + '" stroke-width="2.5"/>' +
      '<text x="30" y="47" text-anchor="middle" font-family="Anton,sans-serif" font-size="28" fill="' + cols[rankIdx][1] + '">' + num + '</text></svg>';
  }
  function renderRank(sq, bn, dl, bw) {
    const card = document.getElementById('rankCard');
    if (!card) return;
    if (!sq && !bn && !dl) { card.style.display = 'none'; return; }
    const lifts = [['squat','Squat',sq],['bench','Bench',bn],['dead','Deadlift',dl]];
    let sumIdx = 0, n = 0, rows = '';
    for (const [key,label,mx] of lifts) {
      if (!mx) continue;
      const { passed, th } = liftTier(key, mx, bw);
      const idx = Math.max(0, Math.min(4, passed - 1));
      sumIdx += idx; n++;
      let pct, nextTxt;
      if (passed >= 5) { pct = 100; nextTxt = 'Max rank reached — Elite'; }
      else {
        const base = passed > 0 ? th[passed-1] : 0;
        const next = th[passed];
        pct = Math.max(4, Math.min(100, Math.round((mx - base) / (next - base) * 100)));
        nextTxt = '<b>+' + (next - mx) + ' lbs</b> &rarr; ' + RANK_NAMES[Math.min(4, passed)];
      }
      rows += '<div class="rank-lift">' + rankHex(idx) + '<div class="rank-lift-body">' +
        '<div class="rank-lift-name">' + label + '</div>' +
        '<div class="rank-lift-rank">' + RANK_NAMES[idx] + '</div>' +
        '<div class="rank-prog"><span data-w="' + pct + '"></span></div>' +
        '<div class="rank-next">' + nextTxt + '</div></div></div>';
    }
    const overall = n ? Math.round(sumIdx / n) : 0;
    card.style.display = '';
    card.innerHTML =
      '<div class="rank-head"><div class="rank-overall">' + rankHex(overall) +
        '<div class="rank-overall-meta"><div class="rank-eyebrow">Your Gladiator Rank</div>' +
        '<div class="rank-name">' + RANK_NAMES[overall] + '</div>' +
        '<div class="rank-flair">Big-3 ranked against lifters in the ' + rankWeightClass(bw) + ' lb class</div>' +
        '</div></div></div>' +
      '<div class="rank-grid">' + rows + '</div>';
    setTimeout(() => card.querySelectorAll('.rank-prog > span').forEach(s => s.style.width = s.dataset.w + '%'), 80);
  }

  function renderProfile(squatMax, benchMax, deadMax, bodyweight, height) {
    const sq = +squatMax || 0, bn = +benchMax || 0, dl = +deadMax || 0;
    const bw = +bodyweight || 185;
    const hIn = parseHeightToInches(height);

    const setVal = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    if (sq) setVal('squatInput', sq);
    if (bn) setVal('benchInput', bn);
    if (dl) setVal('deadInput',  dl);
    setVal('weightInput', bw);
    if (hIn) setVal('heightInput', formatHeight(hIn));

    const statGrid = document.getElementById('statGrid');
    const dnaCard  = document.getElementById('dnaCard');
    if (!statGrid || !dnaCard) return;

    if (!sq && !bn && !dl) {
      statGrid.innerHTML = ''; dnaCard.style.display = 'none';
      const rc = document.getElementById('rankCard'); if (rc) rc.style.display = 'none';
      return;
    }

    const sR = bw ? sq / bw : 0, bR = bw ? bn / bw : 0, dR = bw ? dl / bw : 0;
    const big3 = sq + bn + dl;
    const totalR = bw ? (big3 / bw).toFixed(1) : '—';
    const bmi    = hIn ? ((bw / (hIn * hIn)) * 703).toFixed(1) : null;
    const bmiDesc = !bmi ? '' : +bmi < 18.5 ? 'Underweight' : +bmi < 25 ? 'Normal range' : +bmi < 30 ? 'Overweight' : 'Obese';
    const ipfCls  = getIpfClass(bw);
    const totalDesc = +totalR < 4 ? 'Beginner range' : +totalR < 5 ? 'Intermediate range' : +totalR < 6 ? 'Advanced range' : 'Elite range';

    statGrid.innerHTML =
      (hIn ? `<div class="stat-tile forged"><div class="st-label">Height</div>
        <div class="st-value">${Math.floor(hIn/12)}'${hIn%12}<span>in</span></div>
        <div class="st-sub">${Math.round(hIn*2.54)} cm</div></div>` : '') +
      `<div class="stat-tile forged"><div class="st-label">Bodyweight</div>
        <div class="st-value">${bw}<span>lbs</span></div>
        <div class="st-sub">${(bw/2.2046).toFixed(1)} kg</div></div>` +
      (bmi ? `<div class="stat-tile forged"><div class="st-label">BMI</div>
        <div class="st-value">${bmi}</div>
        <div class="st-sub">${bmiDesc}</div></div>` : '') +
      `<div class="stat-tile forged highlight"><div class="st-label">Big-3 Total</div>
        <div class="st-value">${big3.toLocaleString()}<span>lbs</span></div>
        <div class="st-sub">${(big3/2.2046).toFixed(0)} kg</div></div>
      <div class="stat-tile forged"><div class="st-label">Total / Bodyweight</div>
        <div class="st-value">${totalR}<span>×</span></div>
        <div class="st-sub">${totalDesc}</div></div>
      <div class="stat-tile forged"><div class="st-label">IPF Weight Class</div>
        <div class="st-value" style="font-size:24px;">${ipfCls}<span>kg</span></div>
        <div class="st-sub">You'd compete at ${ipfCls} kg</div></div>`;

    renderRank(sq, bn, dl, bw);

    const ranked = [{n:'squat',v:sq,r:sR},{n:'bench',v:bn,r:bR},{n:'deadlift',v:dl,r:dR}]
      .sort((a,b) => b.r - a.r);
    const best = ranked[0], worst = ranked[2];
    const dnaType = getDnaType(sR, bR, dR);
    const dnaDesc = `Your ${best.n} is your standout lift at <strong style="color:var(--text);">${best.v} lbs (${best.r.toFixed(1)}× bodyweight)</strong>.
      Your ${worst.n} has the most room to grow at <strong style="color:var(--text);">${worst.v} lbs (${worst.r.toFixed(1)}×)</strong>.
      ${ranked[0].r - ranked[2].r < 0.3 ? 'Overall your three lifts are well balanced.' : `Focus on bringing your ${worst.n} up to match your ${best.n}.`}`;

    dnaCard.style.display = '';
    dnaCard.innerHTML = `
      <div class="dna-header">
        <div>
          <p class="controls-label" style="margin-bottom:8px;">Strength DNA</p>
          <div class="dna-type-badge">${dnaType}</div>
        </div>
      </div>
      <p class="dna-desc">${dnaDesc}</p>
      <div class="profile-divider"></div>
      <div class="dna-bars">
        <div class="dna-bar-row">
          <div class="dna-bar-label">Legs</div>
          <div class="dna-bar-track"><div class="dna-bar-fill squat" style="width:0" data-w="${(sR/3*100).toFixed(1)}">${sq} lbs</div></div>
          <div class="dna-bar-ratio squat">${sR.toFixed(1)}×</div>
        </div>
        <div class="dna-bar-row">
          <div class="dna-bar-label">Chest</div>
          <div class="dna-bar-track"><div class="dna-bar-fill bench" style="width:0" data-w="${(bR/3*100).toFixed(1)}">${bn} lbs</div></div>
          <div class="dna-bar-ratio bench">${bR.toFixed(1)}×</div>
        </div>
        <div class="dna-bar-row">
          <div class="dna-bar-label">Deadlift</div>
          <div class="dna-bar-track"><div class="dna-bar-fill dead" style="width:0" data-w="${(dR/3*100).toFixed(1)}">${dl} lbs</div></div>
          <div class="dna-bar-ratio dead">${dR.toFixed(1)}×</div>
        </div>
      </div>
      <div class="dna-ticks">
        <span class="dna-tick">0×</span><span class="dna-tick">1×</span>
        <span class="dna-tick">1.5×</span><span class="dna-tick">2×</span>
        <span class="dna-tick">2.5×</span><span class="dna-tick">3×</span>
      </div>`;

    setTimeout(() => {
      dnaCard.querySelectorAll('.dna-bar-fill').forEach(f => { f.style.width = f.dataset.w + '%'; });
    }, 60);
  }

  function renderGoals(goalsData) {
    if (document.activeElement && document.activeElement.classList.contains('goal-input')) return;
    const list  = document.getElementById('goalsList');
    const tally = document.getElementById('goalsTally');
    const pag   = document.getElementById('goals-done-pagination');
    if (!list) return;

    function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

    const allGoals = (Array.isArray(goalsData) ? goalsData : []).filter(g => g && g.text);
    const today = new Date(); today.setHours(0,0,0,0);
    const isMissedGoal = g => !g.done && !!g.finishBy && new Date(g.finishBy + 'T00:00:00') < today;
    const active   = allGoals.map((g, i) => ({ ...g, _i: i })).filter(g => !g.done && !isMissedGoal(g));
    const done     = allGoals.map((g, i) => ({ ...g, _i: i })).filter(g => g.done || isMissedGoal(g))
                             .sort((a, b) => {
                               const aD = a.done ? (a.completedAt||0) : new Date(a.finishBy+'T00:00:00').getTime();
                               const bD = b.done ? (b.completedAt||0) : new Date(b.finishBy+'T00:00:00').getTime();
                               return bD - aD;
                             });

    if (tally) {
      const total = allGoals.length;
      const completedCount = allGoals.filter(g => g.done).length;
      const missedCount = allGoals.filter(g => isMissedGoal(g)).length;
      tally.textContent = total ? `${completedCount + missedCount} / ${total} done` : '';
    }

    function goalRow(g, isDone, isMissed) {
      const steps        = g.steps || 1;
      const stepsChecked = isDone ? steps : (g.stepsChecked || 0);
      const boxes = Array.from({length: steps}, (_, i) => {
        const cls = i < stepsChecked ? ' checked' : (isMissed ? ' missed' : '');
        const attrs = (!isDone && !isMissed) ? ` data-idx="${g._i}" data-step="${i}"` : '';
        return `<span class="goal-step-box${cls}"${attrs}></span>`;
      }).join('');
      const resetBtn = !isDone && !isMissed && steps > 1 && stepsChecked > 0
        ? `<button class="goal-reset-btn" data-idx="${g._i}" title="Reset progress">↺</button>`
        : '';
      const adjuster = !isDone && !isMissed ? `
        <div class="goal-steps-adj">
          <button class="goal-step-btn goal-step-minus" data-idx="${g._i}">−</button>
          <span class="goal-step-count">${steps}</span>
          <button class="goal-step-btn goal-step-plus" data-idx="${g._i}">+</button>
        </div>` : '';
      const fmtTs = ts => new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric'});
      const fmtDs = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); };
      let dateMeta = '';
      if (!isDone) {
        const created = g.createdAt ? `<span class="goal-date-text">Added ${fmtTs(g.createdAt)}</span>` : '';
        dateMeta = `<div class="goal-dates">${created}<label class="goal-date-label">Due <input type="date" class="goal-finish-input" data-idx="${g._i}" value="${g.finishBy||''}"></label></div>`;
      } else if (isMissed) {
        dateMeta = `<div class="goal-dates"><span class="goal-date-text goal-date-missed">Missed · ${fmtDs(g.finishBy)}</span></div>`;
      } else {
        const parts = [g.createdAt ? `Added ${fmtTs(g.createdAt)}` : '', g.completedAt ? `Done ${fmtTs(g.completedAt)}` : ''].filter(Boolean);
        if (parts.length) dateMeta = `<div class="goal-dates">${parts.map(p=>`<span class="goal-date-text">${p}</span>`).join('')}</div>`;
      }
      return `
        <div class="goal-row${isDone ? ' goal-row-done' : ''}${isMissed ? ' goal-row-missed' : ''}">
          <div class="goal-steps">${boxes}${resetBtn}</div>
          <div class="goal-main">
            <input type="text" class="goal-input${isDone ? ' goal-done' : ''}"
                   data-idx="${g._i}" value="${esc(g.text)}"
                   placeholder="" maxlength="60" autocomplete="off">
            ${dateMeta}
          </div>
          ${adjuster}
          <button class="btn-delete goal-delete" data-idx="${g._i}" title="Delete goal">✕</button>
        </div>`;
    }

    const newRow = `
      <div class="goal-row goal-row-new">
        <div class="goal-steps"><span class="goal-step-box" style="opacity:0.3"></span></div>
        <div class="goal-main">
          <input type="text" class="goal-input goal-input-new"
                 data-idx="-1" value="" placeholder="Add a goal…" maxlength="60" autocomplete="off">
        </div>
      </div>`;

    const filteredDone = goalsDoneFilter === 'completed'
      ? done.filter(g => g.done)
      : goalsDoneFilter === 'missed'
        ? done.filter(g => isMissedGoal(g))
        : done;

    const totalPages = Math.max(1, Math.ceil(filteredDone.length / GOALS_DONE_PAGE));
    if (goalsDonePage > totalPages) goalsDonePage = totalPages;
    const pagSlice = filteredDone.slice((goalsDonePage - 1) * GOALS_DONE_PAGE, goalsDonePage * GOALS_DONE_PAGE);

    const filterCtrl = done.length ? `<div class="goals-filter-row">
      <select class="goals-filter-sel">
        <option value="all"${goalsDoneFilter==='all'?' selected':''}>All</option>
        <option value="completed"${goalsDoneFilter==='completed'?' selected':''}>Completed</option>
        <option value="missed"${goalsDoneFilter==='missed'?' selected':''}>Missed</option>
      </select>
    </div>` : '';

    list.innerHTML =
      active.map(g => goalRow(g, false, false)).join('') +
      newRow +
      (done.length ? '<div class="goals-divider"></div>' + filterCtrl : '') +
      pagSlice.map(g => goalRow(g, true, isMissedGoal(g))).join('');

    if (pag) {
      if (filteredDone.length > GOALS_DONE_PAGE) {
        pag.style.display = '';
        document.getElementById('goals-page-info').textContent = `Page ${goalsDonePage} of ${totalPages}`;
        document.getElementById('goals-prev').disabled = goalsDonePage <= 1;
        document.getElementById('goals-next').disabled = goalsDonePage >= totalPages;
      } else {
        pag.style.display = 'none';
      }
    }

    function saveGoals(updated) {
      settingsRef().set({ goals: updated }, { merge: true })
        .catch(err => showToast('Could not save goals — ' + (err?.message || 'check your connection.')));
    }

    list.querySelectorAll('.goal-step-box').forEach(box => {
      box.addEventListener('click', () => {
        const idx  = +box.dataset.idx;
        const step = +box.dataset.step;
        if (isNaN(idx) || idx < 0) return;
        const g     = allGoals[idx];
        const steps = g.steps || 1;
        const cur   = g.stepsChecked || 0;
        const checking   = !box.classList.contains('checked');
        const newChecked = checking ? step + 1 : step;
        const isDone     = newChecked >= steps;
        if (checking) spawnConfetti(box);
        const updated    = allGoals.map((g, i) => i !== idx ? g : {
          ...g,
          stepsChecked: newChecked,
          done:         isDone,
          completedAt:  isDone ? Date.now() : null,
        });
        saveGoals(updated);
      });
    });

    list.querySelectorAll('.goal-reset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx     = +btn.dataset.idx;
        const updated = allGoals.map((g, i) => i !== idx ? g : { ...g, stepsChecked: 0 });
        saveGoals(updated);
      });
    });

    list.querySelectorAll('.goal-step-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx   = +btn.dataset.idx;
        const g     = allGoals[idx];
        const steps = Math.max(1, (g.steps || 1) - 1);
        const updated = allGoals.map((g, i) => i !== idx ? g : {
          ...g, steps, stepsChecked: Math.min(g.stepsChecked || 0, steps),
        });
        saveGoals(updated);
      });
    });

    list.querySelectorAll('.goal-step-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx   = +btn.dataset.idx;
        const g     = allGoals[idx];
        const steps = Math.min(10, (g.steps || 1) + 1);
        const updated = allGoals.map((g, i) => i !== idx ? g : { ...g, steps });
        saveGoals(updated);
      });
    });

    list.querySelectorAll('.goal-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.idx;
        saveGoals(allGoals.filter((_, i) => i !== idx));
      });
    });

    list.querySelectorAll('.goal-input:not(.goal-input-new)').forEach(inp => {
      inp.addEventListener('blur', () => {
        const idx  = +inp.dataset.idx;
        const text = inp.value.trim();
        const updated = text
          ? allGoals.map((g, i) => i === idx ? { ...g, text } : g)
          : allGoals.filter((_, i) => i !== idx);
        saveGoals(updated);
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
    });

    list.querySelectorAll('.goal-finish-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const idx = +inp.dataset.idx;
        if (isNaN(idx) || idx < 0) return;
        const updated = allGoals.map((g, i) => i !== idx ? g : { ...g, finishBy: inp.value || null });
        saveGoals(updated);
      });
      inp.addEventListener('click', e => e.stopPropagation());
    });

    const filterSel = list.querySelector('.goals-filter-sel');
    if (filterSel) {
      filterSel.addEventListener('change', () => {
        goalsDoneFilter = filterSel.value;
        goalsDonePage = 1;
        renderGoals(currentSettings && currentSettings.goals);
      });
    }

    const newInp = list.querySelector('.goal-input-new');
    if (newInp) {
      newInp.addEventListener('blur', () => {
        const text = newInp.value.trim();
        if (text) saveGoals([...allGoals, { text, done: false, steps: 1, stepsChecked: 0, completedAt: null, createdAt: Date.now(), finishBy: null }]);
      });
      newInp.addEventListener('keydown', e => { if (e.key === 'Enter') newInp.blur(); });
    }
  }

  function renderCalendar() {
    const grid  = document.getElementById('calGrid');
    const label = document.getElementById('calMonthLabel');
    const legend = document.getElementById('calLegend');
    if (!grid || !label) return;

    const now   = new Date();
    const year  = calViewYear;
    const month = calViewMonth;

    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    label.textContent = `${MONTHS[month]} ${year}`;

    const colors = {
      squat: currentSettings?.colorSquat || '#D6FF3D',
      bench: currentSettings?.colorBench || '#5BD6E6',
      dead:  currentSettings?.colorDead  || '#FF8A4C',
      press: currentSettings?.colorPress || '#B78BFF',
      arm:   currentSettings?.colorPress || '#B78BFF',
      other: '#9AA0AC',
    };

    // Manual overrides stored in settings take priority over session-derived colors
    const calColors = currentSettings?.calendarColors || {};

    // Build day→cls map from sessions
    const sessionMap = {};
    (currentSessions || []).forEach(s => {
      if (!s.dateRaw) return;
      const parts = s.dateRaw.split('-').map(Number);
      if (parts[0] === year && parts[1] - 1 === month) {
        const day = parts[2];
        if (!sessionMap[day]) sessionMap[day] = s.isRestDay ? 'rest' : (liftToCls(s.lift) || 'other');
      }
    });

    const firstDow    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const isThisMonth  = year === now.getFullYear() && month === now.getMonth();
    const isFutureMonth = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());
    const todayDate   = now.getDate();
    const monthPad    = String(month + 1).padStart(2, '0');

    grid.innerHTML = '';

    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => {
      const el = document.createElement('div');
      el.className = 'cal-dow';
      el.textContent = d;
      grid.appendChild(el);
    });

    for (let i = 0; i < firstDow; i++) {
      const el = document.createElement('div');
      el.className = 'cal-day empty';
      grid.appendChild(el);
    }

    const usedCls = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr  = `${year}-${monthPad}-${String(d).padStart(2,'0')}`;
      const el       = document.createElement('div');
      const cls      = calColors[dateStr] || sessionMap[d];
      const isToday  = isThisMonth && d === todayDate;
      const isFuture = isFutureMonth || (isThisMonth && d > todayDate);

      const hasSession = !!sessionMap[d];
      const isPlanned  = !!calColors[dateStr] && !hasSession;
      const rgbVarMap  = { squat:'--squat-rgb', bench:'--bench-rgb', dead:'--dead-rgb', arm:'--press-rgb', press:'--press-rgb' };

      let classes = 'cal-day clickable';
      if (isFuture) classes += ' future';
      if (isToday)  classes += ' today';

      if (cls === 'rest') {
        classes += ' rest-day';
        el.style.background  = 'rgba(107,114,128,0.25)';
        el.style.borderColor = 'transparent';
        usedCls.push('rest');
      } else if (cls) {
        if (isPlanned) {
          classes += ' planned-day';
          const rv = rgbVarMap[cls];
          el.style.background  = rv ? `rgba(var(${rv}),0.15)` : 'rgba(154,160,172,0.15)';
          el.style.borderColor = rv ? `rgba(var(${rv}),0.5)`  : 'rgba(154,160,172,0.5)';
        } else {
          classes += ' has-session';
          const base = colors[cls] || colors.other;
          const rv2 = rgbVarMap[cls];
          el.style.background = `radial-gradient(ellipse at 36% 26%,rgba(255,255,255,.46) 0%,rgba(255,255,255,0) 58%),linear-gradient(180deg,rgba(255,255,255,.18) 0%,rgba(0,0,0,.2) 100%),${base}`;
          el.style.boxShadow  = `inset 0 2px 3px rgba(255,255,255,.42),inset 0 -2px 3px rgba(0,0,0,.38)`;
        }
        usedCls.push(cls);
      }

      el.className = classes;
      el.dataset.date = dateStr;
      el.innerHTML = `<span>${d}</span>`;

      el.addEventListener('click', e => {
        e.stopPropagation();
        showCalPopover(el, dateStr, isFuture);
      });

      grid.appendChild(el);
    }

    const lbls = { squat:'Legs', bench:'Chest', dead:'Back', arm:'Arms', press:'Arms', other:'Other', rest:'Rest Day' };
    const order = ['squat','bench','dead','arm','press','other','rest'];
    const used = [...new Set(usedCls)].sort((a, b) => (order.indexOf(a) ?? 99) - (order.indexOf(b) ?? 99));
    if (!legend) return;
    legend.innerHTML = used.map(c => {
      if (c === 'rest') {
        return `<div class="cal-legend-item"><div class="cal-legend-dot" style="background:rgba(107,114,128,0.4)"></div>${lbls[c] || c}</div>`;
      }
      const base = colors[c] || colors.other;
      const rv3 = rgbVarMap[c];
      const dotGlow = rv3 ? `0 2px 8px rgba(var(${rv3}),.55)` : '';
      const dotBg = `radial-gradient(ellipse at 36% 26%,rgba(255,255,255,.46) 0%,rgba(255,255,255,0) 58%),linear-gradient(180deg,rgba(255,255,255,.18) 0%,rgba(0,0,0,.2) 100%),${base}`;
      return `<div class="cal-legend-item"><div class="cal-legend-dot" style="background:${dotBg};box-shadow:${dotGlow}"></div>${lbls[c] || c}</div>`;
    }).join('');
  }

  function showCalPopover(anchor, dateStr, isFuture) {
    let pop = document.getElementById('calPopover');
    if (!pop) {
      pop = document.createElement('div');
      pop.id = 'calPopover';
      pop.className = 'cal-popover';
      document.body.appendChild(pop);
    }

    const cols = {
      squat: currentSettings?.colorSquat || '#D6FF3D',
      bench: currentSettings?.colorBench || '#5BD6E6',
      dead:  currentSettings?.colorDead  || '#FF8A4C',
      arm:   currentSettings?.colorPress || '#B78BFF',
    };
    const groups = [
      { cls:'squat', label:'Legs',  color: cols.squat },
      { cls:'bench', label:'Chest', color: cols.bench },
      { cls:'dead',  label:'Back',  color: cols.dead  },
      { cls:'arm',   label:'Arms',  color: cols.arm   },
    ];

    const [y, m, d] = dateStr.split('-').map(Number);
    const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    pop.innerHTML = `
      <div class="cal-pop-date">${MO[m-1]} ${d}, ${y}${isFuture ? ' <span class="cal-pop-plan-tag">Plan</span>' : ''}</div>
      <div class="cal-pop-btns">
        ${groups.map(g => `<button class="cal-pop-btn" data-cls="${g.cls}" style="background:${g.color}">${g.label}</button>`).join('')}
        ${isFuture ? '' : '<button class="cal-pop-btn cal-pop-rest" data-cls="rest">Rest Day</button>'}
        <button class="cal-pop-btn cal-pop-clear" data-cls="clear">Clear</button>
      </div>`;

    const rect = anchor.getBoundingClientRect();
    pop.style.display = 'block';
    pop.style.top  = `${rect.bottom + (window.scrollY || document.documentElement.scrollTop) + 6}px`;
    pop.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 180)}px`;

    pop.querySelectorAll('.cal-pop-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const cls = btn.dataset.cls;
        const update = cls === 'clear'
          ? { [`calendarColors.${dateStr}`]: firebase.firestore.FieldValue.delete() }
          : { [`calendarColors.${dateStr}`]: cls };
        settingsRef().update(update).catch(err => showToast('Could not save calendar color — ' + (err?.message || 'check your connection.')));
        pop.style.display = 'none';
      });
    });
  }

  function applyCustomLifts(lifts) {
    const datalist = document.getElementById('lift-options');
    if (!datalist) return;
    datalist.querySelectorAll('option[data-custom]').forEach(o => o.remove());
    (lifts || []).forEach(l => {
      const name = typeof l === 'string' ? l : l.name;
      if (!name) return;
      const opt = document.createElement('option');
      opt.value = name;
      opt.dataset.custom = '1';
      datalist.appendChild(opt);
    });
  }

  function applyColors(s) {
    const map = {
      squat: s?.colorSquat || '#D6FF3D',
      bench: s?.colorBench || '#5BD6E6',
      dead:  s?.colorDead  || '#FF8A4C',
      press: s?.colorPress || '#B78BFF',
    };
    const root = document.documentElement;
    Object.entries(map).forEach(([key, hex]) => {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      root.style.setProperty(`--${key}`, hex);
      root.style.setProperty(`--${key}-rgb`, `${r},${g},${b}`);
    });
  }

  /* Live listener for this user's settings */
  unsubscribeSettings = settingsRef().onSnapshot(doc => {
    if (doc.exists) {
      currentSettings = doc.data();
      const { squatMax, benchMax, deadMax, bodyweight, height, unit, defaultLift } = currentSettings;
      renderProfile(squatMax, benchMax, deadMax, bodyweight || 185, height || '');
      if (unit)        applyUnit(unit);
      if (defaultLift !== undefined) applyDefaultLift(defaultLift);
      applyColors(currentSettings);
      renderGoals(currentSettings.goals);
      applyCustomLifts(currentSettings.customLifts);
      applyNavAvatar(currentUser, currentSettings.avatarId || null, currentSettings.avatarRingColor || null, currentSettings.avatarBgColor || null, currentSettings.avatarIconColor || null);
    } else {
      currentSettings = null;
      renderProfile(0, 0, 0, 185, '');
      applyColors(null);
      renderGoals(null);
      applyCustomLifts([]);
    }
    renderLog(currentSessions);
    renderDonut(currentSessions);
    updateKPIs();
    renderCalendar();
    renderTracker();
  }, err => {
    console.error('Settings error:', err.code, err.message);
    renderProfile(0, 0, 0, 185, '');
    updateKPIs();
    renderCalendar();
  });

  /* ---- PERSONAL TRACKERS ---- */
  function trackerWriteErr(err) {
    console.error('Tracker write failed:', err);
    const el = document.getElementById('trackerError');
    if (!el) return;
    el.textContent = `Could not save — ${err?.code === 'permission-denied' ? 'permission denied. Try signing out and back in.' : (err?.message || 'check your connection and try again.')}`;
    el.style.display = '';
    clearTimeout(trackerWriteErr._t);
    trackerWriteErr._t = setTimeout(() => { el.style.display = 'none'; }, 6000);
  }

  document.getElementById('trackerAddBtn')?.addEventListener('click', () => {
    const trackers = [...(currentSettings?.personalTrackers || [])];
    trackers.push({ id: 't' + Date.now(), label: '', completedDates: [] });
    settingsRef().update({ personalTrackers: trackers }).catch(trackerWriteErr);
  });

  function trackerStreak(completedDates) {
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const set = new Set(completedDates || []);
    let n = 0;
    const cur = new Date(today);
    for (let i = 0; i < 366; i++) {
      const iso = localDateISO(cur);
      if (set.has(iso)) { n++; cur.setDate(cur.getDate() - 1); }
      else if (i === 0)  { cur.setDate(cur.getDate() - 1); }
      else               { break; }
    }
    return n;
  }

  function renderTracker() {
    const list = document.getElementById('trackerList');
    if (!list) return;

    const trackers = currentSettings?.personalTrackers || [];
    const todayISO = localDateISO();

    if (!trackers.length) {
      list.innerHTML = `<div class="tracker-empty">No trackers yet — hit + Add to create one.</div>`;
      return;
    }

    list.innerHTML = trackers.map(t => {
      const isDone    = (t.completedDates || []).includes(todayISO);
      const streak    = trackerStreak(t.completedDates);
      const safeLabel = (t.label || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return `
        <div class="tracker-row" data-id="${t.id}">
          <textarea class="tracker-row-input" placeholder="What are you tracking?" maxlength="60" rows="1" data-id="${t.id}">${safeLabel}</textarea>
          <button class="tracker-row-check${isDone ? ' done' : ''}" data-id="${t.id}">${isDone ? '✓' : ''}</button>
          <span class="tracker-row-streak">${streak ? '🔥 ' + streak + 'd' : ''}</span>
          <button class="tracker-row-delete" data-id="${t.id}">✕</button>
        </div>`;
    }).join('');

    // Label save on blur / Enter + auto-resize textarea
    list.querySelectorAll('.tracker-row-input').forEach(inp => {
      const resize = () => { inp.style.height = 'auto'; inp.style.height = inp.scrollHeight + 'px'; };
      resize(); // size to content on render
      inp.addEventListener('input', resize);
      inp.addEventListener('blur', () => {
        const updated = (currentSettings?.personalTrackers || []).map(t =>
          t.id === inp.dataset.id ? { ...t, label: inp.value.trim() } : t
        );
        settingsRef().update({ personalTrackers: updated }).catch(trackerWriteErr);
      });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); inp.blur(); } });
    });

    // Toggle done for today
    list.querySelectorAll('.tracker-row-check').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = (currentSettings?.personalTrackers || []).map(t => {
          if (t.id !== btn.dataset.id) return t;
          const dates = [...(t.completedDates || [])];
          const i = dates.indexOf(todayISO);
          if (i >= 0) dates.splice(i, 1); else { dates.push(todayISO); spawnConfetti(btn); }
          return { ...t, completedDates: dates };
        });
        settingsRef().update({ personalTrackers: updated }).catch(trackerWriteErr);
      });
    });

    // Delete tracker
    list.querySelectorAll('.tracker-row-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = (currentSettings?.personalTrackers || []).filter(t => t.id !== btn.dataset.id);
        settingsRef().update({ personalTrackers: updated }).catch(trackerWriteErr);
      });
    });
  }

  /* Rest day toggle */
  document.getElementById('restDayBtn').addEventListener('click', () => {
    const today    = localDateISO();
    const existing = Array.isArray(currentSettings?.restDays) ? currentSettings.restDays : [];
    const isOn     = existing.includes(today);
    const updated  = isOn ? existing.filter(d => d !== today) : [...existing, today];
    settingsRef().set({ restDays: updated }, { merge: true })
      .catch(err => showToast('Could not toggle rest day — ' + (err?.message || 'check your connection.')));
    if (isOn) {
      const sess = currentSessions.find(s => s.isRestDay && s.dateRaw === today);
      if (sess) sessionsRef().doc(sess.id).delete().catch(err => showToast('Could not remove rest day session — ' + (err?.message || 'check your connection.')));
    } else {
      sessionsRef().add({
        date: formatDate(today), dateRaw: today,
        lift: 'Rest Day', cls: 'rest', sets: 0, reps: 0, wt: 0, note: '',
        isRestDay: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).catch(err => showToast('Could not log rest day — ' + (err?.message || 'check your connection.')));
    }
  });

  /* Save & update profile */
  document.getElementById('updateStandards').addEventListener('click', () => {
    const squatMax   = +document.getElementById('squatInput').value;
    const benchMax   = +document.getElementById('benchInput').value;
    const deadMax    = +document.getElementById('deadInput').value;
    const bodyweight = +document.getElementById('weightInput').value;
    const height     = document.getElementById('heightInput').value.trim();
    if (!squatMax || !benchMax || !deadMax || !bodyweight) {
      alert('Please enter your bodyweight and all three lift maxes.'); return;
    }
    settingsRef().set({ squatMax, benchMax, deadMax, bodyweight, height }, { merge: true })
      .catch(err => alert('Could not save: ' + err.message));
  });

  /* Settings live on settings.html — nothing to init here */

} /* end initApp */

renderBodyweight(); // init month label + empty state on page load

// Goal Guide is self-contained in guide.html
(function goalGuide() {
  const container = document.getElementById('goalGuide');
  if (!container) return;

  const GG_GOALS = [
    { id:'fat',      name:'Lose body fat',    tag:'Burn fat, keep muscle',    icon:'🔥' },
    { id:'muscle',   name:'Gain muscle',      tag:'Build size and strength',  icon:'💪' },
    { id:'strength', name:'Build strength',   tag:'Move more weight',         icon:'🏆' },
    { id:'endurance',name:'Build endurance',  tag:'Go harder, longer',        icon:'⚡' },
    { id:'general',  name:'General fitness',  tag:'Healthy and well-rounded', icon:'❤️' },
  ];
  const GG_EXP = [
    { id:'beg', l:'Just starting out' },
    { id:'int', l:'1–3 years lifting' },
    { id:'adv', l:'3+ years consistent' },
  ];
  const GG_PRATE = { fat:1.0, muscle:0.9, strength:0.85, endurance:0.7, general:0.8 };
  const GG_NOTE = {
    fat:      'Rest 60–90 sec. Aim for the upper end of each rep range.',
    muscle:   'Rest 90–120 sec. Push to 1–2 reps from failure on your last set.',
    strength: 'Rest 3–5 min between heavy sets. Add weight when all reps are clean.',
    endurance:'Rest 30–60 sec. Keep form tight even at high reps.',
    general:  'Rest 60–90 sec. Prioritise form over heavier weight.',
  };
  const GG_SLABEL = { fullbody:'Full Body', upper:'Upper Body', lower:'Lower Body', push:'Push', pull:'Pull', legs:'Legs' };

  const GG_EX = {
    fullbody:{
      beg:[['Goblet Squat',3,'10-12','Or barbell'],['Bench Press',3,'10-12',''],['Dumbbell Row',3,'10-12','Each arm'],['Romanian Deadlift',3,'10-12',''],['Overhead Press',3,'10-12','']],
      int:[['Barbell Squat',4,'6-8',''],['Bench Press',4,'6-8',''],['Barbell Row',4,'6-8',''],['Romanian Deadlift',3,'8-10',''],['Pull-ups',3,'6-10','']],
      adv:[['Barbell Squat',4,'4-6',''],['Bench Press',4,'4-6',''],['Deadlift',4,'3-5',''],['Barbell Row',3,'6-8',''],['Pull-ups',3,'8-10',''],['Overhead Press',2,'6-8','']],
    },
    upper:{
      beg:[['Bench Press',3,'10-12',''],['Dumbbell Row',3,'10-12','Each arm'],['Overhead Press',3,'10-12',''],['Lat Pulldown',3,'10-12',''],['Bicep Curl',2,'12',''],['Tricep Pushdown',2,'12','']],
      int:[['Bench Press',4,'6-8',''],['Barbell Row',4,'6-8',''],['Overhead Press',3,'8-10',''],['Pull-ups',3,'6-10',''],['Incline DB Press',3,'10-12',''],['Bicep Curl',2,'12','']],
      adv:[['Bench Press',4,'4-6',''],['Barbell Row',4,'4-6',''],['Overhead Press',3,'6-8',''],['Pull-ups',3,'8-10',''],['Incline DB Press',3,'8-10',''],['Skull Crusher',2,'10-12','']],
    },
    lower:{
      beg:[['Goblet Squat',3,'10-12','Or barbell'],['Romanian Deadlift',3,'10-12',''],['Leg Press',3,'12-15',''],['Leg Curl',3,'12-15',''],['Calf Raise',3,'15','']],
      int:[['Barbell Squat',4,'6-8',''],['Romanian Deadlift',3,'8-10',''],['Leg Press',3,'10-12',''],['Leg Curl',3,'10-12',''],['Hip Thrust',3,'10-12',''],['Calf Raise',3,'15','']],
      adv:[['Barbell Squat',4,'4-6',''],['Deadlift',4,'3-5',''],['Romanian Deadlift',3,'8-10',''],['Leg Press',3,'10-12',''],['Leg Curl',3,'10-12',''],['Calf Raise',3,'15','']],
    },
    push:{
      beg:[['Bench Press',3,'8-10',''],['Overhead Press',3,'8-10',''],['Incline DB Press',3,'10-12',''],['Lateral Raise',3,'15',''],['Tricep Pushdown',3,'12','']],
      int:[['Bench Press',4,'6-8',''],['Overhead Press',3,'6-8',''],['Incline DB Press',3,'8-10',''],['Lateral Raise',3,'15',''],['Tricep Pushdown',3,'10-12',''],['Cable Fly',2,'12-15','']],
      adv:[['Bench Press',4,'4-6',''],['Overhead Press',4,'5-7',''],['Incline DB Press',3,'8-10',''],['Lateral Raise',3,'15-20',''],['Tricep Pushdown',3,'10-12',''],['Cable Fly',2,'12-15','']],
    },
    pull:{
      beg:[['Lat Pulldown',4,'10-12',''],['Seated Cable Row',3,'10-12',''],['Face Pull',3,'15',''],['Bicep Curl',3,'12',''],['Rear Delt Fly',2,'15','']],
      int:[['Deadlift',3,'4-5','Warm up well'],['Barbell Row',4,'6-8',''],['Pull-ups',3,'6-10',''],['Face Pull',3,'15',''],['Bicep Curl',3,'10-12',''],['Hammer Curl',2,'12','']],
      adv:[['Deadlift',4,'3-5','Warm up well'],['Barbell Row',4,'5-6',''],['Pull-ups',3,'8-10',''],['Cable Row',3,'10-12',''],['Face Pull',3,'15',''],['Bicep Curl',2,'10-12','']],
    },
    legs:{
      beg:[['Barbell Squat',3,'8-10',''],['Romanian Deadlift',3,'10-12',''],['Leg Press',3,'12-15',''],['Leg Curl',3,'12-15',''],['Calf Raise',3,'15','']],
      int:[['Barbell Squat',4,'6-8',''],['Romanian Deadlift',3,'8-10',''],['Leg Press',3,'10-12',''],['Leg Curl',3,'10-12',''],['Hip Thrust',3,'10-12',''],['Calf Raise',3,'15','']],
      adv:[['Barbell Squat',4,'4-6',''],['Romanian Deadlift',4,'8-10',''],['Leg Press',3,'10-12',''],['Leg Curl',3,'10-12',''],['Hip Thrust',3,'10-12',''],['Calf Raise',3,'15','']],
    },
  };

  function ggSplitTypes(d) {
    if (d <= 3) return Array(d).fill('fullbody');
    if (d === 4) return ['upper','lower','upper','lower'];
    if (d === 5) return ['push','pull','legs','push','pull'];
    return ['push','pull','legs','push','pull','legs'];
  }
  function ggTrainDays(n) {
    return ({ 1:[0], 2:[0,3], 3:[0,2,4], 4:[0,1,3,4], 5:[0,1,2,4,5], 6:[0,1,2,3,4,5] })[n] || [];
  }
  const GG_D7 = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  function ggAdjR(r, goal) {
    if (r.includes(' ')) return r;
    const p = r.split('-'); if (p.length < 2) return r;
    const lo = +p[0], hi = +p[1];
    if (goal === 'fat')      return `${lo+4}-${hi+4}`;
    if (goal === 'endurance') return `${Math.max(lo+6,15)}-${Math.max(hi+6,20)}`;
    if (goal === 'strength' && hi <= 8) return '3-5';
    return r;
  }
  function ggProt(w, g) { return Math.round((parseInt(w)||180) * (GG_PRATE[g]||0.8)); }
  function ggCals(g, w) {
    const b = Math.round((parseInt(w)||180) * 14);
    if (g === 'fat')      return `${b-450}–${b-150} cal/day`;
    if (g === 'muscle')   return `${b+150}–${b+350} cal/day`;
    if (g === 'endurance') return `${b+100}–${b+400} cal/day`;
    return `${b-50}–${b+150} cal/day`;
  }
  function ggSplitName(d) {
    if (d <= 3) return 'Full Body';
    if (d === 4) return 'Upper / Lower';
    return 'Push / Pull / Legs';
  }

  const chevD = `<svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1 1L7 7L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const chevU = `<svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M13 8L7 2L1 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  let ggSt = { step:1, goal:null, exp:null, days:null, weight:'', open:0 };

  function ggRender() {
    const prog = n => [1,2,3].map(i =>
      `<div class="guide-pd${i < n ? ' done' : i === n ? ' act' : ''}"></div>`
    ).join('');

    if (ggSt.step === 1) {
      container.innerHTML = `
        <div class="guide-eyebrow">Goal Guide</div>
        <div class="guide-pg">${prog(1)}</div>
        <p class="guide-title">What are you training for?</p>
        <p class="guide-sub">Pick your primary goal to get started.</p>
        <div class="guide-goals">${GG_GOALS.map(g => `
          <div class="guide-gc${ggSt.goal === g.id ? ' on' : ''}" onclick="ggPick('${g.id}')">
            <div class="guide-gi">${g.icon}</div>
            <p class="guide-gn">${g.name}</p><p class="guide-gt">${g.tag}</p>
          </div>`).join('')}</div>
        <div class="guide-btns">
          <button class="guide-btn guide-btn-p" onclick="ggNx()" ${!ggSt.goal ? 'disabled' : ''}>Next →</button>
        </div>`;

    } else if (ggSt.step === 2) {
      const ok = ggSt.exp && ggSt.days && ggSt.weight;
      container.innerHTML = `
        <div class="guide-eyebrow">Goal Guide</div>
        <div class="guide-pg">${prog(2)}</div>
        <p class="guide-title">Tell me about yourself</p>
        <p class="guide-sub">Three quick answers — we'll build a plan around them.</p>
        <div class="guide-qlabel">Experience level</div>
        <div class="guide-pills">${GG_EXP.map(e => `
          <span class="guide-pill${ggSt.exp === e.id ? ' on' : ''}" onclick="ggExp('${e.id}')">${e.l}</span>`).join('')}
        </div>
        <div class="guide-qlabel">Days per week you can train</div>
        <div class="guide-pills">${[1,2,3,4,5,6].map(d => `
          <span class="guide-pill${ggSt.days === d ? ' on' : ''}" onclick="ggDays(${d})">${d} day${d > 1 ? 's' : ''}</span>`).join('')}
        </div>
        <div class="guide-qlabel">Your bodyweight</div>
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:4px">
          <input id="ggWtInput" class="guide-winput" type="number" placeholder="185" min="80" max="500"
            value="${ggSt.weight}" oninput="ggWtChange(this.value)">
          <span style="font-size:13px;color:var(--text-dimmer)">lbs</span>
        </div>
        <p class="guide-hint">Used to calculate your protein and calorie targets.</p>
        <div class="guide-btns">
          <button class="guide-btn guide-btn-s" onclick="ggBk()">Back</button>
          <button class="guide-btn guide-btn-p" id="ggNxBtn" onclick="ggNx()" ${!ok ? 'disabled' : ''}>Build my plan →</button>
        </div>`;

    } else {
      const g      = GG_GOALS.find(x => x.id === ggSt.goal);
      const ek     = ggSt.exp || 'beg';
      const w      = parseInt(ggSt.weight) || 180;
      const tDays  = ggTrainDays(ggSt.days);
      const types  = ggSplitTypes(ggSt.days);
      const expL   = GG_EXP.find(e => e.id === ggSt.exp)?.l || '';

      const week = GG_D7.map((d, i) => {
        const ti = tDays.indexOf(i); const on = ti >= 0;
        let lbl = on ? (GG_SLABEL[types[ti]] || 'Train') : 'Rest';
        if (!on && ggSt.goal === 'endurance') lbl = 'Zone 2';
        return `<div class="guide-wd ${on ? 'guide-wd-on' : 'guide-wd-off'}">
          <span class="guide-wd-name">${d}</span>${lbl}
        </div>`;
      }).join('');

      const cards = tDays.map((di, i) => {
        const type   = types[i];
        const exList = (GG_EX[type] || GG_EX.fullbody)[ek] || (GG_EX[type] || GG_EX.fullbody).beg;
        const isOpen = ggSt.open === i;
        const body   = isOpen ? `<div class="guide-dc-body">
          <div class="guide-wk-note">${GG_NOTE[ggSt.goal]}</div>
          ${exList.map(([nm, s, r, n]) => `
            <div class="guide-ex-row">
              <span class="guide-ex-name">${nm}${n ? `<span class="guide-ex-note">(${n})</span>` : ''}</span>
              <span class="guide-ex-sets">${s} × ${ggAdjR(r, ggSt.goal)}</span>
            </div>`).join('')}
        </div>` : '';
        return `<div class="guide-dc">
          <div class="guide-dc-head" onclick="ggTog(${i})">
            <div>
              <span class="guide-dc-day">${GG_D7[di]}</span>
              <span class="guide-dc-type">${GG_SLABEL[type]}</span>
            </div>
            <span style="color:var(--text-dimmer)">${isOpen ? chevU : chevD}</span>
          </div>${body}
        </div>`;
      }).join('');

      container.innerHTML = `
        <div class="guide-eyebrow">Goal Guide</div>
        <div class="guide-pg">${prog(4)}</div>
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:6px">
          <span style="font-size:22px">${g.icon}</span>
          <p class="guide-title" style="margin:0">${g.name}</p>
        </div>
        <span class="guide-badge">${expL} · ${ggSt.days} day${ggSt.days > 1 ? 's' : ''}/week · ${w} lbs</span>
        <div class="guide-plan">
          <div class="guide-pcard">
            <div class="guide-pc-label">Daily protein</div>
            <div class="guide-pc-val">${ggProt(w, ggSt.goal)}<span class="guide-pc-unit"> g</span></div>
          </div>
          <div class="guide-pcard">
            <div class="guide-pc-label">Split</div>
            <div class="guide-pc-val" style="font-size:13px;margin-top:2px">${ggSplitName(ggSt.days)}</div>
          </div>
          <div class="guide-pcard">
            <div class="guide-pc-label">Calories</div>
            <div class="guide-pc-val" style="font-size:13px;margin-top:2px">${ggCals(ggSt.goal, ggSt.weight)}</div>
          </div>
        </div>
        <div class="guide-sec">Weekly schedule</div>
        <div class="guide-week">${week}</div>
        <div class="guide-sec" style="margin-top:16px">Your workouts — click to expand</div>
        ${cards}
        <button class="guide-restart" onclick="ggRst()">Start over</button>`;
    }
  }

  window.ggPick     = id => { ggSt.goal = id; ggRender(); };
  window.ggExp      = id => { ggSt.exp  = id; ggRender(); };
  window.ggDays     = d  => { ggSt.days = d;  ggRender(); };
  window.ggWtChange = v  => {
    ggSt.weight = v;
    const btn = document.getElementById('ggNxBtn');
    if (btn) btn.disabled = !(ggSt.exp && ggSt.days && v);
  };
  window.ggNx  = () => { if (ggSt.step < 3) ggSt.step++; ggRender(); };
  window.ggBk  = () => { if (ggSt.step > 1) ggSt.step--; ggRender(); };
  window.ggTog = i  => { ggSt.open = ggSt.open === i ? -1 : i; ggRender(); };
  window.ggRst = () => { ggSt = { step:1, goal:null, exp:null, days:null, weight:'', open:0 }; ggRender(); };

  ggRender();
})();

/* ── Plate Calculator ─────────────────────────────────── */
(function plateCalc() {
  const $ = id => document.getElementById(id);
  if (!$('pcPalette')) return;

  const PLATES = {
    lbs: [45, 35, 25, 10, 5, 2.5],
    kg:  [25, 20, 15, 10, 5, 2.5, 1.25],
  };
  const COLORS = {
    lbs: { 45: '#BF3020', 35: '#1755A2', 25: '#CFA000', 10: '#1A7A38', 5: '#B0B0B0', 2.5: '#565656' },
    kg:  { 25: '#BF3020', 20: '#1755A2', 15: '#CFA000', 10: '#1A7A38', 5: '#B0B0B0', 2.5: '#565656', 1.25: '#444444' },
  };
  const BAR = {
    lbs: { standard: 45, womens: 35 },
    kg:  { standard: 20, womens: 15 },
  };

  let unit = 'lbs', bar = 'standard';
  let counts = {};

  function barWt() {
    if (bar === 'custom') return parseFloat($('pcBarCustom').value) || 0;
    return BAR[unit][bar];
  }

  function totalWt() {
    const plates = PLATES[unit];
    let sum = barWt();
    for (const p of plates) sum += (counts[p] || 0) * p * 2;
    return Math.round(sum * 1000) / 1000;
  }

  function buildBarbell() {
    const W = 800, H = 130, CY = 65;
    const PH = {
      lbs: { 45: 44, 35: 40, 25: 34, 10: 26, 5: 19, 2.5: 13 },
      kg:  { 25: 44, 20: 40, 15: 34, 10: 26, 5: 19, 2.5: 13, 1.25: 9 },
    };
    const PW = 13;
    const GL = 255, GR = 545;           // shoulder positions (where blockers sit)
    const SL = 58,  SR = 742;           // sleeve ends
    const GRIP_H = 8, SLEEVE_H = 4;     // skinnier bar
    const COLLAR_W = 10, COLLAR_H = 17; // plate blockers, at the shoulders

    const el = [];

    // Sleeves
    el.push(`<rect x="${SL}" y="${CY-SLEEVE_H}" width="${GL-SL}" height="${SLEEVE_H*2}" fill="#7a7a7a" rx="2"/>`);
    el.push(`<rect x="${GR}" y="${CY-SLEEVE_H}" width="${SR-GR}" height="${SLEEVE_H*2}" fill="#7a7a7a" rx="2"/>`);
    // Center grip
    el.push(`<rect x="${GL}" y="${CY-GRIP_H}" width="${GR-GL}" height="${GRIP_H*2}" fill="#5a5a5a" rx="2"/>`);
    // Knurl lines
    for (let gx = GL+14; gx < GR-8; gx += 11) {
      el.push(`<line x1="${gx}" y1="${CY-GRIP_H+2}" x2="${gx}" y2="${CY+GRIP_H-2}" stroke="#484848" stroke-width="1.5"/>`);
    }
    // End caps
    el.push(`<rect x="${SL-5}" y="${CY-SLEEVE_H-2}" width="5" height="${(SLEEVE_H+2)*2}" fill="#888" rx="2"/>`);
    el.push(`<rect x="${SR}"   y="${CY-SLEEVE_H-2}" width="5" height="${(SLEEVE_H+2)*2}" fill="#888" rx="2"/>`);
    // Collars (plate blockers) — at the shoulders, plates butt against these
    el.push(`<rect x="${GL-COLLAR_W}" y="${CY-COLLAR_H}" width="${COLLAR_W}" height="${COLLAR_H*2}" fill="#9e9e9e" rx="2"/>`);
    el.push(`<rect x="${GR}"          y="${CY-COLLAR_H}" width="${COLLAR_W}" height="${COLLAR_H*2}" fill="#9e9e9e" rx="2"/>`);

    // Plates — stacking outward from the collars
    let xL = GL - COLLAR_W, xR = GR + COLLAR_W;
    for (const p of PLATES[unit]) {
      const c = counts[p] || 0;
      if (!c) continue;
      const h = PH[unit][p], color = COLORS[unit][p];
      for (let i = 0; i < c; i++) {
        if (xL - PW < SL + 2) break;
        xL -= PW;
        el.push(`<rect x="${xL}" y="${CY-h}" width="${PW}" height="${h*2}" fill="${color}" rx="2" stroke="rgba(0,0,0,0.35)" stroke-width="1" data-rm="${p}"/>`);
        el.push(`<rect x="${xR}" y="${CY-h}" width="${PW}" height="${h*2}" fill="${color}" rx="2" stroke="rgba(0,0,0,0.35)" stroke-width="1" data-rm="${p}"/>`);
        xR += PW;
      }
    }

    return `<svg viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible;">${el.join('')}</svg>`;
  }

  function render() {
    const plates = PLATES[unit];

    // Palette buttons
    $('pcPalette').innerHTML = plates.map(p =>
      `<button class="pc-plate-btn" style="background:${COLORS[unit][p]}" data-plate="${p}">${p}</button>`
    ).join('');

    // Barbell SVG
    $('pcBarbellWrap').innerHTML = buildBarbell();

    // Total
    const total = totalWt();
    const conv  = unit === 'lbs'
      ? `/ ${(total / 2.20462).toFixed(1)} kg`
      : `/ ${(total * 2.20462).toFixed(1)} lbs`;
    $('pcTotal').innerHTML =
      `<span class="pc-total-num">${total}</span><span class="pc-total-unit"> ${unit}</span><span class="pc-total-conv"> ${conv}</span>`;
  }

  // Add plate via palette
  $('pcPalette').addEventListener('click', e => {
    const btn = e.target.closest('[data-plate]');
    if (!btn) return;
    const p = parseFloat(btn.dataset.plate);
    counts[p] = (counts[p] || 0) + 1;
    render();
  });

  // Remove plate by clicking barbell
  $('pcBarbellWrap').addEventListener('click', e => {
    const rect = e.target.closest('[data-rm]');
    if (!rect) return;
    const p = parseFloat(rect.dataset.rm);
    if (counts[p] > 0) { counts[p]--; if (!counts[p]) delete counts[p]; }
    render();
  });

  // Unit toggle — clears loaded plates on switch
  $('pcUnitToggle').addEventListener('click', e => {
    const btn = e.target.closest('button[data-val]');
    if (!btn || btn.dataset.val === unit) return;
    unit = btn.dataset.val;
    counts = {};
    $('pcUnitToggle').querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.val === unit));
    $('pcBarUnit').textContent = unit;
    render();
  });

  // Bar toggle
  $('pcBarToggle').addEventListener('click', e => {
    const btn = e.target.closest('button[data-val]');
    if (!btn) return;
    bar = btn.dataset.val;
    $('pcBarToggle').querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.val === bar));
    $('pcCustomWrap').style.display = bar === 'custom' ? '' : 'none';
    render();
  });

  $('pcBarCustom').addEventListener('input', render);
  $('pcClear').addEventListener('click', () => { counts = {}; render(); });

  render();
})();

/* ===== LIVING BACKGROUND MEDALLION (scroll parallax) ==============
   The faint medallions drift at different speeds for depth. Disabled
   automatically for users who prefer reduced motion. */
(function () {
  const meds = Array.from(document.querySelectorAll('.bg-medallion'));
  if (!meds.length) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking = false;
  function update() {
    const y = window.scrollY || window.pageYOffset || 0;
    meds.forEach(el => {
      const sp = parseFloat(el.dataset.speed) || 0;
      const ro = parseFloat(el.dataset.rot) || 0;
      el.style.transform = 'translateY(' + (y * sp) + 'px) rotate(' + (y * ro) + 'deg)';
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

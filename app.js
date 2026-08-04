/* IRONGLADIATOR — Interactive logic, Firebase auth, and per-user data sync.
   Load order: firebase SDKs → firebase-config.js → data.js → this file. */

/* Start at top on fresh loads; hash navigation re-scrolls after auth+data render */
history.scrollRestoration = 'manual';
if (!location.hash) {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  window.addEventListener('load', () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
}

/* Arm the reveal animation before the first paint.
   Without this, .reveal elements are fully visible (no JS = no hidden state).
   With this, they start at opacity:0 and are revealed by the IO or rAF below. */
document.body.classList.add('js-loaded');
requestAnimationFrame(() => {
  document.querySelectorAll('.reveal').forEach(s => {
    if (s.getBoundingClientRect().top < window.innerHeight * 0.95) s.classList.add('in');
  });
});

/* The dashboard tab handler can run before auth/data has called initApp().
   Keep that first muscle-map open request so initApp can fulfill it later. */
window.__igMuscleMapResizeQueued = false;
if (typeof window.igResizeMuscleMap !== 'function') {
  window.igResizeMuscleMap = function () {
    window.__igMuscleMapResizeQueued = true;
  };
}

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
/* Guarded so app.js can coexist with a persistent shell (soft-nav) that
   may have already initialized Firebase — matches nav-auth.js/yoga.js. */
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db      = firebase.firestore();
const auth    = firebase.auth();
const storage = firebase.storage();

/* Cross-activation cache: unlike initApp()'s own local state (which is
   fresh/reset on every call — soft-nav re-runs initApp on every swap,
   even between pages that were already visited this session), this
   variable lives at the true top level and survives across those calls.
   Used to paint goals immediately from last-known data on arrival at a
   page that shows them, instead of an empty list while the settings
   listener re-subscribes and confirms it moments later. */
let _igGoalsCache = null;

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

/* Mirrors the top-nav avatar into the bottom nav's Profile icon so the
   nav bar visually says "this is you" instead of a generic person icon. */
function syncBottomNavAvatar(user, avatarId, ringColor, bgColor, iconColor, avatarPhotoUrl, avatarZoom, avatarPosX, avatarPosY) {
  if (window.IGSyncBottomNavAvatar) {
    window.IGSyncBottomNavAvatar({
      avatarId,
      avatarRingColor: ringColor,
      avatarBgColor: bgColor,
      avatarIconColor: iconColor,
      avatarPhotoUrl,
      avatarZoom,
      avatarPosX,
      avatarPosY,
      photoURL: user && user.photoURL,
      displayName: user && user.displayName,
      email: user && user.email,
    });
    return;
  } else {
    window.__igBottomNavAvatarState = {
      avatarId,
      avatarRingColor: ringColor,
      avatarBgColor: bgColor,
      avatarIconColor: iconColor,
      avatarPhotoUrl,
      avatarZoom,
      avatarPosX,
      avatarPosY,
      photoURL: user && user.photoURL,
      displayName: user && user.displayName,
      email: user && user.email,
    };
  }
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

/* Home page only: the greeting-row avatar next to "Welcome back". No-op
   on every other page since #homeAvatar only exists in index.html. */
function syncHomeAvatar(user, avatarId, ringColor, bgColor, iconColor, avatarPhotoUrl, avatarZoom, avatarPosX, avatarPosY) {
  const el = document.getElementById('homeAvatar');
  if (!el) return;
  const emb = avatarId && EMBLEMS.find(e => e.id === avatarId);
  if (avatarPhotoUrl || (user && user.photoURL && !emb)) {
    el.style.cssText = '--home-avatar-fill:transparent;overflow:hidden;position:relative;';
    el.innerHTML = '';
    const img = document.createElement('img');
    img.alt = '';
    img.style.cssText = 'position:absolute;object-fit:fill;';
    img.onload = function () {
      const cW = el.clientWidth  || el.offsetWidth  || 48;
      const cH = el.clientHeight || el.offsetHeight || 48;
      const z  = avatarZoom != null ? avatarZoom : 1;
      const px = avatarPosX != null ? avatarPosX : 50;
      const py = avatarPosY != null ? avatarPosY : 50;
      const base = Math.max(cW / img.naturalWidth, cH / img.naturalHeight);
      const dW = img.naturalWidth  * base * z;
      const dH = img.naturalHeight * base * z;
      img.style.width  = dW + 'px';
      img.style.height = dH + 'px';
      img.style.left   = -((dW - cW) * px / 100) + 'px';
      img.style.top    = -((dH - cH) * py / 100) + 'px';
    };
    img.src = avatarPhotoUrl || user.photoURL;
    el.appendChild(img);
    return;
  }
  if (emb) {
    el.style.cssText = `--home-avatar-fill:${bgColor||'#8b1c1c'};display:flex;align-items:center;justify-content:center;`;
    el.innerHTML = `<i class="ti ${emb.icon}" style="font-size:26px;color:${iconColor||'#fff'};line-height:1;" aria-hidden="true"></i>`;
  } else if (user) {
    el.style.cssText = '--home-avatar-fill:#8b1c1c;display:flex;align-items:center;justify-content:center;';
    el.innerHTML = '';
    el.textContent = (user.displayName || user.email || '?').charAt(0).toUpperCase();
  }
}

function applyNavAvatar(user, avatarId, ringColor, bgColor, iconColor, avatarPhotoUrl, avatarZoom, avatarPosX, avatarPosY, doReveal) {
  syncBottomNavAvatar(user, avatarId, ringColor, bgColor, iconColor, avatarPhotoUrl, avatarZoom, avatarPosX, avatarPosY);
  syncHomeAvatar(user, avatarId, ringColor, bgColor, iconColor, avatarPhotoUrl, avatarZoom, avatarPosX, avatarPosY);
  if (!navAvatar) return;
  if (avatarPhotoUrl) {
    navAvatar.style.cssText = 'overflow:hidden;background:transparent;position:relative;';
    navAvatar.innerHTML = '';
    const img = document.createElement('img');
    img.alt = '';
    img.style.cssText = 'position:absolute;object-fit:fill;';
    img.onload = function () {
      const cW = navAvatar.offsetWidth  || 36;
      const cH = navAvatar.offsetHeight || 36;
      const z  = avatarZoom != null ? avatarZoom : 1;
      const px = avatarPosX != null ? avatarPosX : 50;
      const py = avatarPosY != null ? avatarPosY : 50;
      const base = Math.max(cW / img.naturalWidth, cH / img.naturalHeight);
      const dW = img.naturalWidth  * base * z;
      const dH = img.naturalHeight * base * z;
      img.style.width  = dW + 'px';
      img.style.height = dH + 'px';
      img.style.left   = -((dW - cW) * px / 100) + 'px';
      img.style.top    = -((dH - cH) * py / 100) + 'px';
      navAvatar.style.opacity = '1';
    };
    img.src = avatarPhotoUrl;
    navAvatar.appendChild(img);
    return;
  }
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
  if (doReveal) navAvatar.style.opacity = '1';
}

/* Caps the LONGEST side at maxSide, preserving the photo's natural
   aspect ratio, rather than force-fitting it into a maxW x maxH box.
   Boxing in a non-square shape (like a 4:1 banner target) badly
   under-uses the resolution budget for any normally-proportioned
   photo (4:3, 16:9, portrait) since the shorter box dimension ends up
   the binding constraint -- the avatar/banner crop tool already does
   its own cover-fit crop/pan/zoom, so the compressor's job is just to
   preserve enough source detail for that, not to pre-shape the image
   to match the final display frame. */
function compressImage(file, maxSide, quality) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Uploads a compressed data URL to Firebase Storage and returns the
   public download URL to store in Firestore instead of the raw image
   data. Storage has no meaningful size ceiling (unlike a Firestore
   document, capped at 1 MiB total), so this is what actually lets
   avatar/banner quality be turned up. `path` is overwritten in place
   on every re-upload (one file per user per slot — no cleanup needed). */
async function uploadToStorage(dataUrl, path) {
  const ref = storage.ref(path);
  await ref.putString(dataUrl, 'data_url');
  return ref.getDownloadURL();
}

function showOnboardingModal(user) {
  let obName = user.displayName || '';
  let obFirstName = '';
  let obLastName = '';
  let obAvatarDataUrl = null;
  let obAvatarZoom = 1;
  let obAvatarX = 50;
  let obAvatarY = 50;
  let obBannerDataUrl = null;
  let obBannerZoom = 1;
  let obBannerX = 50;
  let obBannerY = 50;

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
      <h2 class="title" style="margin:6px 0 22px;">What should we call you?</h2>
      <input id="ob-name" type="text" class="auth-input" placeholder="Username"
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
      renderStepFirstName();
    }

    input.addEventListener('keydown', e => { if (e.key === 'Enter') advanceName(); });
    document.getElementById('ob-name-continue').addEventListener('click', advanceName);
    document.getElementById('ob-skip-name').addEventListener('click', renderStepFirstName);
  }

  /* ---- Step 2: First name (required) ---- */
  function renderStepFirstName() {
    card.innerHTML = `
      <div class="eyebrow">Step 2 of 6</div>
      <h2 class="title" style="margin:6px 0 22px;">What's your first name?</h2>
      <input id="ob-first-name" type="text" class="auth-input" placeholder="First name"
             value="${obFirstName.replace(/"/g,'&quot;')}" maxlength="40"
             style="width:100%;margin-bottom:8px;">
      <p id="ob-first-name-err" style="color:var(--down);font-size:12px;margin:0 0 8px;min-height:16px;"></p>
      <button id="ob-first-name-continue" class="btn btn-primary" style="width:100%;margin-bottom:8px;">Continue</button>
      <button id="ob-first-name-back" class="btn btn-ghost" style="font-size:13px;padding:6px 16px;width:100%;">← Back</button>
    `;
    const input = document.getElementById('ob-first-name');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    function advance() {
      const val = input.value.trim();
      if (!val) { document.getElementById('ob-first-name-err').textContent = 'Please enter your first name.'; return; }
      obFirstName = val;
      renderStepLastName();
    }

    input.addEventListener('keydown', e => { if (e.key === 'Enter') advance(); });
    document.getElementById('ob-first-name-continue').addEventListener('click', advance);
    document.getElementById('ob-first-name-back').addEventListener('click', renderStepName);
  }

  /* ---- Step 3: Last name (required) ---- */
  function renderStepLastName() {
    card.innerHTML = `
      <div class="eyebrow">Step 3 of 6</div>
      <h2 class="title" style="margin:6px 0 22px;">What's your last name?</h2>
      <input id="ob-last-name" type="text" class="auth-input" placeholder="Last name"
             value="${obLastName.replace(/"/g,'&quot;')}" maxlength="40"
             style="width:100%;margin-bottom:8px;">
      <p id="ob-last-name-err" style="color:var(--down);font-size:12px;margin:0 0 8px;min-height:16px;"></p>
      <button id="ob-last-name-continue" class="btn btn-primary" style="width:100%;margin-bottom:8px;">Continue</button>
      <button id="ob-last-name-back" class="btn btn-ghost" style="font-size:13px;padding:6px 16px;width:100%;">← Back</button>
    `;
    const input = document.getElementById('ob-last-name');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);

    function advance() {
      const val = input.value.trim();
      if (!val) { document.getElementById('ob-last-name-err').textContent = 'Please enter your last name.'; return; }
      obLastName = val;
      renderStepEmailConfirm();
    }

    input.addEventListener('keydown', e => { if (e.key === 'Enter') advance(); });
    document.getElementById('ob-last-name-continue').addEventListener('click', advance);
    document.getElementById('ob-last-name-back').addEventListener('click', renderStepFirstName);
  }

  /* ---- Step 4: Email confirm (required, read-only — already tied to the account) ---- */
  function renderStepEmailConfirm() {
    card.innerHTML = `
      <div class="eyebrow">Step 4 of 6</div>
      <h2 class="title" style="margin:6px 0 22px;">Confirm your email</h2>
      <input type="text" class="auth-input" value="${(user.email || '').replace(/"/g,'&quot;')}" disabled
             style="width:100%;margin-bottom:16px;opacity:0.6;cursor:not-allowed;">
      <button id="ob-email-continue" class="btn btn-primary" style="width:100%;margin-bottom:8px;">Continue</button>
      <button id="ob-email-back" class="btn btn-ghost" style="font-size:13px;padding:6px 16px;width:100%;">← Back</button>
    `;
    document.getElementById('ob-email-continue').addEventListener('click', renderStepPhoto);
    document.getElementById('ob-email-back').addEventListener('click', renderStepLastName);
  }

  /* ---- Step 5: Profile photo ---- */
  function renderStepPhoto() {
    card.innerHTML = `
      <div class="eyebrow">Step 5 of 6</div>
      <h2 class="title" style="margin:6px 0 20px;">Set your profile photo</h2>
      <div style="display:flex;justify-content:center;margin-bottom:16px;">
        <div id="ob-av-circle" class="ob-av-circle">
          <div id="ob-av-placeholder" style="display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--text-dimmer);">
            <i class="ti ti-user" style="font-size:36px;opacity:.3;"></i>
          </div>
        </div>
      </div>
      <input type="file" id="ob-av-file" accept="image/*" style="display:none">
      <button id="ob-av-btn" class="btn btn-ghost" style="width:100%;margin-bottom:8px;">
        <i class="ti ti-upload" style="font-size:15px;margin-right:6px;"></i>${obAvatarDataUrl ? 'Change photo' : 'Upload photo'}
      </button>
      <div id="ob-av-sliders" style="${obAvatarDataUrl ? '' : 'display:none;'}margin-bottom:12px;">
        <div class="ob-range-row">
          <label class="ob-range-label">Zoom</label>
          <input type="range" id="ob-av-zoom" class="ob-range" min="1" max="3" step="0.01" value="${obAvatarZoom}">
        </div>
        <div class="ob-range-row">
          <label class="ob-range-label">Horizontal</label>
          <input type="range" id="ob-av-x" class="ob-range" min="0" max="100" step="1" value="${obAvatarX}">
        </div>
        <div class="ob-range-row">
          <label class="ob-range-label">Vertical</label>
          <input type="range" id="ob-av-y" class="ob-range" min="0" max="100" step="1" value="${obAvatarY}">
        </div>
      </div>
      <button id="ob-av-continue" class="btn btn-primary" style="width:100%;margin-bottom:8px;">Continue</button>
      <button id="ob-av-skip" class="btn btn-ghost" style="font-size:13px;padding:10px 16px;width:100%;margin-bottom:8px;">Skip for now</button>
      <button id="ob-av-back" class="btn btn-ghost" style="font-size:13px;padding:6px 16px;width:100%;">← Back</button>
    `;

    if (obAvatarDataUrl) applyAvPreview();

    function applyAvPreview() {
      const circle = document.getElementById('ob-av-circle');
      if (!circle || !obAvatarDataUrl) return;
      const ph = document.getElementById('ob-av-placeholder');
      if (ph) ph.style.display = 'none';
      let img = circle.querySelector('img.ob-av-img');
      if (!img) {
        img = document.createElement('img');
        img.className = 'ob-av-img';
        img.alt = '';
        img.style.cssText = 'position:absolute;object-fit:fill;';
        circle.appendChild(img);
      }
      img.onload = () => updateAvPreview(img);
      img.src = obAvatarDataUrl;
    }

    function updateAvPreview(imgEl) {
      const circle = document.getElementById('ob-av-circle');
      const img = imgEl || circle?.querySelector('img.ob-av-img');
      if (!img || !img.naturalWidth) return;
      const cW = 128, cH = 128;
      const base = Math.max(cW / img.naturalWidth, cH / img.naturalHeight);
      const dW = img.naturalWidth  * base * obAvatarZoom;
      const dH = img.naturalHeight * base * obAvatarZoom;
      img.style.width  = dW + 'px';
      img.style.height = dH + 'px';
      img.style.left   = -((dW - cW) * obAvatarX / 100) + 'px';
      img.style.top    = -((dH - cH) * obAvatarY / 100) + 'px';
    }

    document.getElementById('ob-av-file').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      obAvatarDataUrl = await compressImage(file, 800, 0.95);
      applyAvPreview();
      document.getElementById('ob-av-sliders').style.display = '';
      const btn = document.getElementById('ob-av-btn');
      if (btn) btn.innerHTML = '<i class="ti ti-upload" style="font-size:15px;margin-right:6px;"></i>Change photo';
    });
    document.getElementById('ob-av-btn').addEventListener('click', () => document.getElementById('ob-av-file').click());

    document.getElementById('ob-av-zoom')?.addEventListener('input', e => { obAvatarZoom = parseFloat(e.target.value); updateAvPreview(); });
    document.getElementById('ob-av-x')?.addEventListener('input',    e => { obAvatarX    = parseFloat(e.target.value); updateAvPreview(); });
    document.getElementById('ob-av-y')?.addEventListener('input',    e => { obAvatarY    = parseFloat(e.target.value); updateAvPreview(); });

    document.getElementById('ob-av-continue').addEventListener('click', renderStepBanner);
    document.getElementById('ob-av-skip').addEventListener('click', renderStepBanner);
    document.getElementById('ob-av-back').addEventListener('click', renderStepEmailConfirm);
  }

  /* ---- Step 6: Profile banner ---- */
  function renderStepBanner() {
    card.innerHTML = `
      <div class="eyebrow">Step 6 of 6</div>
      <h2 class="title" style="margin:6px 0 16px;">Set your profile banner</h2>
      <div id="ob-banner-preview" class="ob-banner-preview">
        <div id="ob-banner-placeholder" style="display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--text-dimmer);padding:20px;">
          <i class="ti ti-photo" style="font-size:28px;opacity:.3;"></i>
          <span style="font-size:12px;font-family:var(--mono);">No banner</span>
        </div>
      </div>
      <input type="file" id="ob-banner-file" accept="image/*" style="display:none">
      <button id="ob-banner-btn" class="btn btn-ghost" style="width:100%;margin-top:12px;margin-bottom:8px;">
        <i class="ti ti-upload" style="font-size:15px;margin-right:6px;"></i>${obBannerDataUrl ? 'Change banner' : 'Upload banner'}
      </button>
      <div id="ob-banner-sliders" style="${obBannerDataUrl ? '' : 'display:none;'}margin-bottom:12px;">
        <div class="ob-range-row">
          <label class="ob-range-label">Zoom</label>
          <input type="range" id="ob-banner-zoom" class="ob-range" min="1" max="3" step="0.01" value="${obBannerZoom}">
        </div>
        <div class="ob-range-row">
          <label class="ob-range-label">Horizontal</label>
          <input type="range" id="ob-banner-x" class="ob-range" min="0" max="100" step="1" value="${obBannerX}">
        </div>
        <div class="ob-range-row">
          <label class="ob-range-label">Vertical</label>
          <input type="range" id="ob-banner-y" class="ob-range" min="0" max="100" step="1" value="${obBannerY}">
        </div>
      </div>
      <button id="ob-banner-done" class="btn btn-primary" style="width:100%;margin-bottom:8px;">Finish setup</button>
      <button id="ob-banner-skip" class="btn btn-ghost" style="font-size:13px;padding:10px 16px;width:100%;margin-bottom:8px;">Skip for now</button>
      <button id="ob-banner-back" class="btn btn-ghost" style="font-size:13px;padding:6px 16px;width:100%;">← Back</button>
    `;

    if (obBannerDataUrl) applyBannerPreview();

    function applyBannerPreview() {
      const preview = document.getElementById('ob-banner-preview');
      if (!preview || !obBannerDataUrl) return;
      const ph = document.getElementById('ob-banner-placeholder');
      if (ph) ph.style.display = 'none';
      let img = preview.querySelector('img.ob-banner-img');
      if (!img) {
        img = document.createElement('img');
        img.className = 'ob-banner-img';
        img.alt = '';
        img.style.cssText = 'position:absolute;object-fit:fill;';
        preview.appendChild(img);
      }
      img.onload = () => updateBannerPreview(img);
      img.src = obBannerDataUrl;
    }

    function updateBannerPreview(imgEl) {
      const preview = document.getElementById('ob-banner-preview');
      const img = imgEl || preview?.querySelector('img.ob-banner-img');
      if (!img || !img.naturalWidth) return;
      const cW = preview.offsetWidth || 400;
      const cH = preview.offsetHeight || 120;
      const base = Math.max(cW / img.naturalWidth, cH / img.naturalHeight);
      const dW = img.naturalWidth  * base * obBannerZoom;
      const dH = img.naturalHeight * base * obBannerZoom;
      img.style.width  = dW + 'px';
      img.style.height = dH + 'px';
      img.style.left   = -((dW - cW) * obBannerX / 100) + 'px';
      img.style.top    = -((dH - cH) * obBannerY / 100) + 'px';
    }

    document.getElementById('ob-banner-file').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      obBannerDataUrl = await compressImage(file, 2200, 0.92);
      applyBannerPreview();
      document.getElementById('ob-banner-sliders').style.display = '';
      const btn = document.getElementById('ob-banner-btn');
      if (btn) btn.innerHTML = '<i class="ti ti-upload" style="font-size:15px;margin-right:6px;"></i>Change banner';
    });
    document.getElementById('ob-banner-btn').addEventListener('click', () => document.getElementById('ob-banner-file').click());

    document.getElementById('ob-banner-zoom')?.addEventListener('input', e => { obBannerZoom = parseFloat(e.target.value); updateBannerPreview(); });
    document.getElementById('ob-banner-x')?.addEventListener('input',    e => { obBannerX    = parseFloat(e.target.value); updateBannerPreview(); });
    document.getElementById('ob-banner-y')?.addEventListener('input',    e => { obBannerY    = parseFloat(e.target.value); updateBannerPreview(); });

    document.getElementById('ob-banner-done').addEventListener('click', () => finishOnboarding());
    document.getElementById('ob-banner-skip').addEventListener('click', () => finishOnboarding());
    document.getElementById('ob-banner-back').addEventListener('click', renderStepPhoto);
  }

  /* ---- Finish ----
     Photos upload to Storage first (each independent of the other), then
     everything (name + resulting photo URLs) is written to Firestore in
     one go. A failed photo upload never blocks the name, and never
     blocks the other photo — each failure just surfaces its own toast. */
  async function finishOnboarding() {
    overlay.remove();
    /* Fire immediately, before the (possibly slower) work below — the
       install prompt shouldn't wait on network/upload/save latency. */
    try { showInstallPrompt(); } catch (e) { console.error('Install prompt error:', e); }

    const textData = {};
    if (obFirstName) textData.firstName = obFirstName;
    if (obLastName)  textData.lastName  = obLastName;

    const data = { ...textData };

    if (obAvatarDataUrl) {
      try {
        data.avatarPhotoUrl = await uploadToStorage(obAvatarDataUrl, `avatars/${user.uid}`);
        data.avatarZoom = obAvatarZoom;
        data.avatarPosX = obAvatarX;
        data.avatarPosY = obAvatarY;
      } catch (e) {
        console.error('Avatar upload failed:', e);
        showToast('Couldn’t upload your profile photo — you can add it later in Settings.');
      }
    }
    if (obBannerDataUrl) {
      try {
        data.bannerUrl = await uploadToStorage(obBannerDataUrl, `banners/${user.uid}`);
        data.bannerZoom = obBannerZoom;
        data.bannerPosX = obBannerX;
        data.bannerPosY = obBannerY;
      } catch (e) {
        console.error('Banner upload failed:', e);
        showToast('Couldn’t upload your profile banner — you can add it later in Settings.');
      }
    }

    const ref = db.collection('users').doc(user.uid).collection('settings').doc('main');
    if (Object.keys(data).length) {
      try {
        await ref.set(data, { merge: true });
      } catch (e) {
        console.error('Onboarding save failed:', e);
        showToast('Couldn’t save your profile — you can update it later in Settings.');
        // Keep at least the text fields so a failed write doesn't lose the name.
        if (Object.keys(textData).length) {
          try { await ref.set(textData, { merge: true }); } catch (_) {}
        }
      }
    }

    if (data.avatarPhotoUrl) {
      applyNavAvatar(user, null, null, null, null, data.avatarPhotoUrl, obAvatarZoom, obAvatarX, obAvatarY);
    }
  }

  renderStepName();
}

/* ===== "ADD TO HOME SCREEN" PROMPT ================================
   Shown once, right after a new account finishes onboarding. Asks if
   they want to install the app to their home screen; "Yes" reveals a
   short step-by-step, "Skip" just dismisses. Skipped automatically if
   we're already running as an installed (standalone) app. */
function showInstallPrompt() {
  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    window.navigator.standalone === true;
  if (isStandalone) return; // already installed — nothing to prompt

  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  const card = document.createElement('div');
  card.className = 'onboarding-card install-card';
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  function renderAsk() {
    card.innerHTML = `
      <div class="eyebrow">One last thing</div>
      <h2 class="title" style="margin:6px 0 8px;">Add IronGladiator to your Home Screen</h2>
      <p class="sub" style="margin-bottom:24px;">Install the app for one-tap access — it opens full-screen like a real app, no browser bar.</p>
      <button id="install-yes" class="btn btn-primary" style="width:100%;margin-bottom:14px;">Yes, show me how</button>
      <div style="text-align:center;">
        <button id="install-skip" class="btn btn-ghost" style="width:auto;font-size:12px;padding:6px 14px;">Skip for now</button>
      </div>
    `;
    document.getElementById('install-yes').addEventListener('click', renderSteps);
    document.getElementById('install-skip').addEventListener('click', close);
  }

  function renderSteps() {
    card.innerHTML = `
      <div class="eyebrow">Add to Home Screen</div>
      <h2 class="title" style="margin:6px 0 18px;">Four quick steps</h2>
      <ol class="install-steps">
        <li class="install-step"><span class="install-step-num">1</span><span class="install-step-text">Tap the <strong>three dots</strong></span></li>
        <li class="install-step"><span class="install-step-num">2</span><span class="install-step-text">Tap <strong>Share</strong></span></li>
        <li class="install-step"><span class="install-step-num">3</span><span class="install-step-text">Tap <strong>View more</strong></span></li>
        <li class="install-step"><span class="install-step-num">4</span><span class="install-step-text">Tap <strong>Add to Home Screen</strong></span></li>
      </ol>
      <button id="install-done" class="btn btn-primary" style="width:100%;">Got it</button>
    `;
    document.getElementById('install-done').addEventListener('click', close);
  }

  renderAsk();
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
  if (e.currentTarget.getAttribute('href') === '#') {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ===== AUTH — SIGN IN / SIGN UP / SIGN OUT ========================
   Firebase watches auth state automatically — we just react to it. */

let isSignedIn      = false;  // used by scroll-trigger below
let authPromptShown = false;  // only auto-prompt once per page load

/* Is this the home page (the one page that hosts the login-wall gate)?
   Every other page bounces here when signed out. */
function isIndexPage() {
  const p = location.pathname.replace(/\/+$/, '').toLowerCase();
  return p === '' || p === '/index' || p.endsWith('/index.html');
}

auth.onAuthStateChanged(user => {
  try { localStorage.setItem('ig-signedin-guess', user ? '1' : '0'); } catch (e) {}
  document.documentElement.toggleAttribute('data-guess-signedin', !!user);
  if (user) {
    /* ---- Signed in ---- */
    document.documentElement.removeAttribute('data-authgate-pending');
    document.documentElement.removeAttribute('data-authredirect');
    isSignedIn = true;
    currentUser = user;
    authScreen.style.display   = 'none';
    mainContent.style.display  = '';
    navSignedOut.style.display = 'none';
    navSignedIn.style.display  = 'flex';
    navSignedIn.style.opacity  = '0';
    navUserName.textContent = user.displayName || user.email.split('@')[0];
    requestAnimationFrame(() => requestAnimationFrame(() => { navSignedIn.style.opacity = '1'; }));
    /* Home page only: swap the marketing hero for the personal status
       header now that there's an actual account to show data for. */
    const homeHero = document.getElementById('homeHero');
    const homeHeader = document.getElementById('homeStatusHeader');
    const homeWelcomeName = document.getElementById('homeWelcomeName');
    const homeBrandHeader = document.querySelector('.mobile-brand-header');
    if (homeHero)   homeHero.style.display = 'none';
    if (homeHeader) homeHeader.style.display = 'block';
    if (homeBrandHeader) homeBrandHeader.style.display = 'none';
    if (homeWelcomeName) homeWelcomeName.textContent = user.displayName || user.email.split('@')[0];
    db.doc(`users/${user.uid}/settings/main`).get().then(snap => {
      const d = snap.exists ? snap.data() : {};
      applyNavAvatar(user, d.avatarId || null, d.avatarRingColor || null, d.avatarBgColor || null, d.avatarIconColor || null, d.avatarPhotoUrl || null, d.avatarZoom != null ? d.avatarZoom : null, d.avatarPosX != null ? d.avatarPosX : null, d.avatarPosY != null ? d.avatarPosY : null, true);
    }).catch(() => { applyNavAvatar(user, null, null, null, null, null, null, null, null, true); });
    initApp(user.uid);
    if (location.hash) setTimeout(() => {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, 900);
  } else {
    /* ---- Signed out — hard login wall ----
       The home page shows the auth card as a mandatory full-screen gate.
       dashboard/training (the other app.js pages) bounce to the home gate,
       so nothing in the app is reachable while signed out. */
    isSignedIn = false;
    if (!isIndexPage()) { location.replace('/index.html'); return; }
    document.documentElement.removeAttribute('data-guess-signedin');
    document.documentElement.setAttribute('data-authgate-pending', '1'); // keep app content hidden behind the gate
    mainContent.style.display  = 'none';
    navSignedIn.style.display  = 'none';
    navSignedOut.style.display = '';
    switchAuthTab('signin');
    authScreen.style.display   = ''; // reveal the gate (CSS base rule is display:flex)
  }
});

/* ---- Auth modal open / close ---- */
function openAuthModal()  { authScreen.style.display = ''; }
function closeAuthModal() { authScreen.style.display = 'none'; authPromptShown = true; }

/* ---- Auth modal Sign In / Create Account tabs ---- */
function switchAuthTab(which) {
  document.querySelectorAll('#authTabs .page-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.apanel === which);
  });
  document.querySelectorAll('#auth-screen .page-tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === which);
  });
}
document.querySelectorAll('#authTabs .page-tab').forEach(btn => {
  btn.addEventListener('click', () => switchAuthTab(btn.dataset.apanel));
});

document.getElementById('navSignIn').addEventListener('click', () => {
  switchAuthTab('signin');
  openAuthModal();
});
document.getElementById('navSignUp').addEventListener('click', () => {
  switchAuthTab('signup');
  openAuthModal();
  setTimeout(() => { const el = document.getElementById('authEmailUp'); if (el) el.focus(); }, 60);
});
/* No close button / backdrop-dismiss: when signed out the auth card is a
   mandatory gate, not a dismissable modal (the ✕ is hidden via CSS too). */

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
  const email    = document.getElementById('authEmailIn').value.trim();
  const password = document.getElementById('authPasswordIn').value;
  authError.textContent = '';
  if (!email || !password) { authError.textContent = 'Please enter your email and password.'; return; }
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => { authError.textContent = friendlyError(err.code); });
});

/* Email sign-up (create account) */
document.getElementById('emailSignUp').addEventListener('click', () => {
  const email    = document.getElementById('authEmailUp').value.trim();
  const password = document.getElementById('authPasswordUp').value;
  authError.textContent = '';
  if (!email || !password) { authError.textContent = 'Please enter an email and password.'; return; }
  if (password.length < 6)  { authError.textContent = 'Password must be at least 6 characters.'; return; }
  auth.createUserWithEmailAndPassword(email, password)
    .then(r => { showOnboardingModal(r.user); })
    .catch(err => { authError.textContent = friendlyError(err.code); });
});

/* Sign out */
document.getElementById('signOut').addEventListener('click', () => auth.signOut());

/* Custom lift dropdown — bypasses unreliable native datalist on mobile.
   Defined here but only wired up from inside initApp() (see initLiftPicker
   call near the other training-page inits): #logLift/#liftDropdownList/
   #liftCatPills all live inside #main-content, which soft-nav destroys and
   recreates on every Training navigation. A one-time top-level attachment
   would go dead after the first swap, same as the bodyweight-controls
   gotcha documented below. */
function initLiftPicker() {
  if (window.__igLiftPickerCleanup) { window.__igLiftPickerCleanup(); window.__igLiftPickerCleanup = null; }

  const input     = document.getElementById('logLift');
  const btn       = document.getElementById('liftDropdownBtn');
  const list      = document.getElementById('liftDropdownList');
  const pillsWrap = document.getElementById('liftCatPills');
  if (!input || !btn || !list) return;

  /* Detach native datalist so only our custom dropdown shows */
  input.removeAttribute('list');

  let activeCat = '';

  function allLifts() {
    return Array.from(document.querySelectorAll('#lift-options option')).map(o => ({
      value: o.value,
      cat: o.dataset.cat || ''
    }));
  }

  function render(filter) {
    const q   = (filter || '').toLowerCase();
    const opts = allLifts().filter(o =>
      (!activeCat || o.cat === activeCat) && (!q || o.value.toLowerCase().includes(q))
    );
    list.innerHTML = opts.length
      ? opts.map(o => `<div class="lift-opt">${o.value}</div>`).join('')
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

  if (pillsWrap) {
    pillsWrap.querySelectorAll('.log-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        pillsWrap.querySelectorAll('.log-cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCat = pill.dataset.cat || '';
        input.value = '';
        open();
        input.focus();
      });
    });
  }

  input.addEventListener('focus', () => open());
  input.addEventListener('input', () => { if (isOpen()) render(input.value); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  const outsideHandler = e => {
    if (!e.target.closest('.lift-wrap') && !e.target.closest('#liftCatPills')) close();
  };
  document.addEventListener('pointerdown', outsideHandler);
  window.__igLiftPickerCleanup = () => document.removeEventListener('pointerdown', outsideHandler);
}

/* Sets/Reps/Weight tap-to-adjust +/- steppers on the training log form.
   Re-queries .log-stepper wrappers fresh each call — safe to call
   repeatedly on soft-nav reactivation since it only attaches listeners
   directly to freshly-created nodes (no document-level listener to leak). */
function initLogSteppers() {
  document.querySelectorAll('.log-stepper').forEach(wrap => {
    const targetId = wrap.dataset.target;
    const inputEl  = document.getElementById(targetId);
    if (!inputEl) return;
    const step = +wrap.dataset.step || 1;
    const min  = wrap.dataset.min !== undefined ? +wrap.dataset.min : null;
    const max  = wrap.dataset.max !== undefined ? +wrap.dataset.max : null;
    wrap.querySelectorAll('.log-stepper-btn').forEach(stepBtn => {
      stepBtn.addEventListener('click', () => {
        if (inputEl.disabled || inputEl.type !== 'number') return;
        const dir  = +stepBtn.dataset.dir;
        let base   = parseFloat(inputEl.value);
        if (isNaN(base)) base = 0;
        let next = base + step * dir;
        if (min !== null) next = Math.max(min, next);
        if (max !== null) next = Math.min(max, next);
        inputEl.value = next;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  });
}

function initBodyweightDatePicker() {
  const d = document.getElementById('bwDate');
  if (!d) return;
  createDatePicker('bwDate', d.value || localDateISO());
}

initBodyweightDatePicker();

/* ===== BODYWEIGHT: month nav + log submit =========================
   Registered inside initApp() (called below, and again from initApp
   itself) rather than once at top level — soft-nav swaps replace
   #main-content's innerHTML on every Training navigation, destroying
   and recreating these buttons. A listener attached once at module
   load targets a node that no longer exists after the first swap,
   leaving Log weight (and the month/page nav arrows) permanently dead
   until a full page reload — the button looks broken with zero
   feedback because there's no listener on it at all anymore. */
function initBodyweightControls() {
  document.getElementById('bwPrev')?.addEventListener('click', () => {
    const [yr, mo] = bwCurrentMonth.split('-').map(Number);
    const d = new Date(yr, mo - 2, 1);
    bwCurrentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    bwCurrentPage = 1;
    renderBodyweight();
  });
  document.getElementById('bwNext')?.addEventListener('click', () => {
    const [yr, mo] = bwCurrentMonth.split('-').map(Number);
    const d = new Date(yr, mo, 1);
    bwCurrentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    bwCurrentPage = 1;
    renderBodyweight();
  });
  document.getElementById('bw-prev')?.addEventListener('click', () => {
    if (bwCurrentPage > 1) { bwCurrentPage--; renderBodyweight(); }
  });
  document.getElementById('bw-next')?.addEventListener('click', () => {
    const monthCount = bwAllEntries.filter(e => e.date && e.date.startsWith(bwCurrentMonth)).length;
    const totalBWPages = Math.max(1, Math.ceil(monthCount / BW_PAGE_SIZE));
    if (bwCurrentPage < totalBWPages) { bwCurrentPage++; renderBodyweight(); }
  });
  document.getElementById('bwSubmit')?.addEventListener('click', async () => {
    /* Every one of these guards used to fail completely silently — tap
       the button while a fresh sign-in was still resolving, or with no
       weight typed in, and nothing happened at all with no error, no
       toast, nothing to explain why. Indistinguishable from a dead
       button. */
    if (!currentUser) { showToast('Still signing you in — try again in a moment.'); return; }
    const weightVal = parseFloat(document.getElementById('bwInput').value);
    const dateVal   = document.getElementById('bwDate').value;
    if (!weightVal || weightVal <= 0) { showToast('Enter a valid weight first.'); return; }
    if (!dateVal) { showToast('Pick a date first.'); return; }
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
}

/* ── TOAST NOTIFICATIONS ──────────────────────────────────────────────────── */
function showToast(message, type = 'error') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  /* Entrance is a CSS @keyframes animation (see .toast in styles.css) that
     plays automatically on insert -- deliberately not a class-toggled
     transition, since that needs a real requestAnimationFrame to avoid
     the browser coalescing the before/after styles into one paint and
     skipping the animation, and rAF doesn't reliably fire in every
     context (e.g. backgrounded/inactive tabs). Exit re-uses opacity via
     .toast-out, which is safe as a plain transition since by then the
     element has already painted at least one visible frame. */
  setTimeout(() => {
    el.classList.add('toast-out');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 500); // fallback if transitionend never fires
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
    'auth/invalid-login-credentials': 'Email or password is incorrect. If you originally signed up with Google, use "Continue with Google" instead, or set a password in Settings once you’re signed in.',
  })[code] || 'Something went wrong. Please try again.';
}

/* ===== CUSTOM DATE PICKER =========================================
   Self-contained white calendar widget — no external libraries.
   Hides the native <input type="date"> and replaces it with a
   styled trigger button + dropdown calendar built from scratch. */
function createDatePicker(inputId, initialDate) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const existingWrap = input.closest('.dp-wrap');
  if (existingWrap && existingWrap.querySelector('.dp-trigger')) {
    if (!input.value) input.value = initialDate || localDateISO();
    return;
  }

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
  input.dataset.datePickerReady = '1';

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
let unsubscribeDaily      = null;
let unsubscribeWeekly     = null;
let unsubscribeXP         = null;

let bwCurrentMonth = localDateISO().slice(0, 7); // YYYY-MM
let bwAllEntries   = [];
let bwCurrentPage  = 1;
const BW_PAGE_SIZE = 6;

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

  /* Entry list (newest first) with pagination */
  if (list) {
    const reversed = entries.slice().reverse();
    const totalBWPages = Math.max(1, Math.ceil(reversed.length / BW_PAGE_SIZE));
    if (bwCurrentPage > totalBWPages) bwCurrentPage = totalBWPages;
    const bwStart = (bwCurrentPage - 1) * BW_PAGE_SIZE;
    const bwPage  = reversed.slice(bwStart, bwStart + BW_PAGE_SIZE);

    if (reversed.length) {
      list.innerHTML = bwPage.map(e => {
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

    const pag  = document.getElementById('bw-pagination');
    const pi   = document.getElementById('bw-page-info');
    const bpv  = document.getElementById('bw-prev');
    const bpn  = document.getElementById('bw-next');
    if (pag) {
      if (reversed.length > BW_PAGE_SIZE) {
        pag.style.display = '';
        if (pi)  pi.textContent  = `Page ${bwCurrentPage} of ${totalBWPages}`;
        if (bpv) bpv.disabled    = bwCurrentPage <= 1;
        if (bpn) bpn.disabled    = bwCurrentPage >= totalBWPages;
      } else {
        pag.style.display = 'none';
      }
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
  /* Re-activation hook for soft-nav: after the router swaps in a new
     page's content, it calls this to re-wire elements + re-subscribe
     listeners for the new page. Safe to call repeatedly — initApp tears
     down prior listeners immediately below. Captures the live uid. */
  window.__IG_activate = function () { initApp(uid); };

  /* Home page only: the marketing-hero/status-header swap itself is
     CSS-driven off the persistent html[data-guess-signedin] attribute, so
     it survives a soft-nav swap with no JS needed. The welcome name text
     has no CSS equivalent though — the swapped-in element is fresh, empty
     markup each time — so it's explicitly re-applied here. */
  const homeWelcomeName = document.getElementById('homeWelcomeName');
  if (homeWelcomeName && currentUser) {
    homeWelcomeName.textContent = currentUser.displayName || currentUser.email.split('@')[0];
  }

  /* Tear down any listeners left from a previous session */
  if (unsubscribeSessions)   { unsubscribeSessions();   unsubscribeSessions   = null; }
  if (unsubscribeSettings)   { unsubscribeSettings();   unsubscribeSettings   = null; }
  if (unsubscribeBodyweight) { unsubscribeBodyweight(); unsubscribeBodyweight = null; }
  if (unsubscribeDaily)      { unsubscribeDaily();      unsubscribeDaily      = null; }
  if (unsubscribeWeekly)     { unsubscribeWeekly();     unsubscribeWeekly     = null; }
  if (unsubscribeXP)         { unsubscribeXP();         unsubscribeXP         = null; }
  bwAllEntries = [];

  /* Shorthand helpers for this user's Firestore sub-collections */
  const sessionsRef = () => db.collection('users').doc(uid).collection('sessions');
  const settingsRef = () => db.collection('users').doc(uid).collection('settings').doc('main');

  let goalsDonePage = 1;
  let goalsDoneFilter = 'all';
  let goalsAddOpen = false;
  let goalsAddSteps = 1;
  let goalsEditIdx = -2;
  const GOALS_DONE_PAGE = 5;

  let calViewYear = new Date().getFullYear();
  let calViewMonth = new Date().getMonth();

  /* _igGoalsCache (declared at true top level, near db/auth/storage) holds
     whatever goals data was last confirmed — unlike this function's own
     local state, it survives across repeated initApp() calls, so a
     soft-nav arrival at a page that shows goals paints them immediately
     instead of an empty list while the settings listener re-subscribes.
     Cold start (nothing cached yet) still renders null, same as before. */
  renderGoals(_igGoalsCache);
  loadHomeCrewStrip(uid);

  document.getElementById('calPrev')?.addEventListener('click', () => {
    calViewMonth--;
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
    renderCalendar();
  });
  document.getElementById('calNext')?.addEventListener('click', () => {
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

  /* Single source of truth for muscle-group colors.
     Reads the live CSS variable that applyColors() maintains — the SAME
     variable the pills use in styles.css. This guarantees the donut, calendar,
     popover and pills can never show different colors for the same group, and
     that they always reflect the user's saved settings regardless of whether
     the sessions listener or the settings listener rendered first. */
  function normalizeLiftCls(cls) {
    if (!cls) return '';
    const key = String(cls).toLowerCase().trim();
    if (key === 'legs') return 'squat';
    if (key === 'chest') return 'bench';
    if (key === 'back') return 'dead';
    if (key === 'press' || key === 'arms' || key === 'shoulders') return 'arm';
    if (key === 'abs' || key === 'ab' || key === 'abs/core') return 'core';
    return key;
  }

  function colorKeyForCls(cls) {
    const normalized = normalizeLiftCls(cls);
    return normalized === 'arm' ? 'press' : normalized;   // Arms share the saved 'press' color
  }

  function overviewCalendarCls(cls) {
    const normalized = normalizeLiftCls(cls);
    return normalized === 'core' ? '' : normalized;
  }

  function clsColor(cls) {
    const key = colorKeyForCls(cls);
    const v = getComputedStyle(document.documentElement)
                .getPropertyValue(`--${key}`).trim();
    return v || '#9AA0AC';                        // 'other'/unknown → neutral grey
  }

  function getDonutColor(cls) {
    return clsColor(cls);
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
        const cls = normalizeLiftCls(s.cls || liftToCls(s.lift) || 'other');
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
    const pag     = document.getElementById('history-pagination');
    if (!sel || !svg) return;

    const lifts = [...new Set(sessions.filter(s => s.lift).map(s => s.lift))].sort();
    sel.innerHTML = lifts.length
      ? lifts.map(l => `<option value="${l}"${l === historySelectedLift ? ' selected' : ''}>${l}</option>`).join('')
      : '<option value="">Log sessions to see history</option>';

    if (lifts.length && (!historySelectedLift || !lifts.includes(historySelectedLift))) {
      historySelectedLift = lifts[0];
      historyPage = 1;
    }
    if (historySelectedLift && lifts.includes(historySelectedLift)) sel.value = historySelectedLift;
    if (!lifts.length) {
      historySelectedLift = '';
      historyPage = 1;
      svg.innerHTML = '';
      if (details) details.innerHTML = '';
      if (empty)   empty.style.display = '';
      if (note)    note.textContent = '';
      if (pag)     pag.style.display = 'none';
      return;
    }

    function draw(liftName) {
      if (!liftName) return;
      historySelectedLift = liftName;

      const allLiftSessions = sessions
        .filter(s => s.lift === liftName && s.dateRaw)
        .sort((a, b) => a.dateRaw.localeCompare(b.dateRaw));
      const totalPages = Math.max(1, Math.ceil(allLiftSessions.length / PAGE_SIZE));
      if (historyPage > totalPages) historyPage = totalPages;
      if (historyPage < 1) historyPage = 1;
      const newestFirst = allLiftSessions.slice().reverse();
      const pageRows = newestFirst.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE);
      const liftSessions = pageRows.slice().reverse();

      if (!liftSessions.length) {
        svg.innerHTML = '';
        if (details) details.innerHTML = '';
        if (empty)   empty.style.display = '';
        if (note)    note.textContent = '';
        if (pag)     pag.style.display = 'none';
        return;
      }
      if (empty) empty.style.display = 'none';
      if (note)  note.textContent = `${allLiftSessions.length} total session${allLiftSessions.length !== 1 ? 's' : ''}`;

      const historyCls = normalizeLiftCls(liftSessions[0]?.cls || liftToCls(liftName) || 'other');
      const historyColor = clsColor(historyCls);

      /* Bodyweight lifts have no meaningful weight to chart — plot reps instead */
      const isBwLift = liftSessions.every(s => s.bodyweight);
      const metricOf = s => isTimedSession(s) ? (s.timeSeconds || 0) : (isBwLift ? s.reps : s.wt);

      const W = 700, H = window.innerWidth < 640 ? 320 : 240;
      const padL = 52, padR = 24, padT = 24, padB = 52;
      const chartW = W - padL - padR, chartH = H - padT - padB;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

      const weights = liftSessions.map(metricOf);
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

      const coords = liftSessions.map((s, i) => `${xOf(i).toFixed(1)},${yOf(metricOf(s)).toFixed(1)}`);
      const area   = `M${xOf(0).toFixed(1)},${(padT + chartH).toFixed(1)} L${coords.join(' L')} L${xOf(n-1).toFixed(1)},${(padT+chartH).toFixed(1)}Z`;

      let dots = '', labels = '', vlines = '';
      liftSessions.forEach((s, i) => {
        const x = xOf(i).toFixed(1), y = yOf(metricOf(s)).toFixed(1);
        const [, m, d] = s.dateRaw.split('-').map(Number);
        const lbl = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}`;
        vlines += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${(padT + chartH).toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
        dots   += `<circle cx="${x}" cy="${y}" r="5" fill="${historyColor}" stroke="var(--bg)" stroke-width="2.5"/>`;
        labels += `<text x="${x}" y="${H - 10}" text-anchor="middle" class="axis-label">${lbl}</text>`;
      });

      svg.innerHTML =
        `<defs><linearGradient id="hgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${historyColor}" stop-opacity="0.26"/>
          <stop offset="100%" stop-color="${historyColor}" stop-opacity="0"/>
        </linearGradient></defs>` +
        `<rect x="${padL}" y="${padT}" width="${chartW}" height="${chartH}" rx="3" fill="rgba(255,255,255,0.04)"/>` +
        grid + vlines +
        `<path d="${area}" fill="url(#hgrad)"/>` +
        `<path d="M${coords.join(' L')}" fill="none" stroke="${historyColor}"
               stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` +
        dots + labels;

      if (details) {
        details.innerHTML = pageRows.map(s => `
          <div class="history-detail-row">
            <span class="history-date">${fmtDateDisplay(s.dateRaw)}</span>
            <span class="history-wt">${s.bodyweight ? 'Bodyweight' : s.wt + ' lbs'}</span>
            <span class="history-reps">${s.sets} × ${repMetricText(s)}</span>
            <span class="history-note${s.note ? ' has-note' : ''}">${s.note ? '★ ' + s.note : '—'}</span>
          </div>`).join('');
      }
      if (pag) {
        if (allLiftSessions.length > PAGE_SIZE) {
          pag.style.display = '';
          const pi = document.getElementById('history-page-info');
          const hp = document.getElementById('history-prev');
          const hn = document.getElementById('history-next');
          if (pi) pi.textContent = `Page ${historyPage} of ${totalPages}`;
          if (hp) hp.disabled = historyPage <= 1;
          if (hn) hn.disabled = historyPage >= totalPages;
        } else {
          pag.style.display = 'none';
        }
      }
    }

    sel.onchange = () => { historyPage = 1; draw(sel.value); };
    if (lifts.length) draw(historySelectedLift || lifts[0]);
  }

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
    if (['overhead press','ohp','shoulder press','arnold press','lateral raise','db lateral raise','cable lateral raise','machine lateral raise',
         'rear delt raise','front raise','face pull',
         'tricep pushdown','single arm tricep pushdown','db tricep extension','cable tricep extension','machine tricep extension',
         'overhead tricep','skull crusher','close grip bench','jm press',
         'bicep curl','db bicep curl','cable bicep curl','machine bicep curl','hammer curl','preacher curl','concentration curl'].includes(n)) return 'arm';
    if (['leg extension','leg curl','seated hamstring curl','lying hamstring curl','calf raise','adductors','abductors'].includes(n)) return 'squat';
    /* Core is a secondary/accessory group — its own cls so it reads
       distinctly across the app, but kept out of the main-lift analytics
       (Big-3, lift-breakdown bars, calendar paint palette). */
    if (['crunch','sit-up','cable crunch','hanging leg raise','lying leg raise','plank','side plank',
         'russian twist','bicycle crunch','ab wheel rollout','cable woodchopper','hollow hold'].includes(n)) return 'core';
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
  let historyPage = 1;
  let currentPage = 1;
  const PAGE_SIZE = 6;

  /* Muscle recovery card state (declared here so guest-mode renderMuscleMap() can access them) */
  let mrWidgetFront = null;
  let mrWidgetBack  = null;
  const MR_GENDER_KEY = 'ig-muscle-recovery-gender';
  function mrValidGender(gender) {
    return gender === 'male' || gender === 'female';
  }
  function mrSavedGender() {
    try {
      const saved = localStorage.getItem(MR_GENDER_KEY);
      if (mrValidGender(saved)) return saved;
    } catch (_) {}
    return 'male';
  }
  function mrPersistGender(gender) {
    try { localStorage.setItem(MR_GENDER_KEY, gender); } catch (_) {}
  }
  let mrGender = mrSavedGender();
  let mrSkin   = 0;
  let mrHairColor = 'rgb(26,18,8)';
  let mrHighlights = {};
  let mrLibraryLoading = false;
  const MR_SKIN_TONES = [
    'rgb(245,201,160)', 'rgb(212,149,106)', 'rgb(156,100,64)', 'rgb(92,51,32)',
  ];
  const MR_HAIR_COLORS = [
    'rgb(26,18,8)', 'rgb(74,44,26)', 'rgb(196,152,40)', 'rgb(224,219,212)',
  ];
  /* Coarse fallback — one muscle set per lift *class*. Used for custom
     lifts and manually color-painted calendar days, where all we know is
     the broad category (squat / bench / dead / arm). */
  const LIFT_CLS_TO_MUSCLES = {
    squat: ['quadriceps', 'gluteal', 'hamstring', 'calves'],
    bench: ['chest', 'deltoids', 'triceps'],
    dead:  ['upper-back', 'lower-back', 'trapezius', 'hamstring'],
    arm:   ['biceps', 'triceps', 'deltoids', 'forearm'],
    core:  ['abs', 'obliques'],
  };

  /* Precise per-exercise targeting for the recovery map. Keyed by the same
     normalized lift names liftToCls() recognizes, so a bicep curl lights up
     biceps (not the whole "arm" bucket) and a row lights up back (not the
     hamstrings the old "dead" bucket implied).

     IMPORTANT: only slugs in MuscleMapJS.BASE_MUSCLES (plus the always-
     visible sub-groups "adductors"/"neck") actually render — sub-group
     slugs like "upper-chest" or "front-deltoid" are hidden by default and
     would silently no-op, so they are deliberately avoided here. */
  const M = {
    squatPattern: ['quadriceps', 'gluteal', 'hamstring', 'adductors'],
    hinge:        ['hamstring', 'gluteal', 'lower-back'],
    press:        ['chest', 'triceps', 'deltoids'],
    fly:          ['chest', 'deltoids'],
    rowPull:      ['upper-back', 'trapezius', 'biceps'],
    verticalPull: ['upper-back', 'biceps', 'forearm'],
    ohp:          ['deltoids', 'triceps', 'trapezius'],
    lateral:      ['deltoids'],
    rearDelt:     ['deltoids', 'upper-back', 'trapezius'],
    tri:          ['triceps'],
    bi:           ['biceps', 'forearm'],
  };
  const LIFT_TO_MUSCLES = {};
  const mapLifts = (names, muscles) => names.forEach(n => { LIFT_TO_MUSCLES[n] = muscles; });

  mapLifts(['squat','split squat','bulgarian split squats','hack squat','pendulum squat',
            'bw squat','smith squat','leg press','lunges'], M.squatPattern);
  mapLifts(['hip thrust'], ['gluteal', 'hamstring']);
  mapLifts(['rdl','deadlift','rack pull'], ['hamstring', 'gluteal', 'lower-back', 'trapezius', 'quadriceps']);
  mapLifts(['leg extension'], ['quadriceps']);
  mapLifts(['leg curl','seated hamstring curl','lying hamstring curl'], ['hamstring']);
  mapLifts(['calf raise'], ['calves']);
  mapLifts(['adductors'], ['adductors']);
  mapLifts(['abductors'], ['gluteal']);

  mapLifts(['bench','bench press','incline press','db flat press','db incline press',
            'machine chest press','decline chest press','dips','push-up'], M.press);
  mapLifts(['chest fly','low chest fly','mid chest fly','high chest fly','pec dec'], M.fly);

  mapLifts(['row','barbell row','cable row','chest supported row','machine row','t-bar row'], M.rowPull);
  mapLifts(['pulldown','lat pulldown','machine lat pulldown','cable lat pulldown','pull-up'], M.verticalPull);
  mapLifts(['lat pullover'], ['upper-back', 'chest']);
  mapLifts(['shrugs'], ['trapezius']);

  mapLifts(['overhead press','ohp','shoulder press','arnold press'], M.ohp);
  mapLifts(['lateral raise','db lateral raise','cable lateral raise','machine lateral raise','front raise'], M.lateral);
  mapLifts(['rear delt raise','face pull'], M.rearDelt);
  mapLifts(['tricep pushdown','single arm tricep pushdown','db tricep extension','cable tricep extension',
            'machine tricep extension','overhead tricep','skull crusher'], M.tri);
  mapLifts(['close grip bench','jm press'], ['triceps', 'chest', 'deltoids']);
  mapLifts(['bicep curl','db bicep curl','cable bicep curl','machine bicep curl',
            'hammer curl','preacher curl','concentration curl'], M.bi);

  mapLifts(['crunch','sit-up','cable crunch','hanging leg raise','lying leg raise',
            'plank','ab wheel rollout','hollow hold'], ['abs']);
  mapLifts(['russian twist','side plank','bicycle crunch','cable woodchopper'], ['abs', 'obliques']);

  /* Precise muscles for a lift; falls back to the coarse class set for
     custom/unknown lifts (which still carry a squat/bench/dead/arm cls). */
  function liftToMuscles(lift, cls) {
    const n = (lift || '').toLowerCase().trim();
    return LIFT_TO_MUSCLES[n] || LIFT_CLS_TO_MUSCLES[cls] || [];
  }

  /* ---- Guest mode: render empty card shells for signed-out visitors ----
     All render functions below are function declarations so they're
     hoisted and safe to call here before their definition sites.    */
  if (!uid) {
    currentSettings = {};
    applyUnit('lbs');
    updateKPIs();
    renderCalendar();
    renderFreq();
    renderMuscleMap();
    renderTracker();
    renderLog([]);
    if (typeof igRenderChallenges === 'function') igRenderChallenges(null, null, 0);
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
    const volume     = monthSess.reduce((sum, s) => sum + (s.sets * (isTimedSession(s) ? 1 : s.reps) * s.wt), 0);
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
    set('nav-streak-count', streak || '0');
    set('kpi-big3',     big3 ? big3.toLocaleString() : '—');

    /* Home page status header (no-op elsewhere — elements don't exist) */
    set('homeStatStreak', streak || '0');

    /* Editorial card captions — real month-over-month trend + best-ever streak */
    const setHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

    const lmDate  = new Date(thisYear, thisMonth - 1, 1);
    const lmYear  = lmDate.getFullYear(), lmMonth = lmDate.getMonth();
    const lastMonthDays = new Set(
      currentSessions.filter(ss => {
        if (!ss.dateRaw || ss.isRestDay) return false;
        const [y, m] = ss.dateRaw.split('-').map(Number);
        return y === lmYear && (m - 1) === lmMonth;
      }).map(ss => ss.dateRaw)
    ).size;
    const monthTrend = daysLifted - lastMonthDays;

    let bestStreak = 0, run = 0, prevT = null;
    [...activeDays].sort().forEach(iso => {
      const t = new Date(iso + 'T12:00:00').getTime();
      run = (prevT !== null && t - prevT === 86400000) ? run + 1 : 1;
      if (run > bestStreak) bestStreak = run;
      prevT = t;
    });

    if (daysLifted) {
      const trendHtml = monthTrend > 0 ? `<span style="color:var(--up)">+${monthTrend}</span> days on last month`
        : monthTrend < 0 ? `<span style="color:var(--down)">${monthTrend}</span> days on last month`
        : 'even with last month';
      setHTML('kpi-sessions-delta', trendHtml);
    } else {
      setHTML('kpi-sessions-delta', 'Add your first session below');
    }

    if (streak) {
      const bestHtml = bestStreak > streak ? ` · best ${bestStreak}` : ' · personal best!';
      setHTML('kpi-streak-delta', `day${streak !== 1 ? 's' : ''} unbroken${bestHtml}`);
    } else {
      setHTML('kpi-streak-delta', '');
    }
    renderHomeStreakRing(streak);
    set('kpi-big3-delta',     s && big3 ? `${s.squatMax} + ${s.benchMax} + ${s.deadMax} lbs` : 'Set your maxes in Standards below');
    renderHomeSuggested();

    const banner = document.getElementById('welcome-banner');
    if (banner) banner.style.display = currentSessions.filter(s => !s.isRestDay).length === 0 ? 'block' : 'none';
    renderFreq();
    renderMuscleMap();
  }

  /* Home page only: streak progress ring — fills from the last
     milestone crossed toward the next one, rather than a flat percent
     of some single fixed target. */
  const STREAK_MILESTONES = [3, 7, 14, 21, 30, 45, 60, 90, 120, 180, 365];
  function streakMilestoneProgress(streak) {
    let prev = 0, next = STREAK_MILESTONES[0];
    for (const m of STREAK_MILESTONES) {
      if (streak < m) { next = m; break; }
      prev = m; next = m;
    }
    if (streak >= STREAK_MILESTONES[STREAK_MILESTONES.length - 1]) {
      prev = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
      next = prev * 2;
    }
    const pct = next > prev ? Math.min(1, (streak - prev) / (next - prev)) : 1;
    return { next, daysToNext: Math.max(0, next - streak), pct };
  }

  const RING_CIRCUMFERENCE = 2 * Math.PI * 52;

  function renderHomeStreakRing(streak) {
    const ring = document.getElementById('homeStreakRing');
    const sub  = document.getElementById('homeStatBest');
    if (!ring || !sub) return;
    const { next, daysToNext, pct } = streakMilestoneProgress(streak);
    /* An actual SVG stroke with a real linear gradient (matching
       --steel-red, same as the dashboard's weight-plate medallions)
       reads as brushed metal — a CSS conic-gradient sweeping through
       those same colors doesn't, since a gradient cycling around a
       circle has no consistent "light source" and just looks banded. */
    ring.style.strokeDashoffset = (RING_CIRCUMFERENCE * (1 - pct)).toFixed(1);
    sub.textContent = `${daysToNext} day${daysToNext === 1 ? '' : 's'} to next milestone (${next})`;
  }

  /* Home page only: "Suggested" side card — the two lift categories
     with the longest gap since last trained, resolved from the same
     date->group source of truth the overview calendar paints. */
  const SUGGESTED_CATS = ['squat', 'bench', 'dead', 'arm'];
  const SUGGESTED_LABELS = { squat: 'Legs', bench: 'Chest', dead: 'Back', arm: 'Arms' };
  const SUGGESTED_ORDER = SUGGESTED_CATS.reduce((acc, cls, index) => {
    acc[cls] = index;
    return acc;
  }, {});

  function calendarGroupsByDate(sessions = currentSessions, calColors = currentSettings?.calendarColors || {}) {
    const byDate = {};
    (Array.isArray(sessions) ? sessions : []).forEach(s => {
      if (!s || !s.dateRaw || byDate[s.dateRaw]) return;
      const cls = overviewCalendarCls(s.isRestDay ? 'rest' : (s.cls || liftToCls(s.lift) || 'other'));
      if (cls) byDate[s.dateRaw] = cls;
    });
    Object.entries(calColors || {}).forEach(([dateRaw, clsRaw]) => {
      const normalized = normalizeLiftCls(clsRaw);
      if (!normalized) { delete byDate[dateRaw]; return; }
      const cls = overviewCalendarCls(normalized);
      if (cls) byDate[dateRaw] = cls;
    });
    return byDate;
  }

  function rankSuggestedGroups(sessions, todayISO = localDateISO(), calColors = currentSettings?.calendarColors || {}) {
    const today = new Date(todayISO + 'T12:00:00');
    const lastDate = SUGGESTED_CATS.reduce((acc, cls) => {
      acc[cls] = '';
      return acc;
    }, {});

    Object.entries(calendarGroupsByDate(sessions, calColors)).forEach(([dateRaw, clsRaw]) => {
      if (!dateRaw || dateRaw > todayISO) return;
      const cls = normalizeLiftCls(clsRaw);
      if (!Object.prototype.hasOwnProperty.call(lastDate, cls)) return;
      if (!lastDate[cls] || dateRaw > lastDate[cls]) lastDate[cls] = dateRaw;
    });

    return SUGGESTED_CATS.map(cls => {
      const last = lastDate[cls];
      const days = last
        ? Math.max(0, Math.round((today - new Date(last + 'T12:00:00')) / 86400000))
        : null;
      return { cls, days, last };
    }).sort((a, b) => {
      if (a.days == null && b.days == null) return SUGGESTED_ORDER[a.cls] - SUGGESTED_ORDER[b.cls];
      if (a.days == null) return 1;
      if (b.days == null) return -1;
      return (b.days - a.days) || (SUGGESTED_ORDER[a.cls] - SUGGESTED_ORDER[b.cls]);
    });
  }

  function renderHomeSuggested() {
    const card = document.getElementById('homeSuggested');
    const cols = document.getElementById('homeSuggCols');
    if (!card || !cols) return;

    const ranked = rankSuggestedGroups(currentSessions);

    if (!ranked.length) { card.style.display = 'none'; return; }

    card.style.display = 'flex';
    cols.innerHTML = ranked.slice(0, 2).map(r => `
      <div class="sugg-col">
        <div class="name" style="color:${clsColor(r.cls)};">${SUGGESTED_LABELS[r.cls]}</div>
        <div class="days2">${r.days == null ? 'not yet' : r.days === 0 ? 'today' : r.days + 'd rest'}</div>
      </div>`).join('');
  }

  /* ---- MUSCLE RECOVERY CARD ------------------------------------------------ */

  function mrDaysColor(days) {
    if (days <= 1) return '#c1272d';
    if (days <= 3) return '#e07020';
    if (days <= 6) return '#c8a800';
    return null;
  }

  function mrBuildStyle() {
    const hc = MR_SKIN_TONES[mrSkin];
    return {
      defaultFillColor: 'rgb(52,58,68)',
      strokeColor: 'rgb(30,34,42)', strokeWidth: 0.4,
      selectionColor: '#c1272d', selectionStrokeColor: '#f0565b', selectionStrokeWidth: 2,
      headColor: hc, hairColor: mrHairColor,
      shadowColor: 'transparent', shadowRadius: 0, shadowOffsetX: 0, shadowOffsetY: 0,
    };
  }

  function mrApplyHighlights() {
    [mrWidgetFront, mrWidgetBack].forEach(w => {
      if (!w) return;
      if (typeof w.clearSelection === 'function') {
        try { w.clearSelection(); } catch (_) {}
      }
      w.clearHighlights();
      Object.entries(mrHighlights).forEach(([muscle, color]) => {
        try { w.highlight(muscle, color, 0.92); } catch (_) {}
      });
    });
  }

  function mrSetGender(gender, persist = true) {
    if (!mrValidGender(gender)) gender = 'male';
    mrGender = gender;
    if (persist) {
      mrPersistGender(gender);
      if (uid) {
        settingsRef().set({ muscleRecoveryGender: gender }, { merge: true })
          .catch(err => showToast('Could not save body type — ' + (err?.message || 'check your connection.')));
      }
    }
    document.getElementById('mr-btn-male')?.classList.toggle('active', gender === 'male');
    document.getElementById('mr-btn-female')?.classList.toggle('active', gender === 'female');
    [mrWidgetFront, mrWidgetBack].forEach(w => { if (w) { w.setGender(gender); } });
    mrApplyHighlights();
  }

  function mrSetSkin(idx) {
    mrSkin = idx;
    document.querySelectorAll('#mr-skin-swatches .mr-swatch').forEach((s, i) => s.classList.toggle('active', i === idx));
    const style = mrBuildStyle();
    [mrWidgetFront, mrWidgetBack].forEach(w => { if (w) w.setStyle(style); });
  }

  function mrSetHairColor(idx) {
    mrHairColor = MR_HAIR_COLORS[idx];
    document.querySelectorAll('#mr-hair-swatches .mr-swatch').forEach((s, i) => s.classList.toggle('active', i === idx));
    const style = mrBuildStyle();
    [mrWidgetFront, mrWidgetBack].forEach(w => { if (w) w.setStyle(style); });
  }

  document.getElementById('mr-btn-male')?.addEventListener('click', () => mrSetGender('male'));
  document.getElementById('mr-btn-female')?.addEventListener('click', () => mrSetGender('female'));
  document.querySelectorAll('#mr-skin-swatches .mr-swatch').forEach((el, i) => {
    el.addEventListener('click', () => mrSetSkin(i));
  });
  document.querySelectorAll('#mr-hair-swatches .mr-swatch').forEach((el, i) => {
    el.addEventListener('click', () => mrSetHairColor(i));
  });
  mrSetGender(mrGender, false);

  function mrInitWidget(containerId, side) {
    const container = document.getElementById(containerId);
    if (!mrContainerReady(container)) return null;
    const w = new MuscleMapJS.MuscleMapWidget(container, { gender: mrGender, side, interactive: false });
    w.setStyle(mrBuildStyle());
    if (typeof w.clearSelection === 'function') {
      try { w.clearSelection(); } catch (_) {}
    }
    w.on('muscleEnter', e => {
      const el = document.getElementById('mr-muscle-label');
      if (el) el.textContent = e.displayName || e.muscle;
    });
    w.on('muscleLeave', () => {
      const el = document.getElementById('mr-muscle-label');
      if (el) el.textContent = 'Hover a muscle';
    });
    requestAnimationFrame(() => w.resize());
    return w;
  }

  function mrContainerReady(container) {
    if (!container || !container.isConnected) return false;
    const rect = container.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function mrHasContainers() {
    return !!(document.getElementById('muscle-map-front') && document.getElementById('muscle-map-back'));
  }

  function mrOnLibraryReady() {
    mrLibraryLoading = false;
    renderMuscleMap();
    if (window.__igMuscleMapResizeQueued || mrMusclePanelActive()) {
      window.igResizeMuscleMap();
    }
  }

  function mrEnsureLibrary() {
    if (typeof MuscleMapJS !== 'undefined') return true;
    if (!mrHasContainers()) return false;
    if (mrLibraryLoading) return false;

    const existing = document.querySelector('script[src*="musclemap.js"]');
    if (existing) {
      mrLibraryLoading = true;
      existing.addEventListener('load', mrOnLibraryReady, { once: true });
      existing.addEventListener('error', () => { mrLibraryLoading = false; }, { once: true });
      return false;
    }

    mrLibraryLoading = true;
    const script = document.createElement('script');
    script.src = 'musclemap.js?v=1';
    script.async = true;
    script.onload = mrOnLibraryReady;
    script.onerror = () => { mrLibraryLoading = false; };
    document.head.appendChild(script);
    return false;
  }

  function mrEnsureWidgets() {
    if (!mrEnsureLibrary()) return false;
    if (typeof MuscleMapJS === 'undefined') return false;
    if (!mrWidgetFront) mrWidgetFront = mrInitWidget('muscle-map-front', 'front');
    if (!mrWidgetBack) mrWidgetBack = mrInitWidget('muscle-map-back', 'back');
    return !!(mrWidgetFront && mrWidgetBack);
  }

  function mrResizeWidgets() {
    if (mrWidgetFront) mrWidgetFront.resize();
    if (mrWidgetBack) mrWidgetBack.resize();
  }

  function mrMusclePanelActive() {
    const panel = document.querySelector('.page-tab-panel[data-panel="muscle"]');
    return !!(panel && panel.classList.contains('active'));
  }

  function mrRefreshVisibleWidgets() {
    if (!mrEnsureWidgets()) return false;
    mrApplyHighlights();
    mrResizeWidgets();
    return true;
  }

  function mrInstallVisibilityHooks() {
    const front = document.getElementById('muscle-map-front');
    const back = document.getElementById('muscle-map-back');
    const panel = document.querySelector('.page-tab-panel[data-panel="muscle"]');
    if (!front || !back || !panel) return;

    if (window.__igMuscleMapHookCleanup) window.__igMuscleMapHookCleanup();
    if (window.__igMuscleMapMutationObserver) window.__igMuscleMapMutationObserver.disconnect();
    if (window.__igMuscleMapResizeObserver) window.__igMuscleMapResizeObserver.disconnect();

    const schedule = () => {
      if (typeof window.igResizeMuscleMap === 'function') window.igResizeMuscleMap();
    };
    const cleanups = [];
    const listen = (target, type, fn) => {
      target.addEventListener(type, fn);
      cleanups.push(() => target.removeEventListener(type, fn));
    };
    window.__igMuscleMapHookCleanup = () => {
      cleanups.forEach(fn => fn());
      window.__igMuscleMapHookCleanup = null;
    };

    listen(window, 'ig:applock-unlocked', schedule);
    listen(window, 'pageshow', schedule);
    listen(window, 'resize', schedule);
    listen(document, 'visibilitychange', () => {
      if (!document.hidden) schedule();
    });

    const mo = new MutationObserver(schedule);
    mo.observe(panel, { attributes: true, attributeFilter: ['class', 'style'] });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-locked'] });
    window.__igMuscleMapMutationObserver = mo;

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(schedule);
      ro.observe(front);
      ro.observe(back);
      ro.observe(panel);
      window.__igMuscleMapResizeObserver = ro;
    }
  }

  /* Resolve muscle recovery directly from the same date->group source the
     overview calendar and home Suggested card use. The body map should be
     a visual reflection of the calendar, not a separate per-exercise read. */
  function muscleDaysByDate() {
    const dayMuscles = {};
    Object.entries(calendarGroupsByDate(currentSessions, currentSettings?.calendarColors || {})).forEach(([dateRaw, clsRaw]) => {
      const cls = overviewCalendarCls(clsRaw);
      const muscles = LIFT_CLS_TO_MUSCLES[cls];
      if (muscles && muscles.length) dayMuscles[dateRaw] = new Set(muscles);
    });
    return dayMuscles;
  }

  function renderMuscleMap() {
    if (!mrEnsureLibrary()) return;

    const today = new Date(); today.setHours(12, 0, 0, 0);
    const todayISO = localDateISO(today);

    /* Most recent date each individual muscle was trained. */
    const muscleLastDate = {};
    Object.entries(muscleDaysByDate()).forEach(([dateRaw, muscles]) => {
      if (!dateRaw || dateRaw > todayISO) return;
      muscles.forEach(m => {
        if (!muscleLastDate[m] || dateRaw > muscleLastDate[m]) muscleLastDate[m] = dateRaw;
      });
    });

    const muscleData = {};
    Object.entries(muscleLastDate).forEach(([m, dateRaw]) => {
      const days  = Math.round((today - new Date(dateRaw + 'T12:00:00')) / 86400000);
      const color = mrDaysColor(days);
      if (color) muscleData[m] = color;
    });
    mrHighlights = muscleData;

    mrRefreshVisibleWidgets();

    const labelEl = document.getElementById('mr-muscle-label');
    if (labelEl && Object.keys(mrHighlights).length === 0) {
      labelEl.textContent = '';
    }
  }

  /* The widgets are constructed while the Muscle Recovery tab panel is
     still display:none (it isn't the default active dashboard tab), so
     their canvases measure a 0x0 container at construction time. Some
     WebKit versions don't fire ResizeObserver when a container comes out
     of display:none, so the canvas can stay permanently blank until an
     explicit resize — call this when the tab becomes visible. */
  window.igResizeMuscleMap = function () {
    window.__igMuscleMapResizeQueued = true;
    const run = () => {
      if (!mrEnsureLibrary()) return;
      if (!mrMusclePanelActive()) return;
      if (mrRefreshVisibleWidgets()) window.__igMuscleMapResizeQueued = false;
    };
    run();
    requestAnimationFrame(run);
    requestAnimationFrame(() => requestAnimationFrame(run));
    setTimeout(run, 80);
    setTimeout(run, 220);
    setTimeout(run, 500);
    setTimeout(run, 1000);
  };
  mrInstallVisibilityHooks();
  if (window.__igMuscleMapResizeQueued || mrMusclePanelActive()) {
    window.igResizeMuscleMap();
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
      const cls = overviewCalendarCls(s.cls || liftToCls(s.lift) || 'other');
      if (cls && !sessionMap[dayNum]) sessionMap[dayNum] = cls;
    });

    // Merge with manual calendar overrides — same priority as renderCalendar
    const calColors   = currentSettings?.calendarColors || {};
    const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
    const counts      = { squat: 0, bench: 0, dead: 0, arm: 0 };

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${thisYear}-${monthPad}-${String(d).padStart(2, '0')}`;
      const manualCls = overviewCalendarCls(calColors[dateStr]);
      const cls       = manualCls || sessionMap[d];
      if (cls && cls !== 'rest' && cls !== 'other' && cls in counts) counts[cls]++;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) {
      container.innerHTML = `<div class="freq-empty">Log a session to see your lift breakdown</div>`;
      return;
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

  function isTimedSession(s) {
    return s?.repMode === 'time';
  }

  /* Monday-based week start (matches challenges.js's _igWeekStart) so
     "this week" here agrees with streaks/challenges elsewhere. */
  function coreWeekStartISO(d) {
    const x = new Date(d); x.setHours(12, 0, 0, 0);
    const day = x.getDay();
    x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
    return localDateISO(x);
  }

  /* Core is a secondary group kept out of the main-lift analytics, so it
     gets its own dedicated summary tab instead: set counts, a daily trend,
     and the recent core log. */
  function renderCore(sessions) {
    const weekEl = document.getElementById('coreWeekSets');
    if (!weekEl) return;
    const monthEl  = document.getElementById('coreMonthSets');
    const streakEl = document.getElementById('coreStreak');
    const trendEl  = document.getElementById('coreTrend');
    const recentEl = document.getElementById('coreRecent');
    const emptyEl  = document.getElementById('coreEmpty');

    const core = (sessions || []).filter(s =>
      s.dateRaw && !s.isRestDay &&
      normalizeLiftCls(s.cls || liftToCls(s.lift) || 'other') === 'core');

    const today = new Date(); today.setHours(12, 0, 0, 0);
    const todayISO     = localDateISO(today);
    const weekStartISO = coreWeekStartISO(today);
    const monthPrefix  = todayISO.slice(0, 7);

    const sumSets = arr => arr.reduce((t, s) => t + (Number(s.sets) || 0), 0);
    weekEl.textContent = sumSets(core.filter(s => s.dateRaw >= weekStartISO && s.dateRaw <= todayISO));
    if (monthEl) monthEl.textContent = sumSets(core.filter(s => s.dateRaw.slice(0, 7) === monthPrefix));

    /* Core streak — consecutive days (ending today) with a logged core
       session. Today counts as a grace day: not having done abs yet today
       doesn't zero the streak, it just counts back from yesterday. */
    if (streakEl) {
      const coreDays = new Set(core.map(s => s.dateRaw));
      let streak = 0; const c = new Date(today);
      for (let i = 0; i < 366; i++) {
        const iso = localDateISO(c);
        if (coreDays.has(iso)) { streak++; c.setDate(c.getDate() - 1); }
        else if (i === 0)      { c.setDate(c.getDate() - 1); }
        else break;
      }
      streakEl.textContent = streak;
    }

    /* Daily trend — last 8 days, today rightmost. Values are total sets,
       so 3 sets of planks + 2 sets of crunches on one date renders as 5. */
    if (trendEl) {
      const DAYS = 8;
      const counts = new Array(DAYS).fill(0);
      const labels = [];
      const dayIndex = new Map();
      for (let i = 0; i < DAYS; i++) {
        const d = new Date(today); d.setDate(d.getDate() - (DAYS - 1 - i));
        const iso = localDateISO(d);
        dayIndex.set(iso, i);
        labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      }
      core.forEach(s => {
        const i = dayIndex.get(s.dateRaw);
        if (i != null) counts[i] += Number(s.sets) || 0;
      });
      const max = Math.max(1, ...counts);
      trendEl.innerHTML = counts.map((c, i) => `
        <div class="core-bar-col">
          <span class="core-bar-val">${c || ''}</span>
          <div class="core-bar-track"><div class="core-bar" style="height:${Math.round(c / max * 100)}%;${c === 0 ? 'opacity:.2;' : ''}"></div></div>
          <span class="core-bar-wk">${labels[i]}</span>
        </div>`).join('');
    }

    /* Recent core log — newest first. */
    if (recentEl) {
      const recent = core.slice()
        .sort((a, b) => (a.dateRaw < b.dateRaw ? 1 : a.dateRaw > b.dateRaw ? -1 : 0))
        .slice(0, 12);
      recentEl.innerHTML = recent.map(s => `
        <div class="core-row">
          <span class="pill core">${escapeHTML(s.lift || '—')}</span>
          <span class="core-row-meta">${s.sets || 1} &times; ${repMetricText(s)}</span>
          <span class="core-row-date">${escapeHTML(s.date || formatDate(s.dateRaw))}</span>
        </div>`).join('');
      recentEl.style.display = recent.length ? '' : 'none';
      if (emptyEl) emptyEl.style.display = recent.length ? 'none' : '';
    }
  }

  function parseTimeSeconds(raw) {
    const value = String(raw || '').trim().toLowerCase();
    if (!value) return 0;
    const colon = value.match(/^(\d+):([0-5]?\d)$/);
    if (colon) return (+colon[1] * 60) + +colon[2];
    const min = value.match(/(\d+(?:\.\d+)?)\s*m/);
    const sec = value.match(/(\d+(?:\.\d+)?)\s*s/);
    if (min || sec) return Math.round((min ? parseFloat(min[1]) * 60 : 0) + (sec ? parseFloat(sec[1]) : 0));
    const numeric = parseFloat(value);
    return Number.isFinite(numeric) ? Math.round(numeric) : 0;
  }

  function formatTimeSeconds(seconds) {
    const total = Math.max(0, Math.round(+seconds || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return mins ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
  }

  /* Microwave-style time entry: each typed digit shifts in from the right,
     so pressing 1, 4, 5 reads as 1:45 (last two digits are seconds, the
     rest are minutes) instead of needing the colon typed manually. The
     raw digit buffer is tracked separately in a dataset attribute rather
     than re-derived from the formatted "M:SS" text on every keystroke —
     stripping digits back out of an already-colon-formatted value would
     pick up padding zeros as if they'd been typed, corrupting the next
     keystroke (e.g. "0:01" + "4" -> digits "0014" -> "00:14" instead of
     "0:14"). beforeinput (not input) is used so the native keystroke can
     be cancelled and fully replaced by the reformatted value in one step. */
  function timeMaskDigits(digits) {
    if (!digits) return '';
    const d = digits.slice(-4);
    const secs = d.slice(-2).padStart(2, '0');
    const mins = d.slice(0, -2) || '0';
    return `${mins}:${secs}`;
  }
  function applyTimeMaskBuffer(input, digits) {
    input.dataset.timeDigits = digits;
    input.value = timeMaskDigits(digits);
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }
  function handleTimeMaskBeforeInput(input, e) {
    if (input.type !== 'text') return;
    const type = e.inputType || '';
    e.preventDefault();
    if (type === 'deleteContentBackward' || type === 'deleteContentForward') {
      applyTimeMaskBuffer(input, (input.dataset.timeDigits || '').slice(0, -1));
    } else if (type.startsWith('insert')) {
      const added = (e.data || '').replace(/\D/g, '');
      if (added) applyTimeMaskBuffer(input, ((input.dataset.timeDigits || '') + added).slice(-4));
    }
  }
  function initTimeMask() {
    const logReps = document.getElementById('logReps');
    logReps?.addEventListener('beforeinput', e => handleTimeMaskBeforeInput(logReps, e));
    logReps?.addEventListener('focus', () => { if (logReps.type === 'text') logReps.select(); });
  }

  function repMetricText(s) {
    return isTimedSession(s) ? formatTimeSeconds(s.timeSeconds || s.reps) : (s.reps || '—');
  }

  function repInputValue(s) {
    return isTimedSession(s) ? formatTimeSeconds(s.timeSeconds || s.reps) : (s.reps || '');
  }

  function escapeHTML(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function groupedLogRows(sessions) {
    const groups = [];
    const byKey = new Map();
    sessions.forEach(s => {
      if (s.isRestDay) {
        groups.push({ type: 'rest', sessions: [s] });
        return;
      }
      const liftKey = (s.lift || '').trim().toLowerCase();
      const key = `${s.dateRaw || s.date || ''}|${liftKey}`;
      if (!byKey.has(key)) {
        const group = { type: 'lift', lift: s.lift || '', date: s.date || '', dateRaw: s.dateRaw || '', sessions: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      byKey.get(key).sessions.push(s);
    });
    return groups;
  }

  function logSetSummary(s) {
    const effort = `${s.sets}×${repMetricText(s)}`;
    const load = s.bodyweight ? 'Bodyweight' : `${s.wt} lbs`;
    return `${effort} · ${load}`;
  }

  function renderLogSetLine(s, showDate) {
    return `
      <div class="log-set-line" data-id="${s.id}">
        <div class="log-set-copy">
          <span class="log-set-summary">${showDate ? escapeHTML(s.date) + ' · ' : ''}${escapeHTML(logSetSummary(s))}</span>
          ${s.note ? '<span class="log-set-note"><span class="pr-flag">★ ' + escapeHTML(s.note) + '</span></span>' : ''}
        </div>
        <div class="log-set-actions">
          <button class="btn-row-edit" data-id="${s.id}" title="Edit this session">✎</button>
          <button class="btn-delete" data-id="${s.id}" title="Remove this session">✕</button>
        </div>
      </div>`;
  }

  function renderLog(sessions) {
    currentSessions = sessions;
    const logBodyEl = document.getElementById('logBody');
    const rows = groupedLogRows(sessions);
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = rows.slice(start, start + PAGE_SIZE);

    if (!logBodyEl) return;
    logBodyEl.innerHTML = sessions.length
      ? page.map(group => {
        const s = group.sessions[0];
        if (group.type === 'rest') return `
          <tr data-id="${s.id}" class="rest-day-row">
            <td class="log-main-cell">
              <span class="pill rest">Rest Day</span>
              <div class="log-meta-line">${escapeHTML(s.date)}</div>
            </td>
            <td class="row-actions">
              <button class="btn-delete" data-id="${s.id}" title="Remove">✕</button>
            </td>
          </tr>`;
        const cls = normalizeLiftCls(s.cls || liftToCls(s.lift) || 'other');
        return `
          <tr class="log-group-row" data-group="${escapeHTML((group.dateRaw || group.date) + '|' + (group.lift || '').toLowerCase())}">
            <td class="log-main-cell" colspan="2">
              <div class="log-group-head">
                <span class="pill ${cls}">${escapeHTML(group.lift || '—')}</span>
                <span class="log-meta-line">${escapeHTML(group.date)}${group.sessions.length > 1 ? ' · ' + group.sessions.length + ' entries' : ''}</span>
              </div>
              <div class="log-set-list">
                ${group.sessions.map(entry => renderLogSetLine(entry, false)).join('')}
              </div>
            </td>
          </tr>`;
      }).join('')
      : `<tr><td colspan="2" class="log-empty-cell">
           <div class="log-empty-icon">🏋️</div>
           <div class="log-empty-title">No sessions logged yet</div>
           <div class="log-empty-sub">Your training history will appear here</div>
           <a href="training.html#log" class="log-empty-link">Log your first session →</a>
         </td></tr>`;

    const pag = document.getElementById('log-pagination');
    if (pag) {
      if (rows.length > PAGE_SIZE) {
        pag.style.display = '';
        const pi = document.getElementById('log-page-info');
        const lp = document.getElementById('log-prev');
        const ln = document.getElementById('log-next');
        if (pi) pi.textContent = `Page ${currentPage} of ${totalPages}`;
        if (lp) lp.disabled = currentPage <= 1;
        if (ln) ln.disabled = currentPage >= totalPages;
      } else {
        pag.style.display = 'none';
      }
    }
  }

  /* Builds an inline-editable version of a row */
  function buildEditRow(s) {
    const dateVal = s.dateRaw || localDateISO();
    return `
      <tr data-id="${s.id}" class="editing-row">
        <td class="log-main-cell">
          <input id="ed-date" type="hidden" value="${dateVal}">
          <input class="edit-field edit-wide" id="ed-lift" list="lift-options"
                 value="${escapeHTML(s.lift)}" autocomplete="off">
          <div class="log-edit-meta">
            <input class="edit-field edit-num" id="ed-sets" type="number" value="${s.sets}" min="1">
            <span style="color:var(--text-dimmer)">×</span>
            <input class="edit-field edit-num" id="ed-reps" type="${isTimedSession(s) ? 'text' : 'number'}" value="${repInputValue(s)}" min="1">
            <span style="color:var(--text-dimmer)">·</span>
            <input class="edit-field edit-num" id="ed-wt" type="number" value="${s.wt}" step="5" min="1" ${s.bodyweight ? 'disabled' : ''}>
            <span style="color:var(--text-dimmer)">lbs ·</span>
            <input class="edit-field" id="ed-note" type="text" value="${escapeHTML(s.note)}" placeholder="PR…" style="width:90px">
            <label class="bodyweight-toggle" style="margin-top:0;">
              <input id="ed-bodyweight" type="checkbox" ${s.bodyweight ? 'checked' : ''}>
              <span>Bodyweight</span>
            </label>
            <label class="bodyweight-toggle" style="margin-top:0;">
              <input id="ed-reps-time" type="checkbox" ${isTimedSession(s) ? 'checked' : ''}>
              <span>Time</span>
            </label>
          </div>
        </td>
        <td class="row-actions">
          <button class="btn-save-edit" data-id="${s.id}" title="Save changes">Save</button>
          <button class="btn-cancel-edit btn-delete" data-id="${s.id}" title="Cancel">✕</button>
        </td>
      </tr>`;
  }

  /* Home page only: "N friends trained today" strip below the KPI cards.
     Registered here (not at top level) for the same reason as
     initBodyweightControls() above — soft-nav swaps replace
     #main-content's innerHTML on every Home navigation, so this has to
     re-run on every initApp() call rather than attach once. Cheap
     per-friend query: an existence check for today's date, not a full
     session fetch. */
  function loadHomeCrewStrip(forUid) {
    const card = document.getElementById('homeCrewStrip');
    if (!card) return;
    const todayISO = localDateISO();
    const loadId = `${Date.now()}-${Math.random()}`;
    card.dataset.loadId = loadId;
    renderHomeCrewStripLoading(card);

    const stillCurrent = () => card.dataset.loadId === loadId;

    Promise.all([
      db.collection('friendRequests').where('fromUid', '==', forUid).where('status', '==', 'accepted').get(),
      db.collection('friendRequests').where('toUid',   '==', forUid).where('status', '==', 'accepted').get(),
    ]).then(([sentSnap, recvSnap]) => {
      if (!stillCurrent()) return;
      const friendMap = new Map();
      [
        ...sentSnap.docs.map(d => ({ uid: d.data().toUid,   username: d.data().toUsername   })),
        ...recvSnap.docs.map(d => ({ uid: d.data().fromUid, username: d.data().fromUsername })),
      ].forEach(f => {
        if (f.uid && f.uid !== forUid && !friendMap.has(f.uid)) friendMap.set(f.uid, f);
      });
      const friends = [...friendMap.values()];
      if (!friends.length) { card.style.display = 'none'; card.classList.remove('crew-loading'); return; }

      return Promise.all(friends.map(f =>
        db.collection(`users/${f.uid}/sessions`).where('dateRaw', '==', todayISO).limit(1).get()
          .then(snap => snap.empty ? null : f)
          .catch(() => null)
      )).then(trainedBase => {
        if (!stillCurrent()) return;
        const trainedFriends = trainedBase.filter(Boolean);
        if (!trainedFriends.length) {
          renderHomeCrewStrip(card, []);
          return;
        }

        return Promise.all(trainedFriends.map(f => db.doc(`users/${f.uid}/settings/main`).get()
          .then(snap => ({
            ...f,
            settings: snap.exists ? snap.data() : {},
          }))
          .catch(() => ({
            ...f,
            settings: {},
          }))
        )).then(results => {
          if (!stillCurrent()) return;
          const trained = results.filter(Boolean).map(r => ({
            ...r,
            username: r.settings.username || r.settings.displayName || r.username || 'Athlete',
            trainedToday: true,
          }));
          renderHomeCrewStrip(card, trained);
          if (trained.length) applyHomeCrewPhotoAvatars(card);
        });
      });
    }).catch(() => { if (stillCurrent()) { card.style.display = 'none'; card.classList.remove('crew-loading'); } });
  }

  function clampHomeCrewNumber(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function safeHomeCrewColor(value, fallback) {
    const raw = String(value || '').trim();
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw) ? raw : fallback;
  }

  function buildHomeCrewAvatar(f) {
    const settings = f.settings || {};
    const username = settings.username || settings.displayName || f.username || 'Athlete';
    const title = `@${escapeHTML(username)}`;
    if (settings.avatarPhotoUrl) {
      return `<div class="crew-av crew-av-photo" title="${title}" data-photourl="${escapeHTML(settings.avatarPhotoUrl)}" data-zoom="${clampHomeCrewNumber(settings.avatarZoom, 1, 1, 4)}" data-posx="${clampHomeCrewNumber(settings.avatarPosX, 50, 0, 100)}" data-posy="${clampHomeCrewNumber(settings.avatarPosY, 50, 0, 100)}"></div>`;
    }
    const emb = settings.avatarId && EMBLEMS.find(e => e.id === settings.avatarId);
    if (emb) {
      const ring = safeHomeCrewColor(settings.avatarRingColor, '#d4af37');
      const bg = safeHomeCrewColor(settings.avatarBgColor, '#8b1c1c');
      const icon = safeHomeCrewColor(settings.avatarIconColor, '#fff');
      return `<div class="crew-av crew-av-emblem" title="${title}" style="background:${bg};box-shadow:inset 0 0 0 2px ${ring};"><i class="ti ${emb.icon}" style="font-size:13px;color:${icon};line-height:1;" aria-hidden="true"></i></div>`;
    }
    return `<div class="crew-av" title="${title}">${escapeHTML(username.slice(0, 2).toUpperCase())}</div>`;
  }

  function applyHomeCrewPhotoAvatars(card) {
    card.querySelectorAll('.crew-av-photo[data-photourl]').forEach(el => {
      const url = el.dataset.photourl;
      if (el.dataset.photoApplied === url && el.querySelector('img')) return;
      el.dataset.photoApplied = url;
      el.innerHTML = '';
      el.style.position = 'relative';
      el.style.overflow = 'hidden';
      el.style.background = 'transparent';
      const img = document.createElement('img');
      img.alt = '';
      img.style.cssText = 'position:absolute;object-fit:fill;';
      img.onload = function () {
        const cW = el.clientWidth || el.offsetWidth || 30;
        const cH = el.clientHeight || el.offsetHeight || 30;
        const zoom = clampHomeCrewNumber(el.dataset.zoom, 1, 1, 4);
        const posX = clampHomeCrewNumber(el.dataset.posx, 50, 0, 100);
        const posY = clampHomeCrewNumber(el.dataset.posy, 50, 0, 100);
        const base = Math.max(cW / img.naturalWidth, cH / img.naturalHeight);
        const dW = img.naturalWidth * base * zoom;
        const dH = img.naturalHeight * base * zoom;
        img.style.width = dW + 'px';
        img.style.height = dH + 'px';
        img.style.left = -((dW - cW) * posX / 100) + 'px';
        img.style.top = -((dH - cH) * posY / 100) + 'px';
      };
      img.src = url;
      el.appendChild(img);
    });
  }

  function armHomeCrewStripLink(card) {
    card.dataset.href = 'feed.html';
    card.setAttribute('role', 'link');
    card.tabIndex = 0;
    if (card.dataset.clickBound === '1') return;
    card.dataset.clickBound = '1';
    const go = () => { window.location.href = card.dataset.href || 'feed.html'; };
    card.addEventListener('click', e => {
      if (e.target.closest('a, button, input, label, select, textarea')) return;
      go();
    });
    card.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      go();
    });
  }

  function renderHomeCrewStripLoading(card) {
    card.style.display = 'flex';
    card.classList.add('crew-loading');
    armHomeCrewStripLink(card);
    card.innerHTML = `
      <div class="crew-skel-avatars">
        <span class="crew-skel-av"></span><span class="crew-skel-av"></span><span class="crew-skel-av"></span>
      </div>
      <div class="crew-text">
        <div class="crew-skel-line wide"></div>
        <div class="crew-skel-line"></div>
      </div>
      <div class="crew-skel-chip"></div>`;
  }

  function renderHomeCrewStrip(card, trained) {
    card.style.display = 'flex';
    card.classList.remove('crew-loading');
    armHomeCrewStripLink(card);
    if (!trained.length) {
      card.innerHTML = `
        <div class="crew-icon"><i class="ti ti-users" aria-hidden="true"></i></div>
        <div class="crew-text">
          <div class="crew-t1">No one's trained today yet</div>
          <div class="crew-t2">Be the first to log a session</div>
        </div>`;
      return;
    }
    const shown = trained.slice(0, 3);
    const extra = trained.length - shown.length;
    const avatarsHtml = shown.map(buildHomeCrewAvatar).join('') + (extra > 0 ? `<div class="crew-av">+${extra}</div>` : '');
    const names = trained.slice(0, 2).map(f => '@' + f.username).join(', ')
      + (trained.length > 2 ? ` & ${trained.length - 2} other${trained.length - 2 === 1 ? '' : 's'}` : '');
    card.innerHTML = `
      <div class="crew-avatars">${avatarsHtml}</div>
      <div class="crew-text">
        <div class="crew-t1">${trained.length} friend${trained.length === 1 ? '' : 's'} trained today</div>
        <div class="crew-t2">${escapeHTML(names)}</div>
      </div>
      <a href="feed.html" class="crew-link">See feed →</a>`;
  }

  /* Custom white calendar picker — no external libraries needed */
  createDatePicker('logDate');
  initBodyweightDatePicker();
  initBodyweightControls();
  initLiftPicker();
  initLogSteppers();
  initTimeMask();

  /* Live listener — rebuilds table instantly on any Firestore change */
  unsubscribeSessions = sessionsRef()
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      currentSessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      /* Nav streak — runs first, before any dashboard renders that may throw on other pages */
      (function() {
        const sd = new Set(currentSessions.map(s => s.dateRaw).filter(Boolean));
        const rd = new Set(Array.isArray(currentSettings?.restDays) ? currentSettings.restDays : []);
        const ad = new Set([...sd, ...rd]);
        let n = 0; const c = new Date(); c.setHours(12,0,0,0);
        for (let i = 0; i < 366; i++) {
          const iso = localDateISO(c);
          if (ad.has(iso)) { n++; c.setDate(c.getDate()-1); }
          else if (i === 0) { c.setDate(c.getDate()-1); }
          else { break; }
        }
        const el = document.getElementById('nav-streak-count');
        const wrap = document.getElementById('nav-streak');
        if (el) el.textContent = n || '0';
        if (wrap) wrap.style.display = n > 0 ? 'flex' : 'none';
      })();
      const liftSessions = currentSessions.filter(s => !s.isRestDay);
      renderLog(currentSessions);
      renderDonut(liftSessions);
      renderHistoryChart(liftSessions);
      renderCore(liftSessions);
      updateKPIs();
      renderCalendar();
      igCheckChallenges(uid, db, currentSessions, bwAllEntries, currentSettings?.goals);
    }, err => {
      console.error('Sessions error:', err.code, err.message);
      renderLog([]);
      updateKPIs();
      renderCalendar();
      showToast('Could not load your training log — check your connection.');
    });

  /* Bodyweight listener */
  if (uid) {
    unsubscribeBodyweight = db.collection('users').doc(uid).collection('bodyweight')
      .orderBy('date', 'asc')
      .onSnapshot(snap => {
        bwAllEntries = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBodyweight();
        igCheckChallenges(uid, db, currentSessions, bwAllEntries, currentSettings?.goals);
      }, err => {
        console.error('BW error:', err.code, err.message);
        showToast('Could not load your weight log — check your connection.');
      });
  }

  /* Challenge subscriptions — init docs then subscribe to live updates */
  igInitChallenges(uid, db).then(({ dailyRef, weeklyRef, xpRef }) => {
    let _dailyData = null, _weeklyData = null, _xpTotal = 0;
    let _dailyReady = false, _weeklyReady = false;
    let _challengeFrame = null;

    function renderChallengesWhenReady() {
      if (!_dailyReady || !_weeklyReady) return;
      if (_challengeFrame) cancelAnimationFrame(_challengeFrame);
      _challengeFrame = requestAnimationFrame(() => {
        _challengeFrame = null;
        igRenderChallenges(_dailyData, _weeklyData, _xpTotal);
      });
    }

    unsubscribeDaily = dailyRef.onSnapshot(snap => {
      _dailyData = snap.exists ? snap.data() : null;
      _dailyReady = true;
      renderChallengesWhenReady();
    }, err => {
      console.error('Daily challenge error:', err.code, err.message);
      _dailyData = null; _dailyReady = true; renderChallengesWhenReady();
      showToast('Could not load daily challenges — check your connection.');
    });

    unsubscribeWeekly = weeklyRef.onSnapshot(snap => {
      _weeklyData = snap.exists ? snap.data() : null;
      _weeklyReady = true;
      renderChallengesWhenReady();
    }, err => {
      console.error('Weekly challenge error:', err.code, err.message);
      _weeklyData = null; _weeklyReady = true; renderChallengesWhenReady();
      showToast('Could not load weekly challenges — check your connection.');
    });

    unsubscribeXP = xpRef.onSnapshot(snap => {
      _xpTotal = snap.exists ? (snap.data().total || 0) : 0;
      renderChallengesWhenReady();
      const homeRankEl = document.getElementById('homeStatRank');
      const homeRankBadgeEl = document.getElementById('homeRankBadge');
      if (homeRankEl) {
        const rank = getRankFromXP(_xpTotal);
        homeRankEl.textContent = rank.rankName;
        if (homeRankBadgeEl) {
          homeRankBadgeEl.innerHTML = typeof rankHexBadge === 'function'
            ? `<span class="home-rank-badge">${rankHexBadge(rank.rankIndex)}</span>`
            : '';
        }
      }
    }, err => console.error('XP error:', err.code, err.message));
  }).catch(err => { console.error('Challenge init error:', err); showToast('Could not load challenges — check your connection.'); });

  /* Bodyweight toggle — no added weight, so hide/disable the weight input */
  const logBwEl = document.getElementById('logBodyweight');
  const logWtEl = document.getElementById('logWeight');
  const logRepsEl = document.getElementById('logReps');
  const logRepsTimeEl = document.getElementById('logRepsTime');
  logBwEl?.addEventListener('change', () => {
    logWtEl.disabled = logBwEl.checked;
    if (logBwEl.checked) logWtEl.value = '';
    logWtEl.closest('.log-stepper')?.classList.toggle('log-stepper--disabled', logBwEl.checked);
  });
  function syncRepsInputMode(input, toggle) {
    if (!input || !toggle) return;
    const timed = !!toggle.checked;
    input.type = timed ? 'text' : 'number';
    input.placeholder = '—';
    input.value = '';
    delete input.dataset.timeDigits;
    const label = input.id === 'logReps' ? document.getElementById('logRepsLabel') : null;
    if (label) label.textContent = timed ? 'Time' : 'Reps';
    if (timed) {
      input.removeAttribute('min');
      input.removeAttribute('max');
    } else {
      input.min = '1';
      input.max = '50';
    }
    input.closest('.log-stepper')?.classList.toggle('log-stepper--plain', timed);
  }
  logRepsTimeEl?.addEventListener('change', () => syncRepsInputMode(logRepsEl, logRepsTimeEl));
  syncRepsInputMode(logRepsEl, logRepsTimeEl);

  /* Add session — also saves dateRaw so the edit form can pre-fill it */
  document.getElementById('addSession')?.addEventListener('click', () => {
    const dateVal    = document.getElementById('logDate').value;
    const liftVal    = document.getElementById('logLift').value;
    const sets       = +document.getElementById('logSets').value;
    const timed      = !!logRepsTimeEl?.checked;
    const repsRaw    = document.getElementById('logReps').value;
    const timeSeconds = timed ? parseTimeSeconds(repsRaw) : 0;
    const reps       = timed ? 0 : +repsRaw;
    const bodyweight = !!logBwEl?.checked;
    const wt         = bodyweight ? 0 : +document.getElementById('logWeight').value;
    const note       = document.getElementById('logNote').value.trim();
    if (!dateVal || !sets || (timed ? !timeSeconds : !reps) || (!bodyweight && !wt)) {
      alert(timed ? 'Please fill in date, sets, time, and weight.' : 'Please fill in date, sets, reps, and weight.'); return;
    }
    const lift = liftVal.trim();
    const cls  = liftToCls(lift);
    currentPage = 1;
    historyPage = 1;
    /* PR check: does this beat the best weight ever logged for this exact lift? */
    const prevBest = (currentSessions || [])
      .filter(s => (s.lift || '').toLowerCase() === lift.toLowerCase())
      .reduce((m, s) => Math.max(m, +s.wt || 0), 0);
    const isPR = !bodyweight && prevBest > 0 && wt > prevBest;
    sessionsRef().add({ date: formatDate(dateVal), dateRaw: dateVal,
                        lift, cls, sets, reps, repMode: timed ? 'time' : 'reps', timeSeconds: timed ? timeSeconds : 0, wt, bodyweight, note,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => {
        ['logSets','logReps','logWeight','logNote'].forEach(id => document.getElementById(id).value = '');
        if (logRepsTimeEl) { logRepsTimeEl.checked = false; syncRepsInputMode(logRepsEl, logRepsTimeEl); }
        if (logBwEl) { logBwEl.checked = false; logWtEl.disabled = false; }
        if (isPR) showPrStamp(lift, wt);
      })
      .catch(err => showToast('Could not save session — ' + (err?.message || 'check your connection.')));
  });

  /* Unified click handler for edit / save / cancel / delete */
  document.getElementById('logBody')?.addEventListener('click', e => {

    /* ── Edit button: swap row to inline edit mode ── */
    const editBtn = e.target.closest('.btn-row-edit');
    if (editBtn) {
      const s = currentSessions.find(x => x.id === editBtn.dataset.id);
      const row = editBtn.closest('tr');
      if (s && row) {
        row.outerHTML = buildEditRow(s);
        setTimeout(() => createDatePicker('ed-date', s.dateRaw), 30);
      }
      return;
    }

    /* ── Save button: write edited values back to Firestore ── */
    const saveBtn = e.target.closest('.btn-save-edit');
    if (saveBtn) {
      const id         = saveBtn.dataset.id;
      const dateVal    = document.getElementById('ed-date').value;
      const liftVal    = document.getElementById('ed-lift').value;
      const sets       = +document.getElementById('ed-sets').value;
      const timed      = !!document.getElementById('ed-reps-time')?.checked;
      const repsRaw    = document.getElementById('ed-reps').value;
      const timeSeconds = timed ? parseTimeSeconds(repsRaw) : 0;
      const reps       = timed ? 0 : +repsRaw;
      const bodyweight = !!document.getElementById('ed-bodyweight')?.checked;
      const wt         = bodyweight ? 0 : +document.getElementById('ed-wt').value;
      const note       = document.getElementById('ed-note').value.trim();
      if (!dateVal || !sets || (timed ? !timeSeconds : !reps) || (!bodyweight && !wt)) { showToast('Please fill in all fields.'); return; }
      const lift = liftVal.trim();
      const cls  = liftToCls(lift);
      sessionsRef().doc(id)
        .update({ date: formatDate(dateVal), dateRaw: dateVal, lift, cls, sets, reps, repMode: timed ? 'time' : 'reps', timeSeconds: timed ? timeSeconds : 0, wt, bodyweight, note })
        .catch(err => showToast('Could not update session — ' + (err?.message || 'check your connection.')));
      return;
    }

    /* ── Bodyweight checkbox toggled inside an edit row ── */
    const bwToggle = e.target.closest('#ed-bodyweight');
    if (bwToggle) {
      const wtInput = document.getElementById('ed-wt');
      if (wtInput) { wtInput.disabled = bwToggle.checked; if (bwToggle.checked) wtInput.value = 0; }
      return;
    }

    const repsTimeToggle = e.target.closest('#ed-reps-time');
    if (repsTimeToggle) {
      syncRepsInputMode(document.getElementById('ed-reps'), repsTimeToggle);
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

  /* Time-mask the edit row's reps field too — it's built fresh into
     #logBody on every edit click, so this has to be delegated rather
     than attached directly like initTimeMask() does for #logReps. */
  document.getElementById('logBody')?.addEventListener('beforeinput', e => {
    if (e.target.id === 'ed-reps') handleTimeMaskBeforeInput(e.target, e);
  });
  document.getElementById('logBody')?.addEventListener('focus', e => {
    if (e.target.id === 'ed-reps' && e.target.type === 'text') e.target.select();
  }, true);

  document.getElementById('log-prev')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderLog(currentSessions); }
  });
  document.getElementById('log-next')?.addEventListener('click', () => {
    const totalPages = Math.ceil(groupedLogRows(currentSessions).length / PAGE_SIZE);
    if (currentPage < totalPages) { currentPage++; renderLog(currentSessions); }
  });

  document.addEventListener('click', e => {
    const historyPrev = e.target.closest('#history-prev');
    if (historyPrev) {
      if (historyPage > 1) {
        historyPage--;
        renderHistoryChart(currentSessions.filter(s => !s.isRestDay));
      }
      return;
    }

    const historyNext = e.target.closest('#history-next');
    if (historyNext) {
      const totalPages = Math.ceil(currentSessions.filter(s => !s.isRestDay && s.lift === historySelectedLift && s.dateRaw).length / PAGE_SIZE);
      if (historyPage < totalPages) {
        historyPage++;
        renderHistoryChart(currentSessions.filter(s => !s.isRestDay));
      }
    }
  });

  document.getElementById('goals-prev')?.addEventListener('click', () => {
    if (goalsDonePage > 1) { goalsDonePage--; renderGoals(currentSettings && currentSettings.goals); }
  });
  document.getElementById('goals-next')?.addEventListener('click', () => {
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
  const RANK_NAMES = ['Recruit','Bronze','Silver','Gold','Elite','Titan','Legend','Gladiator'];
  function rankWeightClass(bw) {
    const keys = Object.keys(bodyweightStandards).map(Number).sort((a,b) => a-b);
    for (const k of keys) if (bw <= k) return k;
    return keys[keys.length-1];
  }
  function liftTier(liftKey, max, bw) {
    const wc = rankWeightClass(bw);
    const th = bodyweightStandards[wc][liftKey];
    let passed = 0; for (const t of th) if (max >= t) passed++;
    return { passed, th };
  }
  function rankHex(rankIdx) {
    const cols = [
      ['#4B5563','#9AA0AC'], // Recruit   — gray
      ['#7D4A1E','#CD7F32'], // Bronze    — bronze
      ['#6B7280','#C8CAD0'], // Silver    — silver
      ['#92700A','#FFD700'], // Gold      — gold
      ['#1E40AF','#60A5FA'], // Elite     — blue
      ['#5B21B6','#A78BFA'], // Titan     — purple
      ['#9A3412','#FB923C'], // Legend    — orange
      ['#C1272D','#F0565B'], // Gladiator — red
    ];
    const num = ['I','II','III','IV','V','VI','VII','VIII'][rankIdx];
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
      const idx = Math.max(0, Math.min(7, passed - 1));
      sumIdx += idx; n++;
      let pct, nextTxt;
      if (passed >= 8) { pct = 100; nextTxt = 'Max rank reached — Gladiator'; }
      else {
        const base = passed > 0 ? th[passed-1] : 0;
        const next = th[passed];
        pct = Math.max(4, Math.min(100, Math.round((mx - base) / (next - base) * 100)));
        nextTxt = '<b>+' + (next - mx) + ' lbs</b> &rarr; ' + RANK_NAMES[Math.min(7, passed)];
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
      tally.textContent = total ? `${completedCount} / ${total} done` : '';
    }

    const fmtTs = ts => new Date(ts).toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const fmtDs = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); };

    function goalRow(g, isDone, isMissed) {
      const steps        = g.steps || 1;
      const stepsChecked = (isDone && !isMissed) ? steps : (g.stepsChecked || 0);
      const boxes = Array.from({length: steps}, (_, i) => {
        const cls = i < stepsChecked ? ' checked' : (isMissed ? ' missed' : '');
        const attrs = (!isDone && !isMissed) ? ` data-idx="${g._i}" data-step="${i}"` : '';
        return `<span class="goal-step-box${cls}"${attrs}></span>`;
      }).join('');
      const resetBtn = !isDone && !isMissed && steps > 1 && stepsChecked > 0 && g._i !== goalsEditIdx
        ? `<button class="goal-reset-btn" data-idx="${g._i}" title="Reset progress">↺</button>` : '';
      const adjuster = !isDone && !isMissed && g._i === goalsEditIdx ? `
        <div class="goal-steps-adj">
          <button class="goal-step-btn goal-step-minus" data-idx="${g._i}">−</button>
          <span class="goal-step-count">${steps}</span>
          <button class="goal-step-btn goal-step-plus" data-idx="${g._i}">+</button>
        </div>` : '';

      let mainContent = '';
      if (!isDone && g._i === goalsEditIdx) {
        const created = g.createdAt ? `<span class="goal-date-text">Added ${fmtTs(g.createdAt)}</span>` : '';
        const dateMeta = `<div class="goal-dates">${created}<label class="goal-date-label">Due <input type="date" class="goal-finish-input" data-idx="${g._i}" value="${g.finishBy||''}"></label></div>`;
        mainContent = `
          <input type="text" class="goal-input" data-idx="${g._i}" value="${esc(g.text)}" maxlength="60" autocomplete="off">
          ${dateMeta}
          <div class="goal-edit-actions">
            <button class="goal-edit-done btn-goal-act" data-idx="${g._i}">Done</button>
            <button class="goal-edit-cancel btn-goal-cancel" data-idx="${g._i}">Cancel</button>
          </div>`;
      } else if (!isDone) {
        const created = g.createdAt ? `<span class="goal-date-text">Added ${fmtTs(g.createdAt)}</span>` : '';
        const due = g.finishBy ? `<span class="goal-date-text">Due ${fmtDs(g.finishBy)}</span>` : '';
        const dateMeta = (created || due) ? `<div class="goal-dates">${created}${due}</div>` : '';
        mainContent = `<span class="goal-text">${esc(g.text)}</span>${dateMeta}`;
      } else if (isMissed) {
        const created = g.createdAt ? `<span class="goal-date-text">Added ${fmtTs(g.createdAt)}</span>` : '';
        const dateMeta = `<div class="goal-dates">${created}<span class="goal-date-text goal-date-missed">Missed · ${fmtDs(g.finishBy)}</span></div>`;
        mainContent = `<span class="goal-text goal-done">${esc(g.text)}</span>${dateMeta}`;
      } else {
        const parts = [g.createdAt ? `Added ${fmtTs(g.createdAt)}` : '', g.completedAt ? `Done ${fmtTs(g.completedAt)}` : ''].filter(Boolean);
        const dateMeta = parts.length ? `<div class="goal-dates">${parts.map(p=>`<span class="goal-date-text">${p}</span>`).join('')}</div>` : '';
        mainContent = `<span class="goal-text goal-done">${esc(g.text)}</span>${dateMeta}`;
      }

      const editBtn = !isDone && !isMissed && g._i !== goalsEditIdx
        ? `<button class="goal-edit-btn" data-idx="${g._i}" title="Edit goal"><i class="ti ti-pencil" aria-hidden="true"></i></button>` : '';

      return `
        <div class="goal-row${g._i === goalsEditIdx ? ' goal-row-editing' : ''}${isDone ? ' goal-row-done' : ''}${isMissed ? ' goal-row-missed' : ''}">
          <div class="goal-main">
            ${mainContent}
            <div class="goal-steps">${boxes}${resetBtn}</div>
            ${adjuster}
          </div>
          ${editBtn}
          <button class="btn-delete goal-delete" data-idx="${g._i}" title="Delete goal">✕</button>
        </div>`;
    }

    const addBoxes = Array.from({length: goalsAddSteps}, () =>
      '<span class="goal-step-box" style="opacity:0.3"></span>'
    ).join('');
    const addAdjuster = `
      <div class="goal-steps-adj">
        <button class="goal-step-btn goal-add-step-minus" type="button">âˆ’</button>
        <span class="goal-step-count">${goalsAddSteps}</span>
        <button class="goal-step-btn goal-add-step-plus" type="button">+</button>
      </div>`;

    const addForm = goalsAddOpen ? `
      <div class="goal-row goal-row-new goal-row-editing">
        <div class="goal-main">
          <input type="text" class="goal-input goal-add-input" maxlength="60" autocomplete="off" placeholder="Type your goal…">
          <div class="goal-steps">${addBoxes}</div>
          ${addAdjuster}
          <div class="goal-dates">
            <label class="goal-due-control"><span class="goal-due-pill">+ Due date</span><input type="date" class="goal-add-due"></label>
            <button class="goal-due-clear" type="button" style="display:none">✕</button>
          </div>
          <div class="goal-edit-actions">
            <button class="goal-add-done btn-goal-act">Done</button>
            <button class="goal-add-cancel btn-goal-cancel">Cancel</button>
          </div>
        </div>
      </div>` : `
      <div class="goal-row goal-row-new">
        <div class="goal-main"><button class="goal-add-btn">+ Set a goal</button></div>
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
      addForm +
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
        const g          = allGoals[idx];
        const steps      = g.steps || 1;
        const checking   = !box.classList.contains('checked');
        const newChecked = checking ? step + 1 : step;
        const isDone     = newChecked >= steps;
        if (checking) spawnConfetti(box);
        saveGoals(allGoals.map((g, i) => i !== idx ? g : {
          ...g, stepsChecked: newChecked, done: isDone, completedAt: isDone ? Date.now() : null,
        }));
      });
    });

    list.querySelectorAll('.goal-reset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.idx;
        saveGoals(allGoals.map((g, i) => i !== idx ? g : { ...g, stepsChecked: 0 }));
      });
    });

    list.querySelectorAll('.goal-step-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx   = +btn.dataset.idx;
        const steps = Math.max(1, (allGoals[idx].steps || 1) - 1);
        saveGoals(allGoals.map((g, i) => i !== idx ? g : { ...g, steps, stepsChecked: Math.min(g.stepsChecked||0, steps) }));
      });
    });

    list.querySelectorAll('.goal-step-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx   = +btn.dataset.idx;
        const steps = Math.min(10, (allGoals[idx].steps || 1) + 1);
        saveGoals(allGoals.map((g, i) => i !== idx ? g : { ...g, steps }));
      });
    });

    list.querySelectorAll('.goal-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.idx;
        saveGoals(allGoals.filter((_, i) => i !== idx));
      });
    });

    list.querySelectorAll('.goal-finish-input').forEach(inp => {
      inp.addEventListener('change', () => {
        const idx = +inp.dataset.idx;
        if (isNaN(idx) || idx < 0) return;
        saveGoals(allGoals.map((g, i) => i !== idx ? g : { ...g, finishBy: inp.value || null }));
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

    const addBtn = list.querySelector('.goal-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        goalsAddOpen = true;
        goalsAddSteps = 1;
        renderGoals(currentSettings && currentSettings.goals);
        requestAnimationFrame(() => { const i = list.querySelector('.goal-add-input'); if (i) i.focus(); });
      });
    }

    function renderAddStepPreview() {
      const row = list.querySelector('.goal-row-new');
      const stepsEl = row?.querySelector('.goal-steps');
      const countEl = row?.querySelector('.goal-step-count');
      if (stepsEl) {
        stepsEl.innerHTML = Array.from({length: goalsAddSteps}, () =>
          '<span class="goal-step-box" style="opacity:0.3"></span>'
        ).join('');
      }
      if (countEl) countEl.textContent = goalsAddSteps;
    }

    list.querySelectorAll('.goal-add-step-minus').forEach(btn => {
      btn.textContent = '-';
      btn.addEventListener('click', () => {
        goalsAddSteps = Math.max(1, goalsAddSteps - 1);
        renderAddStepPreview();
      });
    });

    list.querySelectorAll('.goal-add-step-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        goalsAddSteps = Math.min(10, goalsAddSteps + 1);
        renderAddStepPreview();
      });
    });

    const addDoneBtn = list.querySelector('.goal-add-done');
    if (addDoneBtn) {
      addDoneBtn.addEventListener('click', () => {
        const inp = list.querySelector('.goal-add-input');
        const dueInp = list.querySelector('.goal-add-due');
        const text = inp ? inp.value.trim() : '';
        const finishBy = dueInp ? (dueInp.value || null) : null;
        goalsAddOpen = false;
        const steps = goalsAddSteps;
        goalsAddSteps = 1;
        if (text) {
          saveGoals([...allGoals, { text, done: false, steps, stepsChecked: 0, completedAt: null, createdAt: Date.now(), finishBy }]);
        }
        else renderGoals(currentSettings && currentSettings.goals);
      });
    }

    const addCancelBtn = list.querySelector('.goal-add-cancel');
    if (addCancelBtn) {
      addCancelBtn.addEventListener('click', () => {
        goalsAddOpen = false;
        goalsAddSteps = 1;
        renderGoals(currentSettings && currentSettings.goals);
      });
    }

    const duePill = list.querySelector('.goal-due-pill');
    const dueClear = list.querySelector('.goal-due-clear');
    const dueHidden = list.querySelector('.goal-add-due');
    if (duePill && dueHidden) {
      dueHidden.addEventListener('change', () => {
        if (dueHidden.value) {
          duePill.textContent = fmtDs(dueHidden.value);
          duePill.classList.add('has-date');
          if (dueClear) dueClear.style.display = '';
        } else {
          duePill.textContent = '+ Due date';
          duePill.classList.remove('has-date');
          if (dueClear) dueClear.style.display = 'none';
        }
      });
      if (dueClear) {
        dueClear.addEventListener('click', () => {
          dueHidden.value = '';
          duePill.textContent = '+ Due date';
          duePill.classList.remove('has-date');
          dueClear.style.display = 'none';
        });
      }
    }

    list.querySelectorAll('.goal-edit-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        goalsEditIdx = +btn.dataset.idx;
        renderGoals(currentSettings && currentSettings.goals);
        requestAnimationFrame(() => {
          const i = list.querySelector(`.goal-input[data-idx="${goalsEditIdx}"]`);
          if (i) { i.focus(); i.select(); }
        });
      });
    });

    list.querySelectorAll('.goal-edit-done').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx  = +btn.dataset.idx;
        const inp  = list.querySelector(`.goal-input[data-idx="${idx}"]`);
        const text = inp ? inp.value.trim() : '';
        goalsEditIdx = -2;
        if (text && text !== (allGoals[idx] || {}).text) {
          saveGoals(allGoals.map((g, i) => i === idx ? { ...g, text } : g));
        } else {
          renderGoals(currentSettings && currentSettings.goals);
        }
      });
    });

    list.querySelectorAll('.goal-edit-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        goalsEditIdx = -2;
        renderGoals(currentSettings && currentSettings.goals);
      });
    });

    list.querySelectorAll('.goal-input').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          inp.closest('.goal-main')?.querySelector('.btn-goal-act')?.click();
        } else if (e.key === 'Escape') {
          inp.closest('.goal-main')?.querySelector('.btn-goal-cancel')?.click();
        }
      });
    });
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

    // Manual overrides stored in settings take priority over session-derived colors
    const calColors = currentSettings?.calendarColors || {};

    // Build day→cls map from sessions. Core is tracked in the Abs/Core tab,
    // but it is intentionally not a dashboard overview calendar paint class.
    const sessionMap = {};
    (currentSessions || []).forEach(s => {
      if (!s.dateRaw) return;
      const parts = s.dateRaw.split('-').map(Number);
      if (parts[0] === year && parts[1] - 1 === month) {
        const day = parts[2];
        const cls = overviewCalendarCls(s.isRestDay ? 'rest' : (s.cls || liftToCls(s.lift) || 'other'));
        if (cls && !sessionMap[day]) sessionMap[day] = cls;
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
    const rgbVarMap = { squat:'--squat-rgb', bench:'--bench-rgb', dead:'--dead-rgb', arm:'--press-rgb', press:'--press-rgb' };

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr  = `${year}-${monthPad}-${String(d).padStart(2,'0')}`;
      const el       = document.createElement('div');
      const manualCls = overviewCalendarCls(calColors[dateStr]);
      const cls       = manualCls || sessionMap[d] || '';
      const isToday  = isThisMonth && d === todayDate;
      const isFuture = isFutureMonth || (isThisMonth && d > todayDate);

      const hasSession = !!sessionMap[d];
      const isPlanned  = !!manualCls && !hasSession;

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
          const base = clsColor(cls);
          const rv2 = rgbVarMap[cls];
          el.style.background = `linear-gradient(180deg,rgba(0,0,0,.35),rgba(255,255,255,.02)),${base}`;
          el.style.boxShadow  = `inset 0 4px 9px rgba(0,0,0,.58)`;
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
      const base = clsColor(c);
      const rv3 = rgbVarMap[c];
      const dotBg = `linear-gradient(180deg,rgba(0,0,0,.35),rgba(255,255,255,.02)),${base}`;
      return `<div class="cal-legend-item"><div class="cal-legend-dot" style="background:${dotBg}"></div>${lbls[c] || c}</div>`;
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

    const groups = [
      { cls:'squat', label:'Legs',  color: clsColor('squat') },
      { cls:'bench', label:'Chest', color: clsColor('bench') },
      { cls:'dead',  label:'Back',  color: clsColor('dead')  },
      { cls:'arm',   label:'Arms',  color: clsColor('arm')   },
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

  const CLS_TO_CAT = { squat:'legs', bench:'chest', dead:'back', arm:'arms' };
  function applyCustomLifts(lifts) {
    const datalist = document.getElementById('lift-options');
    if (!datalist) return;
    datalist.querySelectorAll('option[data-custom]').forEach(o => o.remove());
    (lifts || []).forEach(l => {
      const name = typeof l === 'string' ? l : l.name;
      const cls  = typeof l === 'string' ? '' : normalizeLiftCls(l.cls || '');
      if (!name) return;
      const opt = document.createElement('option');
      opt.value = name;
      opt.dataset.custom = '1';
      opt.dataset.cat = CLS_TO_CAT[cls] || '';
      datalist.appendChild(opt);
    });
  }

  function applyColors(s) {
    const map = {
      squat: s?.colorSquat || '#D6FF3D',
      bench: s?.colorBench || '#5BD6E6',
      dead:  s?.colorDead  || '#FF8A4C',
      press: s?.colorPress || s?.colorArm || '#B78BFF',
    };
    const root = document.documentElement;
    Object.entries(map).forEach(([key, hex]) => {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      const keys = key === 'press' ? ['press', 'arm'] : [key];
      keys.forEach(cssKey => {
        root.style.setProperty(`--${cssKey}`, hex);
        root.style.setProperty(`--${cssKey}-rgb`, `${r},${g},${b}`);
        root.style.setProperty(`--${cssKey}-28`, `rgba(${r},${g},${b},0.28)`);
        root.style.setProperty(`--${cssKey}-55`, `rgba(${r},${g},${b},0.55)`);
      });
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
      _igGoalsCache = currentSettings.goals;
      renderGoals(currentSettings.goals);
      applyCustomLifts(currentSettings.customLifts);
      if (mrValidGender(currentSettings.muscleRecoveryGender) && currentSettings.muscleRecoveryGender !== mrGender) {
        mrPersistGender(currentSettings.muscleRecoveryGender);
        mrSetGender(currentSettings.muscleRecoveryGender, false);
      }
      applyNavAvatar(currentUser, currentSettings.avatarId || null, currentSettings.avatarRingColor || null, currentSettings.avatarBgColor || null, currentSettings.avatarIconColor || null, currentSettings.avatarPhotoUrl || null, currentSettings.avatarZoom != null ? currentSettings.avatarZoom : null, currentSettings.avatarPosX != null ? currentSettings.avatarPosX : null, currentSettings.avatarPosY != null ? currentSettings.avatarPosY : null, true);
    } else {
      currentSettings = null;
      renderProfile(0, 0, 0, 185, '');
      applyColors(null);
      _igGoalsCache = null;
      renderGoals(null);
      applyCustomLifts([]);
    }
    renderLog(currentSessions);
    renderDonut(currentSessions.filter(s => !s.isRestDay));
    updateKPIs();
    renderCalendar();
    renderTracker();
    igCheckChallenges(uid, db, currentSessions, bwAllEntries, currentSettings?.goals);
  }, err => {
    console.error('Settings error:', err.code, err.message);
    renderProfile(0, 0, 0, 185, '');
    renderGoals(null);
    renderTracker();
    updateKPIs();
    renderCalendar();
    showToast('Could not load your data — check your connection and reload.');
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
    settingsRef().set({ personalTrackers: trackers }, { merge: true }).catch(trackerWriteErr);
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
      const restoreBtn = !streak ? `<button class="tracker-restore-btn" data-id="${t.id}" title="Restore streak">↩ Restore streak</button>` : '';
      return `
        <div class="tracker-row" data-id="${t.id}">
          <textarea class="tracker-row-input" placeholder="What are you tracking?" maxlength="60" rows="1" data-id="${t.id}">${safeLabel}</textarea>
          <button class="tracker-row-check${isDone ? ' done' : ''}" data-id="${t.id}">${isDone ? '✓' : ''}</button>
          <span class="tracker-row-streak">${streak ? '🔥 ' + streak + 'd' : restoreBtn}</span>
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
        settingsRef().set({ personalTrackers: updated }, { merge: true }).catch(trackerWriteErr);
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
        settingsRef().set({ personalTrackers: updated }, { merge: true }).catch(trackerWriteErr);
      });
    });

    // Delete tracker
    list.querySelectorAll('.tracker-row-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = (currentSettings?.personalTrackers || []).filter(t => t.id !== btn.dataset.id);
        settingsRef().set({ personalTrackers: updated }, { merge: true }).catch(trackerWriteErr);
      });
    });

    // Restore streak — show inline date picker, backfill all dates from chosen start to today
    list.querySelectorAll('.tracker-restore-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.tracker-row');
        const streakSpan = row.querySelector('.tracker-row-streak');
        streakSpan.innerHTML = `
          <span class="tracker-restore-label">Started</span>
          <input type="date" class="tracker-restore-date" max="${todayISO}">
          <button type="button" class="tracker-restore-set" data-id="${btn.dataset.id}">Set</button>
          <button type="button" class="tracker-restore-cancel">✕</button>`;
        /* Row layout just changed (streak controls now wrap onto their own
           line), which can change the label textarea's available width --
           re-run its auto-height calc so a newly-wrapped second line of
           text isn't clipped by the old, shorter height. */
        const labelInput = row.querySelector('.tracker-row-input');
        if (labelInput) { labelInput.style.height = 'auto'; labelInput.style.height = labelInput.scrollHeight + 'px'; }
        /* The fixed mobile bottom-nav bar can end up physically covering
           this row once it grows taller (date input + Set + Cancel), if
           the row was already near the bottom of the viewport -- taps on
           "Set" would land on the nav bar instead and silently do
           nothing. Scroll the new controls clear of that bar every time
           the form opens. */
        const keepControlsVisible = () => row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        keepControlsVisible();
        const dateInput = streakSpan.querySelector('.tracker-restore-date');
        dateInput.addEventListener('focus', keepControlsVisible);
        dateInput.addEventListener('change', () => setTimeout(keepControlsVisible, 0));
        streakSpan.querySelector('.tracker-restore-cancel').addEventListener('click', () => renderTracker());
        streakSpan.querySelector('.tracker-restore-set').addEventListener('click', (e) => {
          const restoreId = e.currentTarget.dataset.id;
          const dateVal = dateInput.value;
          if (!dateVal) return;
          const dates = [];
          const cur = new Date(dateVal + 'T12:00:00');
          const end = new Date(todayISO + 'T12:00:00');
          while (cur <= end) {
            dates.push(localDateISO(cur));
            cur.setDate(cur.getDate() + 1);
          }
          if (!dates.length) return;
          const prevSettings = currentSettings || {};
          const updated = (currentSettings?.personalTrackers || []).map(t =>
            t.id !== restoreId ? t : { ...t, completedDates: Array.from(new Set([...(t.completedDates || []), ...dates])).sort() }
          );
          currentSettings = { ...prevSettings, personalTrackers: updated };
          renderTracker();
          settingsRef().set({ personalTrackers: updated }, { merge: true })
            .then(() => showToast('Streak restored.', 'success'))
            .catch(err => {
              currentSettings = prevSettings;
              renderTracker();
              trackerWriteErr(err);
            });
        });
      });
    });
  }

  /* Rest day toggle */
  document.getElementById('restDayBtn')?.addEventListener('click', () => {
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

  /* Save & update profile — button lives on profile.html, not here */
  const updateStandardsBtn = document.getElementById('updateStandards');
  if (updateStandardsBtn) updateStandardsBtn.addEventListener('click', () => {
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

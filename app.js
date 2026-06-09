/* IRONLEDGER — Interactive logic, Firebase auth, and per-user data sync.
   Load order: firebase SDKs → firebase-config.js → data.js → this file. */

/* Always start at the very top — prevents browser scrolling to a URL hash */
if (location.hash) history.replaceState(null, null, location.pathname + location.search);
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

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
  const colors = ['#D6FF3D','#5BD6E6','#FF8A4C','#B78BFF','#FF6B6B','#ffffff'];
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
const navSignedIn   = document.getElementById('nav-signed-in');
const navSignedOut  = document.getElementById('nav-signed-out');
const navMobileAuth = document.getElementById('nav-mobile-auth');
const navUserName  = document.getElementById('nav-user-name');
const navAvatar    = document.getElementById('nav-avatar');
const authError    = document.getElementById('authError');

/* ===== AVATAR ===================================================== */
const _CDN = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';
const AVATARS = [
  { id:'bunny',    url:`${_CDN}/Rabbit%20face/3D/rabbit_face_3d.png`,  emoji:'🐰', label:'Bunny',    group:'cute' },
  { id:'cat',      url:`${_CDN}/Cat%20face/3D/cat_face_3d.png`,        emoji:'🐱', label:'Cat',      group:'cute' },
  { id:'unicorn',  url:`${_CDN}/Unicorn/3D/unicorn_3d.png`,            emoji:'🦄', label:'Unicorn',  group:'cute' },
  { id:'flamingo', url:`${_CDN}/Flamingo/3D/flamingo_3d.png`,          emoji:'🦩', label:'Flamingo', group:'cute' },
  { id:'panda',    url:`${_CDN}/Panda/3D/panda_3d.png`,                emoji:'🐼', label:'Panda',    group:'cute' },
  { id:'fox',      url:`${_CDN}/Fox/3D/fox_3d.png`,                    emoji:'🦊', label:'Fox',      group:'cute' },
  { id:'koala',    url:`${_CDN}/Koala/3D/koala_3d.png`,                emoji:'🐨', label:'Koala',    group:'cute' },
  { id:'otter',    url:`${_CDN}/Otter/3D/otter_3d.png`,                emoji:'🦦', label:'Otter',    group:'cute' },
  { id:'wolf',     url:`${_CDN}/Wolf/3D/wolf_3d.png`,                  emoji:'🐺', label:'Wolf',     group:'bold' },
  { id:'lion',     url:`${_CDN}/Lion/3D/lion_3d.png`,                  emoji:'🦁', label:'Lion',     group:'bold' },
  { id:'tiger',    url:`${_CDN}/Tiger%20face/3D/tiger_face_3d.png`,    emoji:'🐯', label:'Tiger',    group:'bold' },
  { id:'bear',     url:`${_CDN}/Bear/3D/bear_3d.png`,                  emoji:'🐻', label:'Bear',     group:'bold' },
  { id:'shark',    url:`${_CDN}/Shark/3D/shark_3d.png`,                emoji:'🦈', label:'Shark',    group:'bold' },
  { id:'gorilla',  url:`${_CDN}/Gorilla/3D/gorilla_3d.png`,            emoji:'🦍', label:'Gorilla',  group:'bold' },
  { id:'trex',     url:`${_CDN}/T-rex/3D/t-rex_3d.png`,                emoji:'🦖', label:'T-Rex',    group:'bold' },
  { id:'dragon',   url:`${_CDN}/Dragon/3D/dragon_3d.png`,              emoji:'🐉', label:'Dragon',   group:'bold' },
];
const AVATAR_BG_COLORS = [
  '#FFB3B3','#FFD0A0','#FFFAAA','#AAFFBB','#AACCFF','#BBAAFF','#FFAAFF','#FFFFFF',
  '#FF2D2D','#FF7700','#FFD700','#22CC44','#1A66FF','#4422CC','#9900CC','#808080',
  '#8B0000','#8B3A00','#8B7000','#005520','#001A8B','#1A0066','#440055','#000000',
];

let currentUser = null;

function applyNavAvatar(user, avatarId, avatarBg) {
  if (!navAvatar) return;
  const av = avatarId && AVATARS.find(a => a.id === avatarId);
  if (av) {
    navAvatar.style.cssText = `background:${avatarBg || '#1a1c1e'};`;
    navAvatar.innerHTML = `<img src="${av.url}" alt="" style="width:26px;height:26px;object-fit:contain;">`;
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
  let obBg   = null;

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
      <div class="eyebrow">Welcome to IronLedger</div>
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

  /* ---- Step 2: Avatar picker ---- */
  function renderStepAvatar() {
    card.innerHTML = `
      <div class="eyebrow">Pick your character</div>
      <h2 class="title" style="margin:6px 0 6px;">Choose your avatar</h2>
      <p class="sub" style="margin-bottom:22px;">You can always change it in Settings.</p>
      <p class="ob-group-label">Cute &amp; soft</p>
      <div id="ob-cute" class="avatar-grid" style="margin-bottom:16px;"></div>
      <p class="ob-group-label">Cool &amp; bold</p>
      <div id="ob-bold" class="avatar-grid" style="margin-bottom:24px;"></div>
      <button id="ob-skip-av" class="btn btn-ghost" style="font-size:13px;padding:10px 16px;width:100%;margin-bottom:8px;">Skip for now</button>
      <button id="ob-back-av" class="btn btn-ghost" style="font-size:13px;padding:6px 16px;width:100%;">← Back</button>
    `;
    ['cute','bold'].forEach(group => {
      document.getElementById(`ob-${group}`).innerHTML = AVATARS.filter(a => a.group === group).map(a =>
        `<button class="avatar-option${obId === a.id ? ' av-selected' : ''}" data-id="${a.id}" title="${a.label}">
          <img src="${a.url}" alt="${a.label}" style="width:46px;height:46px;object-fit:contain;" onerror="this.style.display='none'">
        </button>`
      ).join('');
    });
    card.querySelectorAll('.avatar-option').forEach(btn => {
      btn.addEventListener('click', () => { obId = btn.dataset.id; renderStepColor(); });
    });
    document.getElementById('ob-skip-av').addEventListener('click', () => finishOnboarding(false));
    document.getElementById('ob-back-av').addEventListener('click', renderStepName);
  }

  /* ---- Step 3: Circle color ---- */
  function renderStepColor() {
    const av = AVATARS.find(a => a.id === obId);
    const bg = obBg || '#1a1c1e';
    card.innerHTML = `
      <div class="eyebrow">Almost there</div>
      <h2 class="title" style="margin:6px 0 6px;">Pick a circle color</h2>
      <p class="sub" style="margin-bottom:18px;">Choose a background for your avatar.</p>
      <div style="display:flex;justify-content:center;margin-bottom:20px;">
        <div id="ob-ring" style="width:72px;height:72px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.12);transition:background .15s;">
          <img src="${av?.url || ''}" alt="" style="width:60px;height:60px;object-fit:contain;">
        </div>
      </div>
      <div id="ob-colors" class="avatar-bg-grid" style="margin-bottom:24px;"></div>
      <button id="ob-done" class="btn btn-primary" style="width:100%;margin-bottom:10px;">Done</button>
      <button id="ob-back-color" class="btn btn-ghost" style="font-size:13px;padding:10px 16px;width:100%;">← Back</button>
    `;
    const picker = document.getElementById('ob-colors');
    picker.innerHTML = AVATAR_BG_COLORS.map(c =>
      `<div class="avatar-bg-swatch${obBg === c ? ' bg-selected' : ''}" data-color="${c}" style="background:${c};"></div>`
    ).join('');
    picker.querySelectorAll('.avatar-bg-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        obBg = sw.dataset.color;
        document.getElementById('ob-ring').style.background = obBg;
        picker.querySelectorAll('.avatar-bg-swatch').forEach(s => s.classList.remove('bg-selected'));
        sw.classList.add('bg-selected');
      });
    });
    document.getElementById('ob-done').addEventListener('click', () => finishOnboarding(true));
    document.getElementById('ob-back-color').addEventListener('click', renderStepAvatar);
  }

  /* ---- Finish ---- */
  async function finishOnboarding(save) {
    overlay.remove();
    if (save && obId) {
      const update = { avatarId: obId };
      if (obBg) update.avatarBg = obBg;
      try {
        await db.collection('users').doc(user.uid).collection('settings').doc('main').set(update, { merge: true });
      } catch(e) {}
      applyNavAvatar(user, obId, obBg);
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
    if (navMobileAuth) navMobileAuth.style.display = 'none';
    navUserName.textContent = user.displayName || user.email.split('@')[0];
    applyNavAvatar(user, null, null); // placeholder; overridden by onSnapshot once settings load
    initApp(user.uid);
  } else {
    /* ---- Signed out — show landing page, render empty cards ---- */
    isSignedIn = false;
    authScreen.style.display   = 'none';
    mainContent.style.display  = '';
    navSignedIn.style.display  = 'none';
    navSignedOut.style.display = '';
    if (navMobileAuth) navMobileAuth.style.display = '';
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
document.getElementById('navSignInMobile')?.addEventListener('click', () => {
  navLinksEl.classList.remove('open');
  openAuthModal();
});
document.getElementById('navSignUpMobile')?.addEventListener('click', () => {
  navLinksEl.classList.remove('open');
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

let unsubscribeSessions = null;   // track live listeners so we can
let unsubscribeSettings = null;   // clean them up on sign-out

function initApp(uid) {
  /* Tear down any listeners left from a previous session */
  if (unsubscribeSessions) { unsubscribeSessions(); unsubscribeSessions = null; }
  if (unsubscribeSettings) { unsubscribeSettings(); unsubscribeSettings = null; }

  /* Shorthand helpers for this user's Firestore sub-collections */
  const sessionsRef = () => db.collection('users').doc(uid).collection('sessions');
  const settingsRef = () => db.collection('users').doc(uid).collection('settings').doc('main');

  let goalsDonePage = 1;
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

      items.forEach(g => {
        const pct   = g.sets / total;
        const sweep = pct * 360;
        const color = getDonutColor(g.cls);
        const gap   = items.length > 1 ? 2 : 0;
        paths += `<path fill="${color}" d="${segmentPath(cx, cy, ro, ri, angle + gap/2, angle + sweep - gap/2)}"/>`;
        legendHTML += `
          <div class="donut-legend-row">
            <span class="donut-dot" style="background:${color}"></span>
            <span class="donut-lift">${g.lift}</span>
            <span class="donut-pct">${Math.round(pct * 100)}%</span>
          </div>`;
        angle += sweep;
      });

      svg.innerHTML = paths +
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

      const W = 700, H = 240;
      const padL = 52, padR = 24, padT = 24, padB = 52;
      const chartW = W - padL - padR, chartH = H - padT - padB;

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

      let dots = '', labels = '';
      liftSessions.forEach((s, i) => {
        const x = xOf(i).toFixed(1), y = yOf(s.wt).toFixed(1);
        const [, m, d] = s.dateRaw.split('-').map(Number);
        const lbl = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}`;
        dots   += `<circle cx="${x}" cy="${y}" r="5" fill="var(--accent)" stroke="var(--bg)" stroke-width="2.5"/>`;
        labels += `<text x="${x}" y="${H - 10}" text-anchor="middle" class="axis-label">${lbl}</text>`;
      });

      svg.innerHTML =
        `<defs><linearGradient id="hgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient></defs>` +
        grid +
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
    const orm = Math.round(w * (1 + r / 30));
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
            <td style="color:var(--text-dim)">${s.date}</td>
            <td><span class="pill rest">Rest Day</span></td>
            <td style="color:var(--text-dimmer)">—</td>
            <td style="color:var(--text-dimmer)">—</td>
            <td style="color:var(--text-dimmer)">—</td>
            <td class="row-actions">
              <button class="btn-delete" data-id="${s.id}" title="Remove">✕</button>
            </td>
          </tr>` : `
          <tr data-id="${s.id}">
            <td style="color:var(--text-dim)">${s.date}</td>
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
    sessionsRef().add({ date: formatDate(dateVal), dateRaw: dateVal,
                        lift, cls, sets, reps, wt, note,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => { ['logSets','logReps','logWeight','logNote'].forEach(id => document.getElementById(id).value = ''); })
      .catch(err => alert('Could not save: ' + err.message));
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
      if (!dateVal || !sets || !reps || !wt) { alert('Please fill in all fields.'); return; }
      const lift = liftVal.trim();
      const cls  = liftToCls(lift);
      sessionsRef().doc(id)
        .update({ date: formatDate(dateVal), dateRaw: dateVal, lift, cls, sets, reps, wt, note })
        .catch(err => alert('Could not save: ' + err.message));
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
          .catch(err => alert('Could not delete: ' + err.message));
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

    if (!sq && !bn && !dl) { statGrid.innerHTML = ''; dnaCard.style.display = 'none'; return; }

    const sR = bw ? sq / bw : 0, bR = bw ? bn / bw : 0, dR = bw ? dl / bw : 0;
    const big3 = sq + bn + dl;
    const totalR = bw ? (big3 / bw).toFixed(1) : '—';
    const bmi    = hIn ? ((bw / (hIn * hIn)) * 703).toFixed(1) : null;
    const bmiDesc = !bmi ? '' : +bmi < 18.5 ? 'Underweight' : +bmi < 25 ? 'Normal range' : +bmi < 30 ? 'Overweight' : 'Obese';
    const ipfCls  = getIpfClass(bw);
    const totalDesc = +totalR < 4 ? 'Beginner range' : +totalR < 5 ? 'Intermediate range' : +totalR < 6 ? 'Advanced range' : 'Elite range';

    statGrid.innerHTML =
      (hIn ? `<div class="stat-tile"><div class="st-label">Height</div>
        <div class="st-value">${Math.floor(hIn/12)}'${hIn%12}<span>in</span></div>
        <div class="st-sub">${Math.round(hIn*2.54)} cm</div></div>` : '') +
      `<div class="stat-tile"><div class="st-label">Bodyweight</div>
        <div class="st-value">${bw}<span>lbs</span></div>
        <div class="st-sub">${(bw/2.2046).toFixed(1)} kg</div></div>` +
      (bmi ? `<div class="stat-tile"><div class="st-label">BMI</div>
        <div class="st-value">${bmi}</div>
        <div class="st-sub">${bmiDesc}</div></div>` : '') +
      `<div class="stat-tile highlight"><div class="st-label">Big-3 Total</div>
        <div class="st-value">${big3.toLocaleString()}<span>lbs</span></div>
        <div class="st-sub">${(big3/2.2046).toFixed(0)} kg</div></div>
      <div class="stat-tile"><div class="st-label">Total / Bodyweight</div>
        <div class="st-value">${totalR}<span>×</span></div>
        <div class="st-sub">${totalDesc}</div></div>
      <div class="stat-tile"><div class="st-label">IPF Weight Class</div>
        <div class="st-value" style="font-size:24px;">${ipfCls}<span>kg</span></div>
        <div class="st-sub">You'd compete at ${ipfCls} kg</div></div>`;

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
    const active   = allGoals.map((g, i) => ({ ...g, _i: i })).filter(g => !g.done);
    const done     = allGoals.map((g, i) => ({ ...g, _i: i })).filter(g => g.done)
                             .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    if (tally) {
      const total = allGoals.length;
      tally.textContent = total ? `${done.length} / ${total} done` : '';
    }

    function goalRow(g, isDone) {
      const steps        = g.steps || 1;
      const stepsChecked = isDone ? steps : (g.stepsChecked || 0);
      const boxes = Array.from({length: steps}, (_, i) =>
        `<span class="goal-step-box${i < stepsChecked ? ' checked' : ''}" data-idx="${g._i}" data-step="${i}"></span>`
      ).join('');
      const resetBtn = !isDone && steps > 1 && stepsChecked > 0
        ? `<button class="goal-reset-btn" data-idx="${g._i}" title="Reset progress">↺</button>`
        : '';
      const adjuster = !isDone ? `
        <div class="goal-steps-adj">
          <button class="goal-step-btn goal-step-minus" data-idx="${g._i}">−</button>
          <span class="goal-step-count">${steps}</span>
          <button class="goal-step-btn goal-step-plus" data-idx="${g._i}">+</button>
        </div>` : '';
      return `
        <div class="goal-row${isDone ? ' goal-row-done' : ''}">
          <div class="goal-steps">${boxes}${resetBtn}</div>
          <input type="text" class="goal-input${isDone ? ' goal-done' : ''}"
                 data-idx="${g._i}" value="${esc(g.text)}"
                 placeholder="" maxlength="60" autocomplete="off">
          ${adjuster}
          <button class="btn-delete goal-delete" data-idx="${g._i}" title="Delete goal">✕</button>
        </div>`;
    }

    const newRow = `
      <div class="goal-row goal-row-new">
        <div class="goal-steps"><span class="goal-step-box" style="opacity:0.3"></span></div>
        <input type="text" class="goal-input goal-input-new"
               data-idx="-1" value="" placeholder="Add a goal…" maxlength="60" autocomplete="off">
      </div>`;

    const totalPages = Math.max(1, Math.ceil(done.length / GOALS_DONE_PAGE));
    if (goalsDonePage > totalPages) goalsDonePage = totalPages;
    const pagSlice   = done.slice((goalsDonePage - 1) * GOALS_DONE_PAGE, goalsDonePage * GOALS_DONE_PAGE);

    const divider = done.length ? '<div class="goals-divider"></div>' : '';

    list.innerHTML =
      active.map(g => goalRow(g, false)).join('') +
      newRow +
      divider +
      pagSlice.map(g => goalRow(g, true)).join('');

    if (pag) {
      if (done.length > GOALS_DONE_PAGE) {
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
        .catch(err => console.error('Goal save:', err));
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

    const newInp = list.querySelector('.goal-input-new');
    if (newInp) {
      newInp.addEventListener('blur', () => {
        const text = newInp.value.trim();
        if (text) saveGoals([...allGoals, { text, done: false, steps: 1, stepsChecked: 0, completedAt: null }]);
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
          el.style.background = colors[cls] || colors.other;
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
    legend.innerHTML = used.map(c => {
      const bg = c === 'rest' ? 'rgba(107,114,128,0.4)' : (colors[c] || colors.other);
      return `<div class="cal-legend-item"><div class="cal-legend-dot" style="background:${bg}"></div>${lbls[c] || c}</div>`;
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
        settingsRef().update(update).catch(console.error);
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
      applyNavAvatar(currentUser, currentSettings.avatarId || null, currentSettings.avatarBg || null);
    } else {
      currentSettings = null;
      renderProfile(0, 0, 0, 185, '');
      applyColors(null);
      renderGoals(null);
      applyCustomLifts([]);
    }
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
  document.getElementById('trackerAddBtn')?.addEventListener('click', () => {
    const trackers = [...(currentSettings?.personalTrackers || [])];
    trackers.push({ id: 't' + Date.now(), label: '', completedDates: [] });
    settingsRef().update({ personalTrackers: trackers }).catch(console.error);
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
        settingsRef().update({ personalTrackers: updated }).catch(console.error);
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
        settingsRef().update({ personalTrackers: updated }).catch(console.error);
      });
    });

    // Delete tracker
    list.querySelectorAll('.tracker-row-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = (currentSettings?.personalTrackers || []).filter(t => t.id !== btn.dataset.id);
        settingsRef().update({ personalTrackers: updated }).catch(console.error);
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
      .catch(err => console.error('Rest day save:', err));
    if (isOn) {
      const sess = currentSessions.find(s => s.isRestDay && s.dateRaw === today);
      if (sess) sessionsRef().doc(sess.id).delete().catch(console.error);
    } else {
      sessionsRef().add({
        date: formatDate(today), dateRaw: today,
        lift: 'Rest Day', cls: 'rest', sets: 0, reps: 0, wt: 0, note: '',
        isRestDay: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).catch(console.error);
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

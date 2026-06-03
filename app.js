/* IRONLEDGER — Interactive logic, Firebase auth, and per-user data sync.
   Load order: firebase SDKs → firebase-config.js → data.js → this file. */

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
const authError    = document.getElementById('authError');

/* ===== AUTH — SIGN IN / SIGN UP / SIGN OUT ========================
   Firebase watches auth state automatically — we just react to it. */

auth.onAuthStateChanged(user => {
  if (user) {
    /* ---- Signed in ---- */
    authScreen.style.display  = 'none';
    mainContent.style.display = '';
    navSignedIn.style.display = 'flex';
    navSignedOut.style.display = 'none';
    navUserName.textContent   = user.displayName || user.email.split('@')[0];
    initApp(user.uid);
  } else {
    /* ---- Signed out ---- */
    authScreen.style.display  = '';
    mainContent.style.display = 'none';
    navSignedIn.style.display  = 'none';
    navSignedOut.style.display = '';
  }
});

/* Google sign-in */
document.getElementById('googleSignIn').addEventListener('click', () => {
  authError.textContent = '';
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
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

  const todayISO = new Date().toISOString().split('T')[0];
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
    if (popup.style.display === 'none') { renderCalendar(); popup.style.display = 'block'; }
    else popup.style.display = 'none';
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

  /* ---- 1) ANIMATED COUNT-UP ----------------------------------------
     When a section scrolls into view, numbers count up from 0. */
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
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-count]').forEach(n => {
          if (!counted.has(n)) { counted.add(n); animateCount(n); }
        });
        e.target.classList.add('in');
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(s => io.observe(s));
  /* Trigger immediately for anything already visible on load */
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(s => {
      if (s.getBoundingClientRect().top < window.innerHeight * 0.9) {
        s.classList.add('in');
      }
    });
  }, 50);

  /* ---- 2) PROGRESS CHART (hand-drawn SVG, no chart library) -------- */
  const chartEl = document.getElementById('chart');
  const noteEl  = document.getElementById('chartNote');
  const W = 920, H = 300, padL = 46, padR = 20, padT = 24, padB = 34;

  function drawChart(key) {
    const { data, color, label } = lifts[key];
    const min = Math.min(...data) - 15, max = Math.max(...data) + 15;
    const x = i => padL + i * (W - padL - padR) / (data.length - 1);
    const y = v => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);

    let grid = '';
    for (let g = 0; g <= 4; g++) {
      const val = Math.round(min + (max - min) * g / 4);
      const gy = padT + (1 - g / 4) * (H - padT - padB);
      grid += `<line x1="${padL}" y1="${gy}" x2="${W-padR}" y2="${gy}" stroke="rgba(255,255,255,0.06)"/>`;
      grid += `<text class="axis-label" x="${padL-10}" y="${gy+4}" text-anchor="end">${val}</text>`;
    }
    let xlab = '';
    data.forEach((d, i) => {
      if (i % 2 === 0) xlab += `<text class="axis-label" x="${x(i)}" y="${H-12}" text-anchor="middle">W${i+1}</text>`;
    });
    const line = data.map((d,i) => `${i?'L':'M'}${x(i).toFixed(1)} ${y(d).toFixed(1)}`).join(' ');
    const area = `M${x(0)} ${H-padB} ` + data.map((d,i) => `L${x(i).toFixed(1)} ${y(d).toFixed(1)}`).join(' ') + ` L${x(data.length-1)} ${H-padB} Z`;
    const dots = data.map((d,i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(d).toFixed(1)}" r="${i===data.length-1?5:3}" fill="${color}"/>`).join('');
    chartEl.innerHTML = `
      <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      ${grid}${xlab}
      <path d="${area}" fill="url(#ag)"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}`;
    noteEl.textContent = `${label} · +${data[data.length-1] - data[0]} lbs since week 1`;
  }
  document.getElementById('liftToggle').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#liftToggle button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    drawChart(b.dataset.lift);
  });
  drawChart('squat');

  /* ---- 3) ONE-REP-MAX CALCULATOR ----------------------------------- */
  const ormEl   = document.getElementById('orm');
  const pctBody = document.getElementById('pctBody');
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
  ['lift','weight','reps'].forEach(id => document.getElementById(id).addEventListener('input', calc));
  calc();

  /* ---- 4) TRAINING LOG --------------------------------------------- */

  /* Maps a lift name to a pill colour class. Unknown lifts → 'other' (neutral). */
  function liftToCls(name) {
    const n = (name || '').toLowerCase().trim();
    if (['squat','split squat','hack squat'].includes(n))             return 'squat';
    if (['bench','bench press','incline press'].includes(n))           return 'bench';
    if (['deadlift'].includes(n))                                      return 'dead';
    if (['overhead press','ohp','dips','push-up','lateral raise'].includes(n)) return 'press';
    if (['row','pulldown','pull-up','bicep curl'].includes(n))         return 'dead';
    if (['tricep pushdown'].includes(n))                               return 'press';
    if (['leg extension','leg curl','calf raise'].includes(n))         return 'squat';
    return 'other';
  }

  function formatDate(dateStr) {
    const [, m, d] = dateStr.split('-').map(Number);
    return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}`;
  }

  /* Shared state so both listeners can trigger a KPI refresh */
  let currentSessions = [];
  let currentSettings = null;

  function updateKPIs() {
    const now        = new Date();
    const thisMonth  = now.getMonth();
    const thisYear   = now.getFullYear();

    /* Sessions that have a dateRaw and fall in the current calendar month */
    const monthSess  = currentSessions.filter(s => {
      if (!s.dateRaw) return false;
      const [y, m] = s.dateRaw.split('-').map(Number);
      return y === thisYear && m - 1 === thisMonth;
    });

    /* Volume = sets × reps × weight for each month session */
    const volume     = monthSess.reduce((sum, s) => sum + (s.sets * s.reps * s.wt), 0);
    const count      = monthSess.length;

    /* Streak = consecutive days (going back from today) that have any session */
    const sessionDays = new Set(currentSessions.map(s => s.dateRaw).filter(Boolean));
    let streak = 0;
    const cursor = new Date(); cursor.setHours(12, 0, 0, 0);
    for (let i = 0; i < 366; i++) {
      const iso = cursor.toISOString().split('T')[0];
      if (sessionDays.has(iso)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        cursor.setDate(cursor.getDate() - 1); // no session today — check yesterday
      } else {
        break;
      }
    }

    /* Big-3 = saved maxes from settings */
    const s = currentSettings;
    const big3 = s ? (s.squatMax || 0) + (s.benchMax || 0) + (s.deadMax || 0) : 0;

    /* Update the four cards */
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('kpi-volume',   volume ? volume.toLocaleString() : '0');
    set('kpi-sessions', count);
    set('kpi-streak',   streak);
    set('kpi-big3',     big3 ? big3.toLocaleString() : '—');

    set('kpi-volume-delta',   count ? `across ${count} session${count !== 1 ? 's' : ''}` : 'No sessions this month yet');
    set('kpi-sessions-delta', count ? 'logged this month' : 'Add your first session below');
    set('kpi-streak-delta',   streak ? `day${streak !== 1 ? 's' : ''} in a row` : 'Log a session to start a streak');
    set('kpi-big3-delta',     s && big3 ? `${s.squatMax} + ${s.benchMax} + ${s.deadMax} lbs` : 'Set your maxes in Standards below');
  }

  function renderLog(sessions) {
    currentSessions = sessions;
    document.getElementById('logBody').innerHTML = sessions.length
      ? sessions.map(s => `
          <tr data-id="${s.id}">
            <td style="color:var(--text-dim)">${s.date}</td>
            <td><span class="pill ${s.cls}">${s.lift}</span></td>
            <td>${s.sets} × ${s.reps}</td>
            <td>${s.wt} lbs</td>
            <td>${(s.sets * s.reps * s.wt).toLocaleString()} lbs</td>
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
  }

  /* Builds an inline-editable version of a row */
  function buildEditRow(s) {
    const dateVal = s.dateRaw || new Date().toISOString().split('T')[0];
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
        <td style="color:var(--text-dimmer);font-size:12px;font-family:var(--mono);">auto</td>
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
      renderLog(currentSessions);
      updateKPIs();
    }, err => {
      console.error('Sessions error:', err.code, err.message);
      renderLog([]);
      updateKPIs();
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

  /* ---- 5) STRENGTH STANDARDS + BODYWEIGHT SELECTOR ----------------- */
  const liftColors = { squat:'var(--squat)', bench:'var(--bench)', dead:'var(--dead)' };

  function renderStandards(squatMax, benchMax, deadMax, bodyweight) {
    const tiers = bodyweightStandards[+bodyweight] || bodyweightStandards[181];
    const liftDefs = [
      { lift:'Squat',    cls:'squat', current:+squatMax, tiers:tiers.squat },
      { lift:'Bench',    cls:'bench', current:+benchMax, tiers:tiers.bench },
      { lift:'Deadlift', cls:'dead',  current:+deadMax,  tiers:tiers.dead  },
    ];
    document.getElementById('standards-list').innerHTML = liftDefs.map(s => {
      const maxScale = s.tiers[s.tiers.length - 1];
      const pct = Math.min(s.current / maxScale * 100, 100);
      let tierIdx = 0;
      s.tiers.forEach((t, i) => { if (s.current >= t) tierIdx = i; });
      return `
      <div class="std-row card" style="padding:20px 22px;">
        <div class="head">
          <span class="lift">${s.lift}</span>
          <span class="val">${s.current} lbs · <b style="color:${liftColors[s.cls]}">${tierNames[tierIdx]}</b></span>
        </div>
        <div class="track">
          <div class="fill" data-w="${pct.toFixed(1)}"
               style="width:0;background:linear-gradient(90deg,${liftColors[s.cls]}88,${liftColors[s.cls]})">
          </div>
        </div>
        <div class="ticks">
          ${tierNames.map((n,i) => `<span class="${i===tierIdx?'here':''}">${n}</span>`).join('')}
        </div>
      </div>`;
    }).join('');
    setTimeout(() => {
      document.querySelectorAll('#standards-list .fill').forEach(f => { f.style.width = f.dataset.w + '%'; });
    }, 60);
    document.getElementById('squatInput').value    = squatMax;
    document.getElementById('benchInput').value    = benchMax;
    document.getElementById('deadInput').value     = deadMax;
    document.getElementById('bodyweightSel').value = +bodyweight;
  }

  /* Live listener for this user's settings */
  unsubscribeSettings = settingsRef().onSnapshot(doc => {
    if (doc.exists) {
      currentSettings = doc.data();
      const { squatMax, benchMax, deadMax, bodyweight } = currentSettings;
      renderStandards(squatMax, benchMax, deadMax, bodyweight);
    } else {
      currentSettings = null;
      renderStandards(315, 225, 405, 181);
    }
    updateKPIs();
  }, err => {
    console.error('Settings error:', err.code, err.message);
    renderStandards(315, 225, 405, 181);
    updateKPIs();
  });

  /* Save & update bars */
  document.getElementById('updateStandards').addEventListener('click', () => {
    const squatMax   = +document.getElementById('squatInput').value;
    const benchMax   = +document.getElementById('benchInput').value;
    const deadMax    = +document.getElementById('deadInput').value;
    const bodyweight = +document.getElementById('bodyweightSel').value;
    if (!squatMax || !benchMax || !deadMax) {
      alert('Please enter a current max for all three lifts.'); return;
    }
    settingsRef().set({ squatMax, benchMax, deadMax, bodyweight })
      .catch(err => alert('Could not save: ' + err.message));
  });

  /* ---- 6) SETTINGS — update display name ----------------------------- */
  document.getElementById('settingsName').value  = auth.currentUser.displayName || '';
  document.getElementById('settingsEmail').value = auth.currentUser.email || '';

  document.getElementById('saveSettings').addEventListener('click', async () => {
    const newName = document.getElementById('settingsName').value.trim();
    const msg     = document.getElementById('settingsMsg');
    const btn     = document.getElementById('saveSettings');

    msg.textContent = '';

    if (!newName) {
      msg.style.color = 'var(--down)';
      msg.textContent = 'Please enter a display name.';
      return;
    }

    btn.textContent = 'Saving…';
    btn.disabled    = true;

    try {
      await auth.currentUser.updateProfile({ displayName: newName });
      navUserName.textContent = newName;
      msg.style.color         = 'var(--up)';
      msg.textContent         = '✓ Display name updated.';
      setTimeout(() => { msg.textContent = ''; }, 3000);
    } catch (err) {
      msg.style.color = 'var(--down)';
      msg.textContent = err.message || 'Something went wrong — please try again.';
    } finally {
      btn.textContent = 'Save changes';
      btn.disabled    = false;
    }
  });

} /* end initApp */

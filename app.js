/* IRONLEDGER — Interactive logic + Firebase sync.
   Load order: firebase-app-compat.js → firebase-firestore-compat.js
               → firebase-config.js → data.js → this file. */

/* ===== FIREBASE INIT ==============================================
   If firebase-config.js still has placeholder values the app falls
   back gracefully to sample data so the page renders correctly. */
const CONFIGURED = (typeof firebaseConfig !== 'undefined') &&
                   typeof firebaseConfig.apiKey === 'string' &&
                   !firebaseConfig.apiKey.startsWith('PASTE');
let db = null;
if (CONFIGURED) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

/* ---- 1) ANIMATED COUNT-UP ----------------------------------------
   When a number scrolls into view, ticks it up from 0 to its target. */
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

/* ---- 2) PROGRESS CHART (hand-drawn SVG, no chart library) ----------
   Turns the 12-week data arrays from data.js into an SVG line chart. */
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
    grid += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="rgba(255,255,255,0.06)"/>`;
    grid += `<text class="axis-label" x="${padL - 10}" y="${gy + 4}" text-anchor="end">${val}</text>`;
  }
  let xlab = '';
  data.forEach((d, i) => {
    if (i % 2 === 0) xlab += `<text class="axis-label" x="${x(i)}" y="${H - 12}" text-anchor="middle">W${i + 1}</text>`;
  });

  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d).toFixed(1)}`).join(' ');
  const area = `M${x(0)} ${H - padB} ` + data.map((d, i) => `L${x(i).toFixed(1)} ${y(d).toFixed(1)}`).join(' ') + ` L${x(data.length - 1)} ${H - padB} Z`;
  const dots = data.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(d).toFixed(1)}" r="${i === data.length - 1 ? 5 : 3}" fill="${color}"/>`).join('');

  chartEl.innerHTML = `
    <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${grid}${xlab}
    <path d="${area}" fill="url(#ag)"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}`;
  noteEl.textContent = `${label} · +${data[data.length - 1] - data[0]} lbs since week 1`;
}
document.getElementById('liftToggle').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  document.querySelectorAll('#liftToggle button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  drawChart(b.dataset.lift);
});
drawChart('squat');

/* ---- 3) ONE-REP-MAX CALCULATOR ------------------------------------ */
const ormEl   = document.getElementById('orm');
const pctBody = document.getElementById('pctBody');

function calc() {
  const w = +document.getElementById('weight').value || 0;
  const r = +document.getElementById('reps').value || 1;
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
['lift', 'weight', 'reps'].forEach(id => document.getElementById(id).addEventListener('input', calc));
calc();

/* ---- 4) TRAINING LOG --------------------------------------------- */

/* Converts "2026-06-03" (from <input type="date">) → "Jun 3" */
function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[m - 1]} ${d}`;
}

function renderLog(sessions) {
  document.getElementById('logBody').innerHTML = sessions.length
    ? sessions.map(s => `
        <tr>
          <td style="color:var(--text-dim)">${s.date}</td>
          <td><span class="pill ${s.cls}">${s.lift}</span></td>
          <td>${s.sets} × ${s.reps}</td>
          <td>${s.wt} lbs</td>
          <td>${(s.sets * s.reps * s.wt).toLocaleString()} lbs</td>
          <td>${s.note
            ? '<span class="pr-flag">★ ' + s.note + '</span>'
            : '<span style="color:var(--text-dimmer)">—</span>'}</td>
          <td>${s.id
            ? '<button class="btn-delete" data-id="' + s.id + '" title="Remove this session">✕</button>'
            : ''}</td>
        </tr>`).join('')
    : `<tr><td colspan="7" style="color:var(--text-dimmer);text-align:center;padding:32px 0;">
         No sessions logged yet — add one above.
       </td></tr>`;
}

/* Default the date picker to today */
document.getElementById('logDate').valueAsDate = new Date();

if (db) {
  /* Real-time listener: table rebuilds the instant Firestore changes */
  db.collection('sessions')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      snap => renderLog(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      err  => console.error('Session listener:', err)
    );

  /* Add a new session */
  document.getElementById('addSession').addEventListener('click', () => {
    const dateVal = document.getElementById('logDate').value;
    const liftVal = document.getElementById('logLift').value;  // "Squat|squat"
    const sets    = +document.getElementById('logSets').value;
    const reps    = +document.getElementById('logReps').value;
    const wt      = +document.getElementById('logWeight').value;
    const note    = document.getElementById('logNote').value.trim();

    if (!dateVal || !sets || !reps || !wt) {
      alert('Please fill in date, sets, reps, and weight before adding.');
      return;
    }
    const [lift, cls] = liftVal.split('|');
    db.collection('sessions')
      .add({ date: formatDate(dateVal), lift, cls, sets, reps, wt, note,
             createdAt: firebase.firestore.FieldValue.serverTimestamp() })
      .then(() => {
        /* Keep date and lift — clear the numbers for a quick next entry */
        ['logSets', 'logReps', 'logWeight', 'logNote']
          .forEach(id => { document.getElementById(id).value = ''; });
      })
      .catch(err => alert('Could not save: ' + err.message));
  });

  /* Delete — event delegation so it works on dynamically added rows */
  document.getElementById('logBody').addEventListener('click', e => {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;
    if (confirm('Remove this session from your log?')) {
      db.collection('sessions').doc(btn.dataset.id).delete()
        .catch(err => alert('Could not delete: ' + err.message));
    }
  });

} else {
  /* Firebase not configured yet — show sample data */
  renderLog(log);
}

/* ---- 5) STRENGTH STANDARDS + BODYWEIGHT SELECTOR ----------------- */
const liftColors = { squat: 'var(--squat)', bench: 'var(--bench)', dead: 'var(--dead)' };

function renderStandards(squatMax, benchMax, deadMax, bodyweight) {
  const tiers = bodyweightStandards[+bodyweight] || bodyweightStandards[181];
  const liftDefs = [
    { lift: 'Squat',    cls: 'squat', current: +squatMax, tiers: tiers.squat },
    { lift: 'Bench',    cls: 'bench', current: +benchMax, tiers: tiers.bench },
    { lift: 'Deadlift', cls: 'dead',  current: +deadMax,  tiers: tiers.dead  },
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
        <span class="val">${s.current} lbs
          · <b style="color:${liftColors[s.cls]}">${tierNames[tierIdx]}</b></span>
      </div>
      <div class="track">
        <div class="fill" data-w="${pct.toFixed(1)}"
             style="width:0;background:linear-gradient(90deg,${liftColors[s.cls]}88,${liftColors[s.cls]})">
        </div>
      </div>
      <div class="ticks">
        ${tierNames.map((n, i) => `<span class="${i === tierIdx ? 'here' : ''}">${n}</span>`).join('')}
      </div>
    </div>`;
  }).join('');

  /* Animate bars (short delay lets the DOM settle) */
  setTimeout(() => {
    document.querySelectorAll('#standards-list .fill')
      .forEach(f => { f.style.width = f.dataset.w + '%'; });
  }, 60);

  /* Keep input fields in sync with what's displayed */
  document.getElementById('squatInput').value    = squatMax;
  document.getElementById('benchInput').value    = benchMax;
  document.getElementById('deadInput').value     = deadMax;
  document.getElementById('bodyweightSel').value = +bodyweight;
}

if (db) {
  /* Real-time listener for user settings */
  db.collection('userSettings').doc('main').onSnapshot(
    doc => {
      if (doc.exists) {
        const { squatMax, benchMax, deadMax, bodyweight } = doc.data();
        renderStandards(squatMax, benchMax, deadMax, bodyweight);
      } else {
        renderStandards(315, 225, 405, 181);   // first-time defaults
      }
    },
    err => console.error('Settings listener:', err)
  );

  /* Save & update bars */
  document.getElementById('updateStandards').addEventListener('click', () => {
    const squatMax   = +document.getElementById('squatInput').value;
    const benchMax   = +document.getElementById('benchInput').value;
    const deadMax    = +document.getElementById('deadInput').value;
    const bodyweight = +document.getElementById('bodyweightSel').value;
    if (!squatMax || !benchMax || !deadMax) {
      alert('Please enter a current max for all three lifts.');
      return;
    }
    db.collection('userSettings').doc('main')
      .set({ squatMax, benchMax, deadMax, bodyweight })
      .catch(err => alert('Could not save: ' + err.message));
  });

} else {
  /* Firebase not configured — render defaults, allow local-only preview */
  renderStandards(315, 225, 405, 181);
  document.getElementById('updateStandards').addEventListener('click', () => {
    renderStandards(
      +document.getElementById('squatInput').value   || 315,
      +document.getElementById('benchInput').value   || 225,
      +document.getElementById('deadInput').value    || 405,
      +document.getElementById('bodyweightSel').value || 181
    );
  });
}

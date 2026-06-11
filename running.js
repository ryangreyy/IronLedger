/* running.js — IronLedger Running page */
(function () {
  'use strict';

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db   = firebase.firestore();

  // ── Constants ──────────────────────────────────────────────────────────────
  const RACES = {
    '5k':   { name: '5K',           miles: 3.10686 },
    '10k':  { name: '10K',          miles: 6.21371 },
    'half': { name: 'Half Marathon', miles: 13.1094 },
    'full': { name: 'Marathon',      miles: 26.2188 },
  };

  const PLAN_TEMPLATES = {
    '5k': [
      {miles:12,phase:'Base'},{miles:15,phase:'Base'},{miles:18,phase:'Build'},
      {miles:20,phase:'Build'},{miles:18,phase:'Recover'},{miles:22,phase:'Peak'},
      {miles:14,phase:'Taper'},{miles:3,phase:'Race Week'},
    ],
    '10k': [
      {miles:15,phase:'Base'},{miles:18,phase:'Base'},{miles:20,phase:'Base'},
      {miles:22,phase:'Build'},{miles:20,phase:'Recover'},{miles:25,phase:'Build'},
      {miles:28,phase:'Build'},{miles:25,phase:'Recover'},{miles:30,phase:'Peak'},
      {miles:28,phase:'Peak'},{miles:18,phase:'Taper'},{miles:6,phase:'Race Week'},
    ],
    'half': [
      {miles:20,phase:'Base'},{miles:23,phase:'Base'},{miles:26,phase:'Base'},
      {miles:29,phase:'Build'},{miles:24,phase:'Recover'},{miles:32,phase:'Build'},
      {miles:35,phase:'Build'},{miles:29,phase:'Recover'},{miles:38,phase:'Peak'},
      {miles:40,phase:'Peak'},{miles:32,phase:'Taper'},{miles:20,phase:'Taper'},
      {miles:10,phase:'Race Week'},
    ],
    'full': [
      {miles:25,phase:'Base'},{miles:28,phase:'Base'},{miles:30,phase:'Base'},
      {miles:33,phase:'Base'},{miles:28,phase:'Recover'},{miles:36,phase:'Build'},
      {miles:38,phase:'Build'},{miles:35,phase:'Recover'},{miles:40,phase:'Build'},
      {miles:44,phase:'Peak'},{miles:38,phase:'Recover'},{miles:46,phase:'Peak'},
      {miles:48,phase:'Peak'},{miles:38,phase:'Recover'},{miles:35,phase:'Taper'},
      {miles:25,phase:'Taper'},{miles:10,phase:'Race Week'},
    ],
  };

  const PHASE_COLOR = {
    Base:'var(--text-dim)', Build:'#5BAEE8', Recover:'#7AE85B',
    Peak:'var(--accent)',   Taper:'#E8C25B', 'Race Week':'#FF8A4C',
  };

  // ── State ──────────────────────────────────────────────────────────────────
  let currentUser = null;
  let paceMode    = 'goal';
  let planSt      = { step:1, race:null, date:'', days:4, exp:'beg', curMiles:20 };

  // ── Boot ───────────────────────────────────────────────────────────────────
  setupTabs();
  setupPaceCalc();
  setupRunForm();
  planRender();
  setDefaultDate();
  calcPace();

  auth.onAuthStateChanged(user => {
    currentUser = user;
    document.getElementById('logAuthGate').style.display = user ? 'none' : '';
    document.getElementById('logContent').style.display  = user ? ''     : 'none';
    if (user) loadRunLog();
  });

  function setDefaultDate() {
    const today = new Date().toISOString().slice(0, 10);
    const el = document.getElementById('rlDate');
    if (el) {
      el.value = today;
      el.addEventListener('click', () => { try { el.showPicker(); } catch(e) {} });
    }
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  function setupTabs() {
    document.getElementById('runTabs').addEventListener('click', e => {
      const btn = e.target.closest('.yoga-tab');
      if (!btn) return;
      const tab = btn.dataset.tab;
      document.querySelectorAll('.yoga-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.querySelectorAll('.yoga-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
    });
  }

  // ── Pace Calculator ────────────────────────────────────────────────────────
  function setupPaceCalc() {
    document.getElementById('paceModeGoal').addEventListener('click', () => setMode('goal'));
    document.getElementById('paceModePace').addEventListener('click', () => setMode('pace'));

    document.getElementById('paceDistSel').addEventListener('change', e => {
      document.getElementById('paceCustomRow').style.display = e.target.value === 'custom' ? '' : 'none';
      calcPace();
    });

    ['paceCustomMi','paceH','paceM','paceS','pacePaceM','pacePaceS']
      .forEach(id => document.getElementById(id)?.addEventListener('input', calcPace));
  }

  function setMode(m) {
    paceMode = m;
    document.getElementById('paceModeGoal').classList.toggle('active', m === 'goal');
    document.getElementById('paceModePace').classList.toggle('active', m === 'pace');
    document.getElementById('paceInputGoal').style.display = m === 'goal' ? '' : 'none';
    document.getElementById('paceInputPace').style.display = m === 'pace' ? '' : 'none';
    calcPace();
  }

  function calcPace() {
    const out = document.getElementById('paceOutput');

    if (paceMode === 'goal') {
      const distKey = document.getElementById('paceDistSel').value;
      const miles = distKey === 'custom'
        ? parseFloat(document.getElementById('paceCustomMi').value)
        : RACES[distKey]?.miles;
      const h = parseInt(document.getElementById('paceH').value) || 0;
      const m = parseInt(document.getElementById('paceM').value) || 0;
      const s = parseInt(document.getElementById('paceS').value) || 0;
      const totalSecs = h * 3600 + m * 60 + s;
      const valid = miles && totalSecs > 0;
      const ppm  = valid ? totalSecs / miles : null;
      const ppkm = valid ? totalSecs / (miles * 1.60934) : null;

      out.innerHTML = `
        <div class="pace-result-grid">
          <div class="pace-result-card">
            <div class="pace-result-label">Required pace</div>
            <div class="pace-result-val">${ppm ? fmtPace(ppm) : '—'}<span class="pace-result-unit"> /mi</span></div>
          </div>
          <div class="pace-result-card">
            <div class="pace-result-label">Per kilometre</div>
            <div class="pace-result-val">${ppkm ? fmtPace(ppkm) : '—'}<span class="pace-result-unit"> /km</span></div>
          </div>
        </div>
        <div class="pace-proj-block">
          <div class="pace-proj-title">At this pace you'd finish</div>
          ${Object.entries(RACES).map(([,r]) => `
            <div class="pace-proj-row">
              <span>${r.name}</span>
              <span class="pace-proj-time">${ppm ? fmtTime(ppm * r.miles) : '—'}</span>
            </div>`).join('')}
        </div>`;

    } else {
      const pm = parseInt(document.getElementById('pacePaceM').value) || 0;
      const ps = parseInt(document.getElementById('pacePaceS').value) || 0;
      const pSecs = pm * 60 + ps;

      out.innerHTML = `
        <div class="pace-proj-block">
          <div class="pace-proj-title">Projected finish times</div>
          ${Object.entries(RACES).map(([,r]) => `
            <div class="pace-proj-row">
              <span>${r.name}</span>
              <span class="pace-proj-time">${pSecs ? fmtTime(pSecs * r.miles) : '—'}</span>
            </div>`).join('')}
        </div>`;
    }
  }

  // ── Training Plan ──────────────────────────────────────────────────────────
  function planRender() {
    const c = document.getElementById('planContainer');

    if (planSt.step === 1) {
      c.innerHTML = `
        <p class="guide-title">What's your goal race?</p>
        <div class="guide-goals">
          ${[
            {id:'5k',  name:'5K',           tag:'3.1 miles',  icon:'🏃'},
            {id:'10k', name:'10K',          tag:'6.2 miles',  icon:'🏃'},
            {id:'half',name:'Half Marathon', tag:'13.1 miles', icon:'⚡'},
            {id:'full',name:'Marathon',      tag:'26.2 miles', icon:'🏆'},
          ].map(r => `<div class="guide-gc${planSt.race === r.id ? ' on' : ''}" onclick="planPick('${r.id}')">
            <div class="guide-gi">${r.icon}</div>
            <p class="guide-gn">${r.name}</p>
            <p class="guide-gt">${r.tag}</p>
          </div>`).join('')}
        </div>
        <div class="guide-btns">
          <button class="guide-btn guide-btn-p" onclick="planNext()" ${!planSt.race ? 'disabled' : ''}>Next →</button>
        </div>`;

    } else if (planSt.step === 2) {
      c.innerHTML = `
        <p class="guide-title">Tell me about your training</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
          <div class="field">
            <label for="planDate">Race date</label>
            <input id="planDate" type="date" value="${planSt.date}" onchange="planSt.date=this.value">
          </div>
          <div class="field">
            <label for="planCurMi">Current weekly miles</label>
            <input id="planCurMi" type="number" min="0" max="120" placeholder="20" value="${planSt.curMiles || ''}" oninput="planSt.curMiles=+this.value">
          </div>
        </div>
        <div class="guide-qlabel">Experience level</div>
        <div class="guide-pills">
          ${[{id:'beg',l:'Beginner'},{id:'int',l:'Intermediate'},{id:'adv',l:'Advanced'}].map(e =>
            `<span class="guide-pill${planSt.exp === e.id ? ' on' : ''}" onclick="planExp('${e.id}')">${e.l}</span>`).join('')}
        </div>
        <div class="guide-qlabel" style="margin-top:16px;">Training days per week</div>
        <div class="guide-pills">
          ${[3,4,5,6].map(d =>
            `<span class="guide-pill${planSt.days === d ? ' on' : ''}" onclick="planDays(${d})">${d} days</span>`).join('')}
        </div>
        <div class="guide-btns">
          <button class="guide-btn guide-btn-s" onclick="planBack()">Back</button>
          <button class="guide-btn guide-btn-p" onclick="planBuild()">Build my plan →</button>
        </div>`;

    } else {
      const tmpl  = PLAN_TEMPLATES[planSt.race] || [];
      const race  = RACES[planSt.race];
      const expL  = planSt.exp === 'adv' ? 'Advanced' : planSt.exp === 'int' ? 'Intermediate' : 'Beginner';

      let weeks = tmpl;
      if (planSt.date) {
        const diffWeeks = Math.round((new Date(planSt.date) - new Date()) / (7 * 24 * 3600 * 1000));
        if (diffWeeks > 0 && diffWeeks < tmpl.length) {
          weeks = tmpl.slice(tmpl.length - Math.max(diffWeeks, 3));
        }
      }

      const dateLabel = planSt.date
        ? ' · Race ' + new Date(planSt.date + 'T12:00:00').toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})
        : '';

      c.innerHTML = `
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:8px;">
          <p class="guide-title" style="margin:0;">${race.name} Training Plan</p>
        </div>
        <span class="guide-badge">${expL} · ${planSt.days} days/week${dateLabel}</span>
        <div class="plan-table">
          <div class="plan-row plan-header">
            <span>Wk</span><span>Phase</span><span>Total</span><span>Long Run</span><span>Key Workout</span>
          </div>
          ${weeks.map((w, i) => {
            const long = Math.round(w.miles * 0.32 * 10) / 10;
            const key  = planSt.days >= 4 ? `${Math.round(w.miles * 0.20 * 10) / 10} mi tempo` : 'Easy runs';
            const col  = PHASE_COLOR[w.phase] || 'var(--text-dim)';
            return `<div class="plan-row">
              <span style="color:var(--text-dimmer);">${i + 1}</span>
              <span style="color:${col};font-weight:600;">${w.phase}</span>
              <span>${w.miles} mi</span>
              <span>${long} mi</span>
              <span style="color:var(--text-dim);font-size:12px;">${key}</span>
            </div>`;
          }).join('')}
        </div>
        <button class="guide-restart" onclick="planRst()">Start over</button>`;
    }
  }

  window.planPick  = id => { planSt.race = id; planRender(); };
  window.planNext  = ()  => { planSt.step++; planRender(); };
  window.planBack  = ()  => { planSt.step--; planRender(); };
  window.planExp   = id  => { planSt.exp = id; planRender(); };
  window.planDays  = d   => { planSt.days = d; planRender(); };
  window.planBuild = ()  => { planSt.step = 3; planRender(); };
  window.planRst   = ()  => { planSt = {step:1,race:null,date:'',days:4,exp:'beg',curMiles:20}; planRender(); };

  // ── Run Log ────────────────────────────────────────────────────────────────
  function setupRunForm() {
    document.getElementById('rlEffortPicker').addEventListener('click', e => {
      const btn = e.target.closest('.intensity-btn');
      if (!btn) return;
      document.querySelectorAll('#rlEffortPicker .intensity-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('rlEffort').value = btn.dataset.val;
    });
    document.getElementById('rlSubmit').addEventListener('click', submitRunLog);
    ['rlDist','rlH','rlM','rlS'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', updatePacePreview));
  }

  function updatePacePreview() {
    const dist = parseFloat(document.getElementById('rlDist').value);
    const h    = parseInt(document.getElementById('rlH').value) || 0;
    const m    = parseInt(document.getElementById('rlM').value) || 0;
    const s    = parseInt(document.getElementById('rlS').value) || 0;
    const secs = h * 3600 + m * 60 + s;
    const prev = document.getElementById('rlPacePreview');
    prev.textContent = (dist > 0 && secs > 0) ? fmtPace(secs / dist) + ' /mi' : '';
  }

  async function submitRunLog() {
    if (!currentUser) return;
    const date   = document.getElementById('rlDate').value;
    const dist   = parseFloat(document.getElementById('rlDist').value);
    const h      = parseInt(document.getElementById('rlH').value) || 0;
    const m      = parseInt(document.getElementById('rlM').value) || 0;
    const s      = parseInt(document.getElementById('rlS').value) || 0;
    const secs   = h * 3600 + m * 60 + s;
    const effort = parseInt(document.getElementById('rlEffort').value) || 3;
    const notes  = document.getElementById('rlNotes').value.trim();
    if (!date || !dist || !secs) { alert('Please fill in date, distance, and time.'); return; }

    const btn = document.getElementById('rlSubmit');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await db.collection(`users/${currentUser.uid}/runLogs`).add({
        date, distanceMiles: dist, timeSeconds: secs,
        paceSecsPerMile: secs / dist, effort, notes,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      ['rlDist','rlH','rlM','rlS','rlNotes'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
      });
      document.getElementById('rlPacePreview').textContent = '';
      loadRunLog();
    } catch { alert('Error saving. Try again.'); }
    btn.disabled = false; btn.textContent = 'Log run';
  }

  async function loadRunLog() {
    if (!currentUser) return;
    try {
      const snap = await db.collection(`users/${currentUser.uid}/runLogs`)
        .orderBy('date', 'desc').limit(100).get();
      const logs = snap.docs.map(d => ({id: d.id, ...d.data()}));
      renderRunStats(logs);
      renderRunTable(logs);
      renderPaceChart([...logs].reverse());
    } catch(e) { console.error(e); }
  }

  function renderRunStats(logs) {
    const el = document.getElementById('runStats');
    if (!logs.length) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const totalMi  = logs.reduce((s, l) => s + (l.distanceMiles || 0), 0);
    const totalSec = logs.reduce((s, l) => s + (l.timeSeconds  || 0), 0);
    const avgPace  = totalMi > 0 ? totalSec / totalMi : 0;
    const dates    = new Set(logs.map(l => l.date));
    let streak = 0;
    const d = new Date(); d.setHours(0, 0, 0, 0);
    while (dates.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
    document.getElementById('statRuns').textContent   = logs.length;
    document.getElementById('statMiles').textContent  = totalMi.toFixed(1);
    document.getElementById('statPace').textContent   = avgPace ? fmtPace(avgPace) : '—';
    document.getElementById('statStreak').textContent = streak;
  }

  function renderRunTable(logs) {
    const tbody = document.getElementById('runTableBody');
    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="yoga-table-empty">No runs logged yet.</td></tr>';
      return;
    }
    tbody.innerHTML = logs.map(l => `<tr>
      <td>${l.date}</td>
      <td>${(l.distanceMiles || 0).toFixed(2)} mi</td>
      <td>${fmtTime(l.timeSeconds || 0)}</td>
      <td style="font-family:var(--mono)">${l.paceSecsPerMile ? fmtPace(l.paceSecsPerMile) + '/mi' : '—'}</td>
      <td>${'●'.repeat(l.effort || 0)}${'○'.repeat(5 - (l.effort || 0))}</td>
      <td style="color:var(--text-dimmer);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(l.notes || '')}</td>
      <td><button class="btn-delete" data-del-r="${l.id}" title="Delete">✕</button></td>
    </tr>`).join('');
    tbody.querySelectorAll('[data-del-r]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!currentUser) return;
        await db.doc(`users/${currentUser.uid}/runLogs/${btn.dataset.delR}`).delete();
        loadRunLog();
      });
    });
  }

  function renderPaceChart(logs) {
    const svg   = document.getElementById('runPaceChart');
    const empty = document.getElementById('runPaceEmpty');
    if (!svg) return;

    const valid = logs.filter(l => l.paceSecsPerMile > 0);
    if (valid.length < 2) {
      svg.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    const recent = valid.slice(-20);
    const W = 700, H = window.innerWidth < 640 ? 320 : 240;
    const padL = 60, padR = 24, padT = 24, padB = 52;
    const chartW = W - padL - padR, chartH = H - padT - padB;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const paces = recent.map(l => l.paceSecsPerMile);
    const minP = Math.min(...paces), maxP = Math.max(...paces);
    const padY = (maxP - minP) * 0.25 || 30;
    const lo = minP - padY, hi = maxP + padY, range = hi - lo;

    const n   = recent.length;
    const xOf = i => padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW);
    // Higher seconds (slower) at top; lower seconds (faster) at bottom → downward trend = improvement
    const yOf = p => padT + chartH - ((p - lo) / range) * chartH;

    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const y   = padT + (i / 4) * chartH;
      const val = hi - (i / 4) * range;
      grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
      grid += `<text x="${padL - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="axis-label">${fmtPace(val)}</text>`;
    }

    const coords = recent.map((l, i) => `${xOf(i).toFixed(1)},${yOf(l.paceSecsPerMile).toFixed(1)}`);
    const area   = `M${xOf(0).toFixed(1)},${(padT + chartH).toFixed(1)} L${coords.join(' L')} L${xOf(n-1).toFixed(1)},${(padT+chartH).toFixed(1)}Z`;

    const spacing = n > 1 ? chartW / (n - 1) : chartW;
    const step = spacing < 22 ? 3 : spacing < 44 ? 2 : 1;

    let dots = '', labels = '', vlines = '';
    recent.forEach((l, i) => {
      const x = xOf(i).toFixed(1), y = yOf(l.paceSecsPerMile).toFixed(1);
      const [, m, d] = l.date.split('-').map(Number);
      const lbl = `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} ${d}`;
      vlines += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${(padT + chartH).toFixed(1)}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      dots   += `<circle cx="${x}" cy="${y}" r="5" fill="var(--accent)" stroke="var(--bg)" stroke-width="2.5"><title>${fmtPace(l.paceSecsPerMile)}/mi · ${l.date}</title></circle>`;
      if (i % step === 0 || i === n - 1) {
        labels += `<text x="${x}" y="${H - 10}" text-anchor="middle" class="axis-label">${lbl}</text>`;
      }
    });

    svg.innerHTML =
      `<defs><linearGradient id="pcgrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.26"/>
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
      </linearGradient></defs>` +
      `<rect x="${padL}" y="${padT}" width="${chartW}" height="${chartH}" rx="3" fill="rgba(255,255,255,0.04)"/>` +
      grid + vlines +
      `<path d="${area}" fill="url(#pcgrad)"/>` +
      `<path d="M${coords.join(' L')}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` +
      dots + labels;
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  function fmtPace(secs) {
    const m = Math.floor(secs / 60), s = Math.round(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
  function fmtTime(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.round(secs % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
      : `${m}:${s.toString().padStart(2,'0')}`;
  }
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();

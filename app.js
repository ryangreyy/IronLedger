/* IRONLEDGER — Interactive logic. Plain JavaScript, no libraries.
   Requires data.js to be loaded first. */

/* ---- 1) ANIMATED COUNT-UP ----------------------------------------
   When a number scrolls into view, ticks it up from 0 to its target. */
function animateCount(el) {
  const target = +el.dataset.count;
  const dur = 1100, start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);          // ease-out cubic
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
      e.target.classList.add('in');               // fade-in reveal
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
  const gain = data[data.length - 1] - data[0];
  noteEl.textContent = `${label} · +${gain} lbs since week 1`;
}
document.getElementById('liftToggle').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  document.querySelectorAll('#liftToggle button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  drawChart(b.dataset.lift);
});
drawChart('squat');

/* ---- 3) ONE-REP-MAX CALCULATOR ------------------------------------
   Epley formula, plus a percentage table for common rep ranges. */
const ormEl   = document.getElementById('orm');
const pctBody = document.getElementById('pctBody');

function calc() {
  const w = +document.getElementById('weight').value || 0;
  const r = +document.getElementById('reps').value || 1;
  const orm = Math.round(w * (1 + r / 30));          // Epley formula
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

/* ---- 4) TRAINING LOG (data-driven table) --------------------------
   Volume = sets × reps × weight, computed from the log array in data.js. */
document.getElementById('logBody').innerHTML = log.map(s => `
  <tr>
    <td style="color:var(--text-dim)">${s.date}</td>
    <td><span class="pill ${s.cls}">${s.lift}</span></td>
    <td>${s.sets} × ${s.reps}</td>
    <td>${s.wt} lbs</td>
    <td>${(s.sets * s.reps * s.wt).toLocaleString()} lbs</td>
    <td>${s.note ? '<span class="pr-flag">★ ' + s.note + '</span>' : '<span style="color:var(--text-dimmer)">—</span>'}</td>
  </tr>`).join('');

/* ---- 5) STRENGTH STANDARDS (benchmark bars) -----------------------
   Plots current max against tiers; animates the bars on scroll. */
const liftColors = { squat: 'var(--squat)', bench: 'var(--bench)', dead: 'var(--dead)' };
document.getElementById('standards-list').innerHTML = standards.map(s => {
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
    <div class="track"><div class="fill" data-w="${pct}" style="width:0;background:linear-gradient(90deg,${liftColors[s.cls]}88,${liftColors[s.cls]})"></div></div>
    <div class="ticks">${tierNames.map((n, i) => `<span class="${i === tierIdx ? 'here' : ''}">${n}</span>`).join('')}</div>
  </div>`;
}).join('');

const stdObserver = new IntersectionObserver(es => {
  es.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.fill').forEach(f => f.style.width = f.dataset.w + '%');
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('#standards .track').forEach(t => stdObserver.observe(t));

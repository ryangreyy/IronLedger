/* yoga.js — IronGladiator Yoga page */
(function () {
  'use strict';

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db   = firebase.firestore();

  // ── Fallback poses (used when API is unavailable) ─────────────────────────
  const FALLBACK_POSES = [
    { id:1,  english_name:'Mountain Pose',          sanskrit_name_adapted:'Tadasana',                  category_name:'Standing Poses',       pose_description:'Stand tall, feet together, arms at sides. Ground through all four corners of your feet and lengthen through the crown of your head.', pose_benefits:'Improves posture and body awareness. Strengthens thighs, knees, and ankles.', url_svg:'', url_png:'' },
    { id:2,  english_name:'Warrior I',              sanskrit_name_adapted:'Virabhadrasana I',           category_name:'Standing Poses',       pose_description:'Step one foot back, bend front knee to 90°. Raise arms overhead and square hips forward.', pose_benefits:'Strengthens legs and core. Opens chest and hip flexors. Builds focus.', url_svg:'', url_png:'' },
    { id:3,  english_name:'Warrior II',             sanskrit_name_adapted:'Virabhadrasana II',          category_name:'Standing Poses',       pose_description:'Wide stance, front knee bent over ankle. Arms extend in opposite directions at shoulder height, gaze over front fingertips.', pose_benefits:'Strengthens legs and core. Opens hips and chest. Increases stamina.', url_svg:'', url_png:'' },
    { id:4,  english_name:'Triangle Pose',          sanskrit_name_adapted:'Trikonasana',               category_name:'Standing Poses',       pose_description:'Wide stance, reach forward arm to shin or floor. Top arm extends straight up, both legs remain straight.', pose_benefits:'Stretches hamstrings, hips, and spine. Strengthens legs and ankles.', url_svg:'', url_png:'' },
    { id:5,  english_name:'Tree Pose',              sanskrit_name_adapted:'Vrksasana',                 category_name:'Balancing Poses',      pose_description:'Stand on one foot. Place the other foot on the inner calf or thigh. Bring hands to heart center or raise arms overhead.', pose_benefits:'Improves balance and focus. Strengthens standing leg. Opens the hip.', url_svg:'', url_png:'' },
    { id:6,  english_name:'Boat Pose',              sanskrit_name_adapted:'Navasana',                  category_name:'Core Yoga Poses',      pose_description:'Sit and lean back slightly. Lift legs to create a V-shape, arms extending forward parallel to the floor. Engage your core throughout.', pose_benefits:'Strengthens abdominals, hip flexors, and spine. Stimulates kidneys and thyroid.', url_svg:'', url_png:'' },
    { id:7,  english_name:'Plank Pose',             sanskrit_name_adapted:'Phalakasana',               category_name:'Core Yoga Poses',      pose_description:'Hands under shoulders, body in one straight line from head to heels. Engage core and breathe steadily.', pose_benefits:'Builds full-body strength. Tones core, arms, and shoulders. Improves posture.', url_svg:'', url_png:'' },
    { id:8,  english_name:'Cat-Cow Pose',           sanskrit_name_adapted:'Marjaryasana-Bitilasana',   category_name:'Core Yoga Poses',      pose_description:'On all fours, alternate between arching your spine (Cow) and rounding it (Cat) in sync with your breath.', pose_benefits:'Improves spinal flexibility. Warms up the back. Synchronizes breath with movement.', url_svg:'', url_png:'' },
    { id:9,  english_name:'Downward-Facing Dog',    sanskrit_name_adapted:'Adho Mukha Svanasana',      category_name:'Forward Bends',        pose_description:'Hands and feet on the floor, hips lifted high to form an inverted V. Press through hands, lengthen spine, and pedal heels toward the floor.', pose_benefits:'Full-body stretch. Strengthens arms, shoulders, and legs. Energizes and calms the mind.', url_svg:'', url_png:'' },
    { id:10, english_name:'Standing Forward Bend',  sanskrit_name_adapted:'Uttanasana',                category_name:'Forward Bends',        pose_description:'Feet hip-width apart, fold forward from the hips. Let your torso hang heavy, hands to floor or shins.', pose_benefits:'Deeply stretches hamstrings and calves. Releases lower back. Calms the nervous system.', url_svg:'', url_png:'' },
    { id:11, english_name:'Seated Forward Bend',    sanskrit_name_adapted:'Paschimottanasana',         category_name:'Seated Forward Bends', pose_description:'Sit with legs extended. Hinge at hips to fold forward, reaching for feet or ankles. Keep spine long on the inhale, deepen on the exhale.', pose_benefits:'Stretches hamstrings, spine, and shoulders. Calms anxiety. Stimulates digestive organs.', url_svg:'', url_png:'' },
    { id:12, english_name:'Pigeon Pose',            sanskrit_name_adapted:'Eka Pada Rajakapotasana',   category_name:'Hip-Opening Poses',    pose_description:'From Downward Dog, bring one knee behind the wrist. Extend the back leg straight. Hinge forward over the front leg for a deeper stretch.', pose_benefits:'Deep hip opener. Releases piriformis and hip flexors. May relieve sciatic pain.', url_svg:'', url_png:'' },
    { id:13, english_name:'Butterfly Pose',         sanskrit_name_adapted:'Baddha Konasana',           category_name:'Hip-Opening Poses',    pose_description:'Sit tall, bring soles of feet together, let knees fall wide. Hold feet and gently press knees toward the floor or fold forward.', pose_benefits:'Opens inner thighs, groin, and hips. Stimulates abdominal organs.', url_svg:'', url_png:'' },
    { id:14, english_name:'Low Lunge',              sanskrit_name_adapted:'Anjaneyasana',              category_name:'Hip-Opening Poses',    pose_description:'Step one foot forward between hands. Lower back knee to floor, sink hips, and raise arms overhead.', pose_benefits:'Deep hip flexor stretch. Strengthens front leg. Opens chest. Prepares for deeper backbends.', url_svg:'', url_png:'' },
    { id:15, english_name:'Cobra Pose',             sanskrit_name_adapted:'Bhujangasana',              category_name:'Backbends',            pose_description:'Lie face down, hands under shoulders. Press tops of feet down, engage legs. Inhale and lift chest, lower ribs stay on the floor.', pose_benefits:'Strengthens spine. Stretches chest, shoulders, and abdomen. Relieves lower back fatigue.', url_svg:'', url_png:'' },
    { id:16, english_name:'Bridge Pose',            sanskrit_name_adapted:'Setu Bandha Sarvangasana',  category_name:'Backbends',            pose_description:'Lie on back, knees bent, feet flat on the floor hip-width apart. Press feet down and lift hips toward the ceiling.', pose_benefits:'Strengthens back, glutes, and hamstrings. Opens chest. Calms the brain and reduces anxiety.', url_svg:'', url_png:'' },
    { id:17, english_name:'Camel Pose',             sanskrit_name_adapted:'Ustrasana',                 category_name:'Backbends',            pose_description:'Kneel with knees hip-width. Reach hands back to heels one at a time. Lift chest toward the ceiling and gently drop head back.', pose_benefits:'Deep chest and hip flexor opener. Strengthens back. Improves spinal flexibility.', url_svg:'', url_png:'' },
    { id:18, english_name:'Upward-Facing Dog',      sanskrit_name_adapted:'Urdhva Mukha Svanasana',    category_name:'Backbends',            pose_description:'Lie face down, hands under shoulders. Straighten arms fully, lift chest and thighs completely off the floor.', pose_benefits:'Strengthens arms, wrists, and spine. Stretches chest and abdomen. Stimulates abdominal organs.', url_svg:'', url_png:'' },
    { id:19, english_name:'Legs Up the Wall',       sanskrit_name_adapted:'Viparita Karani',           category_name:'Inversions',           pose_description:'Sit close to a wall, swing legs up as you lower your torso to the floor. Rest completely with legs vertical against the wall.', pose_benefits:'Relieves tired legs and feet. Gentle inversion for nervous system reset. Reduces anxiety.', url_svg:'', url_png:'' },
    { id:20, english_name:"Child's Pose",           sanskrit_name_adapted:'Balasana',                  category_name:'Restorative Poses',    pose_description:"Kneel and sit back on heels, fold forward with arms extended or resting by your sides. Forehead rests on the mat.", pose_benefits:"Default resting posture. Gently stretches hips, thighs, and ankles. Calms the mind.", url_svg:'', url_png:'' },
    { id:21, english_name:'Corpse Pose',            sanskrit_name_adapted:'Savasana',                  category_name:'Restorative Poses',    pose_description:'Lie flat on your back, legs slightly apart, arms away from the body with palms up. Close eyes and release all effort.', pose_benefits:'Deep relaxation. Integrates the benefits of the practice. Reduces blood pressure and fatigue.', url_svg:'', url_png:'' },
    { id:22, english_name:'Supine Spinal Twist',    sanskrit_name_adapted:'Supta Matsyendrasana',      category_name:'Restorative Poses',    pose_description:'Lie on your back, draw one knee to chest and guide it across the body. Extend that arm out and look in the opposite direction.', pose_benefits:'Releases spine and lower back. Stretches IT band and glutes. Massages abdominal organs.', url_svg:'', url_png:'' },
    { id:23, english_name:'Happy Baby',             sanskrit_name_adapted:'Ananda Balasana',           category_name:'Restorative Poses',    pose_description:'Lie on your back, draw knees to chest. Hold outsides of feet, flex feet up, pull knees toward armpits. Rock gently side to side.', pose_benefits:'Opens hips and inner groin. Releases lower back. Calming — reduces stress.', url_svg:'', url_png:'' },
    { id:24, english_name:'Shoulder Stand',         sanskrit_name_adapted:'Salamba Sarvangasana',      category_name:'Inversions',           pose_description:'Lie on back, roll hips up off the floor and support your lower back with your hands. Stack hips over shoulders, legs pointing straight up.', pose_benefits:'Stimulates thyroid and metabolism. Calms the nervous system. Improves circulation.', url_svg:'', url_png:'' },
    { id:25, english_name:'Warrior III',            sanskrit_name_adapted:'Virabhadrasana III',        category_name:'Balancing Poses',      pose_description:'Balance on one leg, extend the other leg back parallel to the floor. Torso and back leg form a T-shape, arms reaching forward.', pose_benefits:'Strengthens ankles, legs, and core. Improves balance and posture. Builds full-body stability.', url_svg:'', url_png:'' },
  ];

  const CAT_EMOJI = {
    'Standing Poses':'🏋️', 'Balancing Poses':'🌳', 'Core Yoga Poses':'💪',
    'Forward Bends':'🙇', 'Seated Forward Bends':'🧘', 'Hip-Opening Poses':'🦵',
    'Backbends':'🌉', 'Inversions':'🙃', 'Restorative Poses':'😴', default:'🧘',
  };

  const CIRCLE_COLORS = [
    '#E8834B','#5BAEE8','#E85B8A','#5BCEA0',
    '#9A5BE8','#E8C25B','#5BCCE8','#E85BC8',
    '#7AE85B','#E85858','#58B4E8','#C2E858',
  ];

  const STYLE_LABELS = {
    vinyasa:'Vinyasa', yin:'Yin', hatha:'Hatha', restorative:'Restorative',
    ashtanga:'Ashtanga', power:'Power Yoga', kundalini:'Kundalini',
    bikram:'Bikram', flow_builder:'Flow Builder', other:'Other',
  };
  // ── Favorites ────────────────────────────────────────────────────────────
  let favorites = new Set(JSON.parse(localStorage.getItem('yogaFavorites') || '[]'));

  function saveFavorites() {
    localStorage.setItem('yogaFavorites', JSON.stringify([...favorites]));
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites();
    renderPoseLibrary();
    const favBtn = document.getElementById('poseModalFavBtn');
    if (favBtn) syncModalFavBtn(favBtn, id);
  }

  function syncModalFavBtn(btn, id) {
    const on = favorites.has(id);
    btn.textContent = on ? '♥ Favorited' : '+ Add to Favorites';
    btn.classList.toggle('fav-active', on);
  }

  // ── Stretch & PT mappings ─────────────────────────────────────────────────
  const BODY_PART_POSES = {
    hamstrings:   ['Standing Forward Bend','Seated Forward Bend','Downward-Facing Dog','Triangle','Pyramid','Warrior Three'],
    hips:         ['Pigeon','Butterfly','Low Lunge','Garland Pose','King Pigeon','Crescent Lunge'],
    lower_back:   ["Child's Pose",'Cat','Sphinx','Bridge','Half Lord of the Fishes'],
    shoulders:    ['Downward-Facing Dog','Upward-Facing Dog','Camel','Shoulder Stand','Eagle','Forward Bend with Shoulder Opener'],
    quads:        ['Low Lunge','Camel','Warrior One','Chair','Crescent Lunge','Crescent Moon'],
    calves:       ['Downward-Facing Dog','Standing Forward Bend','Extended Hand to Toe'],
    chest:        ['Camel','Upward-Facing Dog','Bridge','Wild Thing','Wheel','Bow'],
    glutes:       ['Pigeon','King Pigeon','Bridge','Warrior Two'],
    inner_thighs: ['Butterfly','Warrior Two','Triangle','Garland Pose','Side Splits'],
    it_band:      ['Half Lord of the Fishes','Pigeon','Triangle'],
  };
  const POST_WORKOUT_TARGETS = {
    leg_day:    ['hamstrings','quads','glutes','calves','hips'],
    upper_body: ['shoulders','chest'],
    cardio_run: ['hamstrings','calves','hips','lower_back','it_band'],
    full_body:  ['hamstrings','hips','shoulders','lower_back','chest'],
    push_day:   ['chest','shoulders'],
    pull_day:   ['shoulders','lower_back','hamstrings'],
  };
  const PT_TARGETS = {
    lower_back_pain:    ['lower_back','hips','hamstrings'],
    tight_hips:         ['hips','glutes','inner_thighs'],
    shoulder_tightness: ['shoulders','chest'],
    sciatica:           ['lower_back','hips','glutes','it_band'],
    knee_tension:       ['quads','hamstrings','calves'],
    neck_tension:       ['shoulders'],
    general_recovery:   ['lower_back','hips','hamstrings','shoulders'],
  };
  const STRETCH_LABELS = {
    hamstrings:'Hamstrings', hips:'Hips', lower_back:'Lower Back', shoulders:'Shoulders',
    quads:'Quads', calves:'Calves', chest:'Chest', glutes:'Glutes',
    inner_thighs:'Inner Thighs', it_band:'IT Band',
    leg_day:'Leg Day', upper_body:'Upper Body', cardio_run:'Cardio / Run',
    full_body:'Full Body', push_day:'Push Day', pull_day:'Pull Day',
    lower_back_pain:'Lower Back Pain', tight_hips:'Tight Hips',
    shoulder_tightness:'Shoulder Tightness', sciatica:'Sciatica',
    knee_tension:'Knee Tension', neck_tension:'Neck Tension',
    general_recovery:'General Recovery',
  };

  function getStretchPoses(type, key) {
    let parts = [];
    if (type === 'body') parts = [key];
    else if (type === 'workout') parts = POST_WORKOUT_TARGETS[key] || [];
    else if (type === 'pt') parts = PT_TARGETS[key] || [];
    const seen = new Set();
    const names = [];
    parts.forEach(bp => (BODY_PART_POSES[bp] || []).forEach(n => {
      if (!seen.has(n)) { seen.add(n); names.push(n); }
    }));
    const matched = allPoses.filter(p => seen.has(p.english_name));
    matched.sort((a, b) => names.indexOf(a.english_name) - names.indexOf(b.english_name));
    return matched;
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let allPoses = [];
  let flowPoses = []; // [{ pose, duration, setupAfter }]
  let flowStartSetupSecs = 0;
  let currentUser = null;
  let timerInterval = null;
  let timerPaused = false;
  let timerIdx = 0;
  let timerSecsLeft = 0;
  let timerDuration = 0;
  let timerPhase = 'pose';
  let timerSetupFromIdx = -1;
  let activeFlowPoses = [];
  let activeFlowStartSetupSecs = 0;

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  setDefaultDates();
  setupTabs();
  setupPoseLibraryEvents();
  setupPoseModal();
  setupFlowBuilder();
  setupTimerControls();
  setupSessionForm();
  setupStretchFinder();
  loadPoses();

  function handleYogaAuthState(user) {
    currentUser = user;
    const in_ = !!user;
    show('sessions-auth-gate', !in_);
    show('sessions-content', in_);
    if (in_) loadYogaSessions();
  }

  let yogaAuthDeferredForAppLock = false;
  auth.onAuthStateChanged(user => {
    if (window.IGAppLock?.isLocked()) {
      if (!yogaAuthDeferredForAppLock) {
        yogaAuthDeferredForAppLock = true;
        window.IGAppLock.afterUnlock(() => {
          yogaAuthDeferredForAppLock = false;
          handleYogaAuthState(auth.currentUser);
        });
      }
      return;
    }
    handleYogaAuthState(user);
  });

  function show(id, visible) {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? '' : 'none';
  }

  function setDefaultDates() {
    const today = new Date().toISOString().slice(0, 10);
    ['ysDate'].forEach(id => { const el = document.getElementById(id); if (el) el.value = today; });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  function setupTabs() {
    document.getElementById('yogaPageTabs').addEventListener('click', e => {
      const btn = e.target.closest('.page-tab');
      if (!btn) return;
      const tab = btn.dataset.tab;
      document.querySelectorAll('#yogaPageTabs .page-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.querySelectorAll('#yogaPageTabs ~ .page-tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
    });
  }

  // ── Load Poses ────────────────────────────────────────────────────────────
  async function loadPoses() {
    const cached = localStorage.getItem('yogaPosesCache');
    if (cached) {
      try { allPoses = JSON.parse(cached); } catch { allPoses = FALLBACK_POSES; }
    } else {
      allPoses = FALLBACK_POSES;
    }
    renderPoseLibrary();
    renderFlowPicker();

    // Refresh from API in the background; update cache if successful
    try {
      const res = await fetch('https://yoga-api-nzy4.onrender.com/v1/poses');
      if (!res.ok) throw new Error('api fail');
      const data = await res.json();
      const poses = Array.isArray(data) ? data : (data.poses || data.data || null);
      if (poses && poses.length) {
        allPoses = poses;
        localStorage.setItem('yogaPosesCache', JSON.stringify(poses));
        renderPoseLibrary();
        renderFlowPicker();
      }
    } catch { /* keep current poses */ }
  }

  // ── Pose Library ──────────────────────────────────────────────────────────
  function setupPoseLibraryEvents() {
    document.getElementById('poseSearch').addEventListener('input', renderPoseLibrary);
    document.getElementById('poseFilters').addEventListener('click', e => {
      const btn = e.target.closest('.pose-filter-btn');
      if (!btn) return;
      document.querySelectorAll('.pose-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderPoseLibrary();
    });
    document.getElementById('poseGrid').addEventListener('click', e => {
      const favBtn = e.target.closest('.pose-card-fav-btn[data-fav-id]');
      if (favBtn) { e.stopPropagation(); toggleFavorite(+favBtn.dataset.favId); return; }
      const card = e.target.closest('.pose-card[data-id]');
      if (card) openPoseModal(+card.dataset.id);
    });
  }

  function renderPoseLibrary() {
    const search = (document.getElementById('poseSearch').value || '').toLowerCase();
    const activeCat = (document.querySelector('#poseFilters .pose-filter-btn.active') || {}).dataset?.cat || '';

    const cats = [...new Set(allPoses.map(p => p.category_name).filter(Boolean))].sort();
    document.getElementById('poseFilters').innerHTML =
      `<button class="pose-filter-btn${!activeCat ? ' active' : ''}" data-cat="">All</button>` +
      cats.map(c => `<button class="pose-filter-btn${activeCat === c ? ' active' : ''}" data-cat="${c}">${esc(c)}</button>`).join('');

    const filtered = allPoses.filter(p =>
      (!search || (p.english_name||'').toLowerCase().includes(search) || (p.sanskrit_name_adapted||'').toLowerCase().includes(search)) &&
      (!activeCat || p.category_name === activeCat)
    );

    const favPoses  = filtered.filter(p =>  favorites.has(p.id));
    const restPoses = filtered.filter(p => !favorites.has(p.id));

    let html = '';
    if (!filtered.length) {
      html = '<p class="yoga-empty">No poses found.</p>';
    } else if (favPoses.length) {
      html = `<div class="pose-section-label">Favorites</div>` +
             favPoses.map(poseCardHTML).join('') +
             (restPoses.length ? `<div class="pose-section-label">All Poses</div>` + restPoses.map(poseCardHTML).join('') : '');
    } else {
      html = restPoses.map(poseCardHTML).join('');
    }
    document.getElementById('poseGrid').innerHTML = html;
    applyCircleDetection();
  }

  function applyCircleDetection() {
    document.querySelectorAll('.pose-card-img:not([data-circle-checked])').forEach(img => {
      img.dataset.circleChecked = '1';
      function check() {
        try {
          const c = document.createElement('canvas');
          c.width = c.height = 4;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0, 4, 4);
          const d = ctx.getImageData(0, 0, 1, 1).data;
          // #FFEFD6 = r:255, g:239, b:214 — b<230 excludes white (transparent bg)
          if (!(d[0] > 240 && d[1] > 220 && d[2] > 190 && d[2] < 230)) {
            img.closest('.pose-card-img-wrap').classList.add('pose-no-circle');
          }
        } catch(e) {}
      }
      if (img.complete && img.naturalWidth) check();
      else img.addEventListener('load', check);
    });
  }

  function poseCardHTML(p) {
    const img = p.url_svg || p.url_png || '';
    const circleColor = CIRCLE_COLORS[(p.id || 0) % CIRCLE_COLORS.length];
    const imgEl = img
      ? `<img src="${img}" alt="${esc(p.english_name)}" class="pose-card-img" crossorigin="anonymous" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="pose-card-placeholder" style="background:${circleColor}">${CAT_EMOJI[p.category_name] || CAT_EMOJI.default}</div>`;
    const isFav = favorites.has(p.id);
    return `<div class="pose-card" data-id="${p.id}" tabindex="0" role="button">
      <div class="pose-card-img-wrap">${imgEl}</div>
      <div class="pose-card-info">
        <div class="pose-card-name-row">
          <div class="pose-card-name">${esc(p.english_name)}</div>
          <button class="pose-card-fav-btn${isFav ? ' fav-active' : ''}" data-fav-id="${p.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">♥</button>
        </div>
        <div class="pose-card-sanskrit">${esc(p.sanskrit_name_adapted||'')}</div>
        <div class="pose-card-cat">${esc(p.category_name||'')}</div>
      </div>
    </div>`;
  }

  // ── Pose Modal ────────────────────────────────────────────────────────────
  function setupPoseModal() {
    document.getElementById('poseModalClose').addEventListener('click', closePoseModal);
    document.getElementById('poseModal').addEventListener('click', e => { if (e.target === e.currentTarget) closePoseModal(); });
  }

  function openPoseModal(id) {
    const p = allPoses.find(x => x.id === id);
    if (!p) return;
    const img = p.url_svg || p.url_png || '';
    const isFav = favorites.has(p.id);
    const imgEl = img
      ? `<img src="${img}" alt="${esc(p.english_name)}" class="pose-modal-img" onerror="this.style.display='none'">`
      : `<div style="font-size:80px;text-align:center;margin-bottom:16px;">${CAT_EMOJI[p.category_name]||CAT_EMOJI.default}</div>`;
    document.getElementById('poseModalInner').innerHTML = `
      ${imgEl}
      <div class="pose-modal-name">${esc(p.english_name)}</div>
      <div class="pose-modal-sanskrit">${esc(p.sanskrit_name_adapted||'')}</div>
      <span class="pose-modal-cat">${esc(p.category_name||'')}</span>
      <div class="pose-modal-section">Description</div>
      <div class="pose-modal-text">${esc(p.pose_description||'')}</div>
      ${p.pose_benefits?`<div class="pose-modal-section">Benefits</div><div class="pose-modal-text">${esc(p.pose_benefits)}</div>`:''}
      <button class="btn btn-ghost pose-modal-add-btn" id="poseModalAddBtn">+ Add to Flow</button>
      <button class="btn btn-ghost pose-modal-fav-btn${isFav?' fav-active':''}" id="poseModalFavBtn">${isFav?'♥ Favorited':'+ Add to Favorites'}</button>
    `;
    document.getElementById('poseModalAddBtn').addEventListener('click', () => {
      addToFlow(p);
      closePoseModal();
      document.querySelector('#yogaPageTabs .page-tab[data-tab="flow"]').click();
    });
    document.getElementById('poseModalFavBtn').addEventListener('click', () => {
      toggleFavorite(p.id);
    });
    document.getElementById('poseModal').style.display = 'flex';
  }

  function closePoseModal() { document.getElementById('poseModal').style.display = 'none'; }

  // ── Flow Builder ──────────────────────────────────────────────────────────
  function setupFlowBuilder() {
    document.getElementById('flowSearch').addEventListener('input', renderFlowPicker);
    document.getElementById('flowPoseList').addEventListener('click', e => {
      const btn = e.target.closest('[data-add-id]');
      if (!btn) return;
      const p = allPoses.find(x => x.id === +btn.dataset.addId);
      if (p) addToFlow(p);
    });
    document.getElementById('flowSequence').addEventListener('click', e => {
      const setupStartAddBtn = e.target.closest('[data-setup-start-add]');
      if (setupStartAddBtn) {
        flowStartSetupSecs = flowStartSetupSecs || 10;
        renderFlowSequence();
        requestAnimationFrame(() => document.querySelector('[data-setup-start]')?.focus());
        return;
      }
      const setupStartRemoveBtn = e.target.closest('[data-setup-start-remove]');
      if (setupStartRemoveBtn) {
        flowStartSetupSecs = 0;
        renderFlowSequence();
        return;
      }
      const setupAddBtn = e.target.closest('[data-setup-add-idx]');
      if (setupAddBtn) {
        const idx = +setupAddBtn.dataset.setupAddIdx;
        flowPoses[idx].setupAfter = flowPoses[idx].setupAfter || 10;
        renderFlowSequence();
        requestAnimationFrame(() => document.querySelector(`[data-setup-idx="${idx}"]`)?.focus());
        return;
      }
      const setupRemoveBtn = e.target.closest('[data-setup-remove-idx]');
      if (setupRemoveBtn) {
        flowPoses[+setupRemoveBtn.dataset.setupRemoveIdx].setupAfter = 0;
        renderFlowSequence();
        return;
      }
      const item = e.target.closest('[data-flow-idx]');
      if (!item) return;
      const idx = +item.dataset.flowIdx;
      const action = e.target.dataset.action;
      if (action === 'remove') { flowPoses.splice(idx, 1); renderFlowSequence(); }
      else if (action === 'up'   && idx > 0)                  { [flowPoses[idx-1], flowPoses[idx]] = [flowPoses[idx], flowPoses[idx-1]]; renderFlowSequence(); }
      else if (action === 'down' && idx < flowPoses.length-1) { [flowPoses[idx+1], flowPoses[idx]] = [flowPoses[idx], flowPoses[idx+1]]; renderFlowSequence(); }
    });
    document.getElementById('flowSequence').addEventListener('input', syncFlowInput);
    document.getElementById('flowSequence').addEventListener('change', syncFlowInput);
    document.getElementById('flowClear').addEventListener('click', () => { flowPoses = []; flowStartSetupSecs = 0; renderFlowSequence(); });
    document.getElementById('flowStart').addEventListener('click', startFlowTimer);
  }

  function syncFlowInput(e) {
      const setupStartInp = e.target.closest('[data-setup-start]');
      if (setupStartInp) {
        flowStartSetupSecs = normalizeSetupDuration(setupStartInp.value);
        if (flowStartSetupSecs <= 0 && e.type === 'change') renderFlowSequence();
        return;
      }
      const durInp = e.target.closest('[data-dur-idx]');
      if (durInp) {
        flowPoses[+durInp.dataset.durIdx].duration = normalizePoseDuration(durInp.value);
        return;
      }
      const setupInp = e.target.closest('[data-setup-idx]');
      if (!setupInp) return;
      const idx = +setupInp.dataset.setupIdx;
      const secs = normalizeSetupDuration(setupInp.value);
      flowPoses[idx].setupAfter = secs;
      if (secs <= 0 && e.type === 'change') renderFlowSequence();
  }

  function syncFlowSequenceInputs() {
    const startInput = document.querySelector('[data-setup-start]');
    if (startInput) flowStartSetupSecs = normalizeSetupDuration(startInput.value);
    document.querySelectorAll('[data-dur-idx]').forEach(input => {
      const idx = +input.dataset.durIdx;
      if (flowPoses[idx]) flowPoses[idx].duration = normalizePoseDuration(input.value);
    });
    document.querySelectorAll('[data-setup-idx]').forEach(input => {
      const idx = +input.dataset.setupIdx;
      if (flowPoses[idx]) flowPoses[idx].setupAfter = normalizeSetupDuration(input.value);
    });
  }

  function normalizePoseDuration(value) {
    return Math.min(300, Math.max(5, parseInt(value, 10) || 30));
  }

  function normalizeSetupDuration(value) {
    return Math.min(120, Math.max(0, parseInt(value, 10) || 0));
  }

  function renderFlowPicker() {
    const search = (document.getElementById('flowSearch').value || '').toLowerCase();
    const filtered = allPoses.filter(p =>
      !search || (p.english_name||'').toLowerCase().includes(search) || (p.category_name||'').toLowerCase().includes(search)
    );
    document.getElementById('flowPoseList').innerHTML = filtered.map(p => {
      const img = p.url_svg || p.url_png || '';
      const imgEl = img
        ? `<img src="${img}" alt="" onerror="this.style.display='none'">`
        : `<div class="flow-pose-item-emoji">${CAT_EMOJI[p.category_name]||CAT_EMOJI.default}</div>`;
      return `<div class="flow-pose-item">
        ${imgEl}
        <div style="flex:1;min-width:0;">
          <div class="flow-pose-item-name">${esc(p.english_name)}</div>
          <div class="flow-pose-item-cat">${esc(p.category_name||'')}</div>
        </div>
        <button class="flow-add-btn" data-add-id="${p.id}" title="Add to flow">+</button>
      </div>`;
    }).join('');
  }

  function addToFlow(pose) {
    const dur = parseInt(document.getElementById('flowDefaultDuration').value) || 30;
    flowPoses.push({ pose, duration: dur, setupAfter: 0 });
    renderFlowSequence();
  }

  function renderFlowSequence() {
    document.getElementById('flowCount').textContent = `${flowPoses.length} pose${flowPoses.length !== 1 ? 's' : ''}`;
    const el = document.getElementById('flowSequence');
    if (!flowPoses.length) { el.innerHTML = '<p class="flow-empty">Add poses from the left to build your flow.</p>'; return; }
    const rows = [];
    rows.push(flowStartSetupGapHTML());
    flowPoses.forEach((fp, i) => {
      const img = fp.pose.url_svg || fp.pose.url_png || '';
      const imgEl = img
        ? `<img src="${img}" alt="" class="flow-seq-img" onerror="this.style.display='none'">`
        : `<div class="flow-seq-emoji">${CAT_EMOJI[fp.pose.category_name]||CAT_EMOJI.default}</div>`;
      rows.push(`<div class="flow-seq-item" data-flow-idx="${i}">
        <span class="flow-seq-num">${i+1}</span>
        ${imgEl}
        <span class="flow-seq-name">${esc(fp.pose.english_name)}</span>
        <div class="flow-seq-dur">
          <input type="number" value="${fp.duration}" min="5" max="300" step="5" data-dur-idx="${i}">
          <span>s</span>
        </div>
        <div class="flow-seq-controls">
          <button class="flow-seq-btn" data-action="up"     title="Move up">↑</button>
          <button class="flow-seq-btn" data-action="down"   title="Move down">↓</button>
          <button class="flow-seq-btn flow-seq-rm" data-action="remove" title="Remove">×</button>
        </div>
      </div>`);
      if (i < flowPoses.length - 1) rows.push(flowSetupGapHTML(i));
    });
    el.innerHTML = rows.join('');
  }

  function flowStartSetupGapHTML() {
    const secs = normalizeSetupDuration(flowStartSetupSecs);
    if (secs > 0) {
      return `<div class="flow-setup-gap flow-setup-start">
        <span class="flow-setup-line"></span>
        <div class="flow-setup-pill">
          <span>Set-up</span>
          <input type="number" value="${secs}" min="0" max="120" step="5" data-setup-start>
          <span>s</span>
          <button class="flow-setup-remove" data-setup-start-remove title="Remove setup time">×</button>
        </div>
        <span class="flow-setup-line"></span>
      </div>`;
    }
    return `<div class="flow-setup-gap flow-setup-start">
      <span class="flow-setup-line"></span>
      <button class="flow-setup-add" data-setup-start-add title="Add setup time before first pose">+</button>
      <span class="flow-setup-line"></span>
    </div>`;
  }

  function flowSetupGapHTML(idx) {
    const secs = Math.min(120, Math.max(0, parseInt(flowPoses[idx]?.setupAfter, 10) || 0));
    if (secs > 0) {
      return `<div class="flow-setup-gap">
        <span class="flow-setup-line"></span>
        <div class="flow-setup-pill">
          <span>Set-up</span>
          <input type="number" value="${secs}" min="0" max="120" step="5" data-setup-idx="${idx}">
          <span>s</span>
          <button class="flow-setup-remove" data-setup-remove-idx="${idx}" title="Remove setup time">×</button>
        </div>
        <span class="flow-setup-line"></span>
      </div>`;
    }
    return `<div class="flow-setup-gap">
      <span class="flow-setup-line"></span>
      <button class="flow-setup-add" data-setup-add-idx="${idx}" title="Add setup time">+</button>
      <span class="flow-setup-line"></span>
    </div>`;
  }

  // ── Flow Timer ────────────────────────────────────────────────────────────
  function setupTimerControls() {
    document.getElementById('flowTimerClose').addEventListener('click', stopFlowTimer);
    document.getElementById('flowCtrlPause').addEventListener('click', toggleTimerPause);
    document.getElementById('flowCtrlNext').addEventListener('click',  () => { if (timerInterval !== null || timerPaused) advanceTimer(1); });
    document.getElementById('flowCtrlPrev').addEventListener('click',  () => { if (timerInterval !== null || timerPaused) advanceTimer(-1); });
  }

  function startFlowTimer() {
    if (!flowPoses.length) return;
    syncFlowSequenceInputs();
    activeFlowPoses = flowPoses.map(fp => ({
      pose: fp.pose,
      duration: normalizePoseDuration(fp.duration),
      setupAfter: normalizeSetupDuration(fp.setupAfter),
    }));
    activeFlowStartSetupSecs = normalizeSetupDuration(flowStartSetupSecs);
    timerIdx = 0; timerPaused = false;
    timerSetupFromIdx = -1;
    document.getElementById('flowTimer').style.display = 'flex';
    const pauseBtn = document.getElementById('flowCtrlPause');
    pauseBtn.textContent = 'Pause'; pauseBtn.classList.remove('paused');
    if (activeFlowStartSetupSecs > 0) showTimerSetup(-1, 0, activeFlowStartSetupSecs);
    else showTimerPose(0);
  }

  function showTimerPose(idx) {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    const fp = activeFlowPoses[idx];
    if (!fp) { stopFlowTimer(); return; }
    timerIdx = idx;
    timerPhase = 'pose';
    timerSecsLeft = fp.duration;
    timerDuration = fp.duration;

    const p = fp.pose;
    const img = p.url_svg || p.url_png || '';
    const imgEl = document.getElementById('flowTimerImg');
    const emojiEl = document.getElementById('flowTimerEmoji');
    if (img) { imgEl.src = img; imgEl.style.display = 'block'; emojiEl.style.display = 'none'; }
    else { imgEl.style.display = 'none'; emojiEl.textContent = CAT_EMOJI[p.category_name]||CAT_EMOJI.default; emojiEl.style.display = 'block'; }

    document.getElementById('flowTimerNum').textContent       = `Pose ${idx+1} of ${activeFlowPoses.length}`;
    document.getElementById('flowTimerName').textContent      = p.english_name;
    document.getElementById('flowTimerSanskrit').textContent  = p.sanskrit_name_adapted || '';
    document.getElementById('flowTimerCountdown').textContent = timerSecsLeft;
    document.getElementById('flowTimerBar').style.width       = '0%';

    timerInterval = setInterval(tick, 1000);
  }

  function showTimerSetup(fromIdx, nextIdx, setupSecs) {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    const nextPose = activeFlowPoses[nextIdx]?.pose;
    if (!nextPose) { stopFlowTimer(); return; }
    timerIdx = nextIdx;
    timerPhase = 'setup';
    timerSetupFromIdx = fromIdx;
    timerSecsLeft = setupSecs;
    timerDuration = setupSecs;

    document.getElementById('flowTimerImg').style.display = 'none';
    document.getElementById('flowTimerEmoji').style.display = 'none';
    document.getElementById('flowTimerNum').textContent = `Set-up ${nextIdx+1} of ${activeFlowPoses.length}`;
    document.getElementById('flowTimerName').textContent = 'Get ready';
    document.getElementById('flowTimerSanskrit').textContent = `Next: ${nextPose.english_name}`;
    document.getElementById('flowTimerCountdown').textContent = timerSecsLeft;
    document.getElementById('flowTimerBar').style.width = '0%';

    timerInterval = setInterval(tick, 1000);
  }

  function tick() {
    if (timerPaused) return;
    timerSecsLeft--;
    document.getElementById('flowTimerCountdown').textContent = Math.max(0, timerSecsLeft);
    document.getElementById('flowTimerBar').style.width = `${((timerDuration - timerSecsLeft) / timerDuration) * 100}%`;
    if (timerSecsLeft <= 0) advanceTimer(1);
  }

  function advanceTimer(dir) {
    timerPaused = false;
    const pauseBtn = document.getElementById('flowCtrlPause');
    pauseBtn.textContent = 'Pause'; pauseBtn.classList.remove('paused');

    if (dir > 0) {
      if (timerPhase === 'setup') { showTimerPose(timerIdx); return; }
      const next = timerIdx + 1;
      if (next >= activeFlowPoses.length) { stopFlowTimer(); return; }
      const setupSecs = normalizeSetupDuration(activeFlowPoses[timerIdx]?.setupAfter);
      if (setupSecs > 0) showTimerSetup(timerIdx, next, setupSecs);
      else showTimerPose(next);
      return;
    }

    if (timerPhase === 'setup') {
      if (timerSetupFromIdx >= 0) showTimerPose(timerSetupFromIdx);
      return;
    }
    const prev = timerIdx - 1;
    if (prev >= 0) showTimerPose(prev);
  }

  function toggleTimerPause() {
    timerPaused = !timerPaused;
    const btn = document.getElementById('flowCtrlPause');
    btn.textContent = timerPaused ? 'Resume' : 'Pause';
    btn.classList.toggle('paused', timerPaused);
  }

  function stopFlowTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timerPhase = 'pose';
    timerSetupFromIdx = -1;
    activeFlowPoses = [];
    activeFlowStartSetupSecs = 0;
    document.getElementById('flowTimer').style.display = 'none';
  }

  // ── Stretch & PT ──────────────────────────────────────────────────────────
  function setupStretchFinder() {
    const panel = document.getElementById('tab-stretch');
    panel.addEventListener('click', e => {
      const btn = e.target.closest('.stretch-btn');
      if (btn) {
        document.querySelectorAll('.stretch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderStretchResults(btn.dataset.stype, btn.dataset.skey);
        return;
      }
      const favBtn = e.target.closest('.pose-card-fav-btn[data-fav-id]');
      if (favBtn) { e.stopPropagation(); toggleFavorite(+favBtn.dataset.favId); return; }
      const card = e.target.closest('.pose-card[data-id]');
      if (card) openPoseModal(+card.dataset.id);
    });
    document.getElementById('stretchLoadFlow').addEventListener('click', () => {
      const activeBtn = document.querySelector('.stretch-btn.active');
      if (!activeBtn) return;
      const poses = getStretchPoses(activeBtn.dataset.stype, activeBtn.dataset.skey);
      flowStartSetupSecs = 0;
      flowPoses = poses.map(p => ({ pose: p, duration: 30, setupAfter: 0 }));
      renderFlowSequence();
      document.querySelector('#yogaPageTabs .page-tab[data-tab="flow"]').click();
    });
  }

  function renderStretchResults(type, key) {
    const poses = getStretchPoses(type, key);
    const label = STRETCH_LABELS[key] || key;
    const prefix = type === 'body' ? 'Stretches for ' : type === 'workout' ? 'Cool-down: ' : 'Relief for ';
    document.getElementById('stretchResultsTitle').textContent = prefix + label;
    document.getElementById('stretchResultsCount').textContent = `${poses.length} pose${poses.length !== 1 ? 's' : ''}`;
    const grid = document.getElementById('stretchPoseGrid');
    grid.innerHTML = poses.length ? poses.map(poseCardHTML).join('') : '<p class="yoga-empty">No matching poses found.</p>';
    if (poses.length) applyCircleDetection();
    const results = document.getElementById('stretchResults');
    results.style.display = '';
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Session Log ───────────────────────────────────────────────────────────
  function setupSessionForm() {
    document.getElementById('ysIntensityPicker').addEventListener('click', e => {
      const btn = e.target.closest('.intensity-btn');
      if (!btn) return;
      document.querySelectorAll('.intensity-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('ysIntensity').value = btn.dataset.val;
    });
    document.getElementById('ysSubmit').addEventListener('click', submitYogaSession);
  }

  async function submitYogaSession() {
    if (!currentUser) return;
    const date     = document.getElementById('ysDate').value;
    const style    = document.getElementById('ysStyle').value;
    const duration = parseInt(document.getElementById('ysDuration').value) || 0;
    const intensity= parseInt(document.getElementById('ysIntensity').value) || 3;
    const mood     = document.getElementById('ysMood').value;
    const notes    = document.getElementById('ysNotes').value.trim();
    if (!date || !duration) { alert('Please fill in date and duration.'); return; }
    const btn = document.getElementById('ysSubmit');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      await db.collection(`users/${currentUser.uid}/yogaSessions`).add({
        date, style, duration, intensity, mood, notes,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      document.getElementById('ysDuration').value = '';
      document.getElementById('ysNotes').value = '';
      loadYogaSessions();
    } catch { alert('Error saving. Try again.'); }
    btn.disabled = false; btn.textContent = 'Log session';
  }

  async function loadYogaSessions() {
    if (!currentUser) return;
    try {
      const snap = await db.collection(`users/${currentUser.uid}/yogaSessions`)
        .orderBy('date', 'desc').limit(100).get();
      const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderSessionTable(sessions);
      renderYogaStats(sessions);
    } catch (e) { console.error(e); }
  }

  function renderSessionTable(sessions) {
    const MOOD = { great:'Great 😌', good:'Good', ok:'Ok', tired:'Tired' };
    const tbody = document.getElementById('sessionTableBody');
    if (!sessions.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="yoga-table-empty">No sessions logged yet.</td></tr>';
      return;
    }
    tbody.innerHTML = sessions.map(s => `<tr>
      <td>${s.date}</td>
      <td>${STYLE_LABELS[s.style]||s.style}</td>
      <td>${s.duration} min</td>
      <td>${'●'.repeat(s.intensity||0)}${'○'.repeat(5-(s.intensity||0))}</td>
      <td>${MOOD[s.mood]||s.mood}</td>
      <td style="color:var(--text-dimmer);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(s.notes||'')}</td>
      <td><button class="btn-delete" data-del-s="${s.id}" title="Delete">✕</button></td>
    </tr>`).join('');
    tbody.querySelectorAll('[data-del-s]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!currentUser) return;
        await db.doc(`users/${currentUser.uid}/yogaSessions/${btn.dataset.delS}`).delete();
        loadYogaSessions();
      });
    });
  }

  function renderYogaStats(sessions) {
    if (!sessions.length) { document.getElementById('yogaStats').style.display = 'none'; return; }
    document.getElementById('yogaStats').style.display = 'flex';
    const totalMin = sessions.reduce((s, x) => s + (x.duration||0), 0);
    const styleCounts = {};
    sessions.forEach(s => { styleCounts[s.style] = (styleCounts[s.style]||0)+1; });
    const fave = Object.entries(styleCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
    const dates = new Set(sessions.map(s => s.date));
    let streak = 0;
    const d = new Date(); d.setHours(0,0,0,0);
    while (dates.has(d.toISOString().slice(0,10))) { streak++; d.setDate(d.getDate()-1); }
    document.getElementById('statSessions').textContent  = sessions.length;
    document.getElementById('statMinutes').textContent   = totalMin;
    document.getElementById('statFaveStyle').textContent = STYLE_LABELS[fave]||fave;
    document.getElementById('statStreak').textContent    = streak;
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();

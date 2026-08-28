/* IRONGLADIATOR — Static reference data.
   The chart data (lifts) lives here. Training log and standards
   are now stored in Firebase — edit them live on the site instead. */

/* 12 weeks of estimated 1-rep max (lbs) for each lift — used by the progress chart */
const lifts = {
  squat: { label: 'Squat',    color: 'var(--squat)', data: [255,260,258,268,272,275,283,288,290,300,308,315] },
  bench: { label: 'Bench',    color: 'var(--bench)', data: [185,188,190,193,196,198,205,208,210,215,220,225] },
  dead:  { label: 'Deadlift', color: 'var(--dead)',  data: [345,352,350,360,368,372,380,385,390,395,400,405] }
};

/* Fallback log shown before Firebase loads (sample data only) */
const log = [
  { date: 'May 30', lift: 'Deadlift', cls: 'dead',  sets: 3, reps: 5, wt: 365, note: 'PR' },
  { date: 'May 28', lift: 'Bench',    cls: 'bench', sets: 5, reps: 5, wt: 205, note: '' },
  { date: 'May 26', lift: 'Squat',    cls: 'squat', sets: 5, reps: 5, wt: 285, note: '' },
  { date: 'May 23', lift: 'Bench',    cls: 'bench', sets: 4, reps: 6, wt: 195, note: '' },
  { date: 'May 21', lift: 'Squat',    cls: 'squat', sets: 3, reps: 3, wt: 300, note: 'PR' },
  { date: 'May 19', lift: 'Deadlift', cls: 'dead',  sets: 3, reps: 5, wt: 355, note: '' },
];

/* Labels for the five strength tiers */
const tierNames = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'];

/* Percentage rows shown in the 1RM calculator results table */
const pctRows = [
  { pct: 100, reps: '1 rep',  use: 'Test / max single' },
  { pct: 90,  reps: '3 reps', use: 'Heavy strength work' },
  { pct: 80,  reps: '5 reps', use: 'Classic 5×5 building' },
  { pct: 70,  reps: '8 reps', use: 'Hypertrophy / volume' },
  { pct: 60,  reps: '10–12',  use: 'Warm‑ups / technique' },
];

/* Strength tier thresholds by bodyweight class (lbs).
   Each key is the upper bound of the weight class.
   8 values per lift: [Bronze, Silver, Gold, Elite(lo), Elite(hi), Titan, Legend, Gladiator]
   Cleared thresholds map to ranks: 0-1=Recruit, 2=Bronze, 3=Silver, 4=Gold,
   5=Elite, 6=Titan, 7=Legend, 8=Gladiator */
const bodyweightStandards = {
  148: {
    squat: [65,  95,  175, 215, 255, 340, 385, 430],
    bench: [45,  65,  120, 155, 185, 245, 280, 310],
    dead:  [95,  135, 235, 290, 345, 455, 510, 570]
  },
  165: {
    squat: [75,  110, 195, 240, 285, 375, 420, 470],
    bench: [55,  75,  135, 170, 205, 270, 305, 340],
    dead:  [110, 155, 260, 320, 380, 500, 560, 620]
  },
  181: {
    squat: [85,  120, 215, 265, 315, 410, 460, 510],
    bench: [60,  85,  150, 190, 225, 295, 335, 370],
    dead:  [120, 175, 285, 350, 410, 540, 605, 670]
  },
  198: {
    squat: [95,  135, 235, 290, 340, 445, 500, 555],
    bench: [65,  90,  165, 205, 245, 320, 360, 400],
    dead:  [135, 195, 310, 380, 450, 585, 650, 720]
  },
  220: {
    squat: [105, 150, 255, 315, 370, 485, 545, 600],
    bench: [70,  100, 180, 225, 265, 345, 390, 430],
    dead:  [150, 215, 340, 415, 485, 630, 700, 775]
  },
  242: {
    squat: [110, 160, 275, 340, 400, 520, 580, 645],
    bench: [75,  110, 195, 240, 285, 375, 420, 465],
    dead:  [160, 230, 365, 445, 520, 670, 750, 825]
  },
  275: {
    squat: [120, 170, 295, 365, 430, 555, 620, 685],
    bench: [85,  120, 210, 260, 310, 400, 450, 495],
    dead:  [170, 245, 390, 475, 555, 715, 800, 880]
  }
};

/* ===== MUSCLE GROUPS =========================================================
   The fine-grained layer underneath splits. Every lift has exactly ONE home
   group: a bench hits triceps, but its home is chest. Users never edit this —
   it describes what a lift IS, not how someone chooses to train it.

   A split (added separately) is only a set of buckets these groups roll up
   into, which is why switching splits never re-tags a single exercise.

   Lives in data.js because every page loads it. liftToCls() cannot be reused
   here: it is defined inside initApp() in app.js, so the feed and profile have
   no access to it and read the stored cls instead.

   NOTE: this is additive. liftToCls() and the stored `cls` are untouched and
   still drive everything currently on screen. ========================== */

const IG_MUSCLE_GROUPS = [
  { id: 'chest',      label: 'Chest',      region: 'Upper' },
  { id: 'back',       label: 'Back',       region: 'Upper' },
  { id: 'traps',      label: 'Traps',      region: 'Upper' },
  { id: 'shoulders',  label: 'Shoulders',  region: 'Upper' },
  { id: 'biceps',     label: 'Biceps',     region: 'Arms'  },
  { id: 'triceps',    label: 'Triceps',    region: 'Arms'  },
  { id: 'forearms',   label: 'Forearms',   region: 'Arms'  },
  { id: 'quads',      label: 'Quads',      region: 'Lower' },
  { id: 'hamstrings', label: 'Hamstrings', region: 'Lower' },
  { id: 'glutes',     label: 'Glutes',     region: 'Lower' },
  { id: 'calves',     label: 'Calves',     region: 'Lower' },
  { id: 'core',       label: 'Core',       region: 'Core'  },
];

/* Primary group per lift. Every name liftToCls() recognizes appears exactly
   once — igVerifyLiftGroups() below asserts that, so adding a lift to one and
   not the other is caught rather than silently becoming 'other'.

   Judgement calls worth naming:
     deadlift/rack pull -> back, not hamstrings. Every split files them under
       back or pull, and that is where people look for them.
     dips/push-up -> chest, the conventional home despite heavy triceps work.
     shrugs -> traps, which is why traps exists as its own group at all.
     hammer curl -> biceps, with forearms as the secondary the muscle map
       already tracks.
     adductors -> quads. Anatomically its own thing, but it lands in Legs
       under every split, and a group nobody splits on is just clutter. */
const IG_LIFT_GROUP_LISTS = {
  chest: ['bench','bench press','incline press','decline chest press','db flat press',
          'db incline press','machine chest press','dips','push-up','chest fly',
          'low chest fly','mid chest fly','high chest fly','pec dec'],
  back:  ['deadlift','rack pull','row','barbell row','cable row','chest supported row',
          'machine row','pulldown','lat pulldown','machine lat pulldown',
          'cable lat pulldown','pull-up','t-bar row','lat pullover'],
  traps: ['shrugs'],
  shoulders: ['overhead press','ohp','shoulder press','arnold press','lateral raise',
              'db lateral raise','cable lateral raise','machine lateral raise',
              'rear delt raise','front raise','face pull'],
  biceps:  ['bicep curl','db bicep curl','cable bicep curl','machine bicep curl',
            'hammer curl','preacher curl','concentration curl'],
  triceps: ['tricep pushdown','single arm tricep pushdown','db tricep extension',
            'cable tricep extension','machine tricep extension','overhead tricep',
            'skull crusher','close grip bench','jm press'],
  forearms: [],
  quads: ['squat','split squat','bulgarian split squats','hack squat','pendulum squat',
          'bw squat','smith squat','leg press','lunges','leg extension','adductors'],
  hamstrings: ['rdl','leg curl','seated hamstring curl','lying hamstring curl'],
  glutes: ['hip thrust','abductors'],
  calves: ['calf raise'],
  core: ['crunch','sit-up','cable crunch','hanging leg raise','lying leg raise','plank',
         'side plank','russian twist','bicycle crunch','ab wheel rollout',
         'cable woodchopper','hollow hold'],
};

const IG_LIFT_TO_GROUP = {};
Object.keys(IG_LIFT_GROUP_LISTS).forEach(function (group) {
  IG_LIFT_GROUP_LISTS[group].forEach(function (name) { IG_LIFT_TO_GROUP[name] = group; });
});

/* Legacy bridge for custom exercises. They currently store the coarse `cls`
   chosen in Settings, which has no muscle-level meaning. Three of those map
   cleanly; 'arm' deliberately does not, because it lumps biceps, triceps and
   shoulders together and guessing would be wrong roughly two times in three.
   Those resolve to 'other' so the settings UI can later surface them as
   "needs a muscle group" rather than quietly filing them somewhere wrong. */
const IG_CLS_TO_GROUP = { squat: 'quads', bench: 'chest', dead: 'back', core: 'core' };

/* name -> group id. customLifts is passed in rather than read from a global so
   this stays pure and usable from the feed and profile, which have no
   currentSettings of their own. */
function igLiftToGroup(name, customLifts) {
  const n = (name || '').toLowerCase().trim();
  const custom = (customLifts || []).find(function (l) {
    return (typeof l === 'string' ? l : (l && l.name) || '').toLowerCase() === n;
  });
  if (custom && typeof custom !== 'string') {
    if (custom.group) return custom.group;
    if (custom.cls && IG_CLS_TO_GROUP[custom.cls]) return IG_CLS_TO_GROUP[custom.cls];
    return 'other';
  }
  return IG_LIFT_TO_GROUP[n] || 'other';
}

function igGroupLabel(groupId) {
  const g = IG_MUSCLE_GROUPS.find(function (x) { return x.id === groupId; });
  return g ? g.label : 'Other';
}

/* Read a session's muscle group. New sessions store it; anything logged before
   that does not, so it falls back to deriving from the lift name — which works
   because the name is stored on every session ever written. */
function igSessionGroup(session, customLifts) {
  if (!session) return 'other';
  if (session.group) return session.group;
  return igLiftToGroup(session.lift, customLifts);
}

/* ===== SPLIT PRESETS =========================================================
   A split is only a set of buckets that muscle groups roll up into. Picking a
   different one never re-tags an exercise and never rewrites history — a curl
   is always 'biceps', all that changes is whether biceps rolls into Arms, Pull
   or Upper.

   Every preset must place all 12 groups exactly once. igVerifySplits() checks
   that, so a group can never be silently orphaned by a preset that forgot it.

   Colors reuse the app's existing group palette so a split looks native the
   moment it is picked; gold is the one addition, for the shoulders bucket that
   had no colour of its own before. ======================================== */

const IG_ALL_LEGS  = ['quads','hamstrings','glutes','calves'];
const IG_ALL_ARMS  = ['biceps','triceps','forearms'];

const IG_SPLIT_PRESETS = [
  {
    id: 'bodypart', label: 'Body Part', blurb: 'Chest · Back · Shoulders · Arms · Legs',
    buckets: [
      { id:'chest',     label:'Chest',     color:'#5BD6E6', groups:['chest'] },
      { id:'back',      label:'Back',      color:'#FF8A4C', groups:['back','traps'] },
      { id:'shoulders', label:'Shoulders', color:'#FFC857', groups:['shoulders'] },
      { id:'arms',      label:'Arms',      color:'#B78BFF', groups: IG_ALL_ARMS },
      { id:'legs',      label:'Legs',      color:'#D6FF3D', groups: IG_ALL_LEGS },
      { id:'core',      label:'Core',      color:'#D98CA6', groups:['core'] },
    ],
  },
  {
    id: 'ppl', label: 'Push / Pull / Legs', blurb: 'The classic three-way',
    buckets: [
      { id:'push', label:'Push', color:'#5BD6E6', groups:['chest','shoulders','triceps'] },
      { id:'pull', label:'Pull', color:'#FF8A4C', groups:['back','traps','biceps','forearms'] },
      { id:'legs', label:'Legs', color:'#D6FF3D', groups: IG_ALL_LEGS },
      { id:'core', label:'Core', color:'#D98CA6', groups:['core'] },
    ],
  },
  {
    id: 'upperlower', label: 'Upper / Lower', blurb: 'Two days, split at the waist',
    buckets: [
      { id:'upper', label:'Upper', color:'#5BD6E6', groups:['chest','back','traps','shoulders','biceps','triceps','forearms'] },
      { id:'lower', label:'Lower', color:'#D6FF3D', groups: IG_ALL_LEGS },
      { id:'core',  label:'Core',  color:'#D98CA6', groups:['core'] },
    ],
  },
  {
    id: 'arnold', label: 'Arnold', blurb: 'Chest & Back · Shoulders & Arms · Legs',
    buckets: [
      { id:'chestback',  label:'Chest & Back',     color:'#5BD6E6', groups:['chest','back','traps'] },
      { id:'shoulderarm',label:'Shoulders & Arms', color:'#B78BFF', groups:['shoulders'].concat(IG_ALL_ARMS) },
      { id:'legs',       label:'Legs',             color:'#D6FF3D', groups: IG_ALL_LEGS },
      { id:'core',       label:'Core',             color:'#D98CA6', groups:['core'] },
    ],
  },
  {
    id: 'fullbody', label: 'Full Body', blurb: 'Everything, every session',
    buckets: [
      { id:'full', label:'Full Body', color:'#5BD6E6',
        groups:['chest','back','traps','shoulders'].concat(IG_ALL_ARMS, IG_ALL_LEGS, ['core']) },
    ],
  },
];

/* Body Part reproduces what the app already does, so an existing user who
   never opens the setting sees no change at all. */
const IG_DEFAULT_SPLIT = 'bodypart';

/* User-built splits live in settings.customSplits and are resolved everywhere
   a preset is, so nothing downstream needs to know the difference. */
function igCustomSplits(settings) {
  const list = settings && settings.customSplits;
  return Array.isArray(list) ? list : [];
}

function igAllSplits(settings) {
  return IG_SPLIT_PRESETS.concat(igCustomSplits(settings));
}

/* settings is optional: without it only presets resolve, which is all the
   callers that predate custom splits ever needed. */
function igSplitById(id, settings) {
  return igAllSplits(settings).find(function (s) { return s.id === id; })
      || IG_SPLIT_PRESETS.find(function (s) { return s.id === IG_DEFAULT_SPLIT; });
}

function igActiveSplit(settings) {
  return igSplitById(settings && settings.split, settings);
}

/* Every muscle group in exactly one day, every day named and non-empty. The
   builder's UI makes orphans and duplicates structurally impossible, but this
   also guards data that arrives from anywhere else — an older client, a
   half-finished edit, a hand-edited document. */
function igValidateSplit(split) {
  const errors = [];
  const label = (split && split.label || '').trim();
  const buckets = (split && split.buckets) || [];

  if (!label) errors.push('Give your split a name.');
  else if (label.length > 30) errors.push('Split name must be 30 characters or less.');
  if (!buckets.length) errors.push('Add at least one day.');

  const names = buckets.map(function (b) { return (b.label || '').trim().toLowerCase(); });
  if (names.some(function (n) { return !n; })) errors.push('Every day needs a name.');
  names.forEach(function (n, i) {
    if (n && names.indexOf(n) !== i) errors.push('Two days are both called "' + buckets[i].label.trim() + '".');
  });

  buckets.forEach(function (b) {
    if (!(b.groups || []).length) errors.push('"' + (b.label || 'Untitled') + '" has no muscles in it.');
  });

  const seen = [];
  buckets.forEach(function (b) { seen.push.apply(seen, b.groups || []); });
  const missing = IG_MUSCLE_GROUPS.map(function (g) { return g.id; })
    .filter(function (g) { return seen.indexOf(g) === -1; });
  const dupes = seen.filter(function (g, i) { return seen.indexOf(g) !== i; });
  if (missing.length) errors.push('Not placed yet: ' + missing.map(igGroupLabel).join(', ') + '.');
  if (dupes.length) errors.push('In two days at once: ' + dupes.map(igGroupLabel).join(', ') + '.');

  return { ok: errors.length === 0, errors: errors.filter(function (e, i) { return errors.indexOf(e) === i; }) };
}

/* Which bucket a muscle group falls into under a given split. */
function igBucketForGroup(split, groupId) {
  if (!split) return null;
  return split.buckets.find(function (b) { return b.groups.indexOf(groupId) !== -1; }) || null;
}

/* The bucket a lift lands in right now, for writing onto a new session. */
function igBucketForLift(name, settings) {
  const group  = igLiftToGroup(name, settings && settings.customLifts);
  const bucket = igBucketForGroup(igActiveSplit(settings), group);
  return bucket ? bucket.id : 'other';
}

/* Reading a session back. The stored bucket always wins — that is what keeps
   history frozen when someone switches splits. Sessions logged before this
   existed have none, so they fall back to the split they are being read
   under, which reproduces exactly what the app showed them before. */
function igSessionBucket(session, settings) {
  if (!session) return 'other';
  if (session.bucket) return session.bucket;
  const group = igSessionGroup(session, settings && settings.customLifts);
  const bucket = igBucketForGroup(igActiveSplit(settings), group);
  return bucket ? bucket.id : 'other';
}

/* Bucket metadata by id, searching the active split first and then every
   preset — so a bucket retired by a split change still resolves to its label
   and colour instead of leaving old history unlabelled and grey. */
/* Days from splits that no longer exist. A preset's days always resolve
   because the preset is still in the code, but a custom split the user
   deleted (or a day they removed while editing) takes its definitions with
   it — and sessions logged under it would lose their name and colour. So
   those definitions are archived here on the way out. */
function igRetiredBuckets(settings) {
  const r = settings && settings.retiredBuckets;
  return (r && typeof r === 'object') ? r : {};
}

function igBucketMeta(bucketId, settings) {
  const active = igActiveSplit(settings);
  const here = active && active.buckets.find(function (b) { return b.id === bucketId; });
  if (here) return here;
  const all = igAllSplits(settings);
  for (let i = 0; i < all.length; i++) {
    const b = all[i].buckets.find(function (x) { return x.id === bucketId; });
    if (b) return b;
  }
  const retired = igRetiredBuckets(settings)[bucketId];
  if (retired) return { id: bucketId, label: retired.label, color: retired.color, groups: [], retired: true };
  return { id:'other', label:'Other', color:'#8A8F98', groups:[] };
}

/* How a stored day should DISPLAY right now.

   A day is frozen onto a session by id, but two splits can own days with the
   same name — a custom "Back" day and Body Part's "Back", or two splits that
   both call a day "Legs". Rendering those by id gives one calendar square
   orange and another green while both read "Back", and a legend with the same
   name listed twice in two colours.

   So: keep the stored day's NAME, which is what freezing is actually for, but
   take the COLOUR from the day of the same name in the split you are on now.
   Same name always looks the same, and a name the current split does not use
   keeps its own colour so retired days stay distinguishable. */
function igDayDisplay(bucketId, settings) {
  const meta = igBucketMeta(bucketId, settings);
  if (!meta || meta.id === 'other') return meta;
  const name = String(meta.label || '').trim().toLowerCase();
  const sameName = function (b) { return String(b.label || '').trim().toLowerCase() === name; };

  /* The split you are on wins, so days you actually use look the way you set
     them. */
  const active = igActiveSplit(settings);
  const twin = active && active.buckets.find(sameName);
  if (twin) return { id: twin.id, label: twin.label, color: twin.color };

  /* No day of that name in the current split — two retired days could still
     share a name (a custom "Back" and Body Part's "Back") and would otherwise
     render in two different colours while reading identically. Resolve to the
     first match across every split, in a fixed order, so one name always maps
     to one colour no matter which session is being drawn. */
  const all = igAllSplits(settings);
  for (let i = 0; i < all.length; i++) {
    const b = all[i].buckets.find(sameName);
    if (b) return { id: b.id, label: b.label, color: b.color };
  }
  return meta;
}

/* Fold a set of buckets into the retired map, keeping whatever is already
   there. Called when a custom split is deleted, and when an edit drops a day
   that history may still point at. */
function igArchiveBuckets(settings, buckets) {
  const out = Object.assign({}, igRetiredBuckets(settings));
  (buckets || []).forEach(function (b) {
    if (b && b.id) out[b.id] = { label: b.label, color: b.color };
  });
  return out;
}

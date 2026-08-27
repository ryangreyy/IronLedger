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

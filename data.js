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
   Values are [Beginner, Novice, Intermediate, Advanced, Elite] for each lift. */
const bodyweightStandards = {
  148: {
    squat: [95,  175, 255, 340, 430],
    bench: [65,  120, 185, 245, 310],
    dead:  [135, 235, 345, 455, 570]
  },
  165: {
    squat: [110, 195, 285, 375, 470],
    bench: [75,  135, 205, 270, 340],
    dead:  [155, 260, 380, 500, 620]
  },
  181: {
    squat: [120, 215, 315, 410, 510],
    bench: [85,  150, 225, 295, 370],
    dead:  [175, 285, 410, 540, 670]
  },
  198: {
    squat: [135, 235, 340, 445, 555],
    bench: [90,  165, 245, 320, 400],
    dead:  [195, 310, 450, 585, 720]
  },
  220: {
    squat: [150, 255, 370, 485, 600],
    bench: [100, 180, 265, 345, 430],
    dead:  [215, 340, 485, 630, 775]
  },
  242: {
    squat: [160, 275, 400, 520, 645],
    bench: [110, 195, 285, 375, 465],
    dead:  [230, 365, 520, 670, 825]
  },
  275: {
    squat: [170, 295, 430, 555, 685],
    bench: [120, 210, 310, 400, 495],
    dead:  [245, 390, 555, 715, 880]
  }
};

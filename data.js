/* IRONLEDGER — Sample workout data.
   This is the only file you need to edit to swap in real training numbers. */

/* 12 weeks of estimated 1-rep max (lbs) for each lift — used by the progress chart */
const lifts = {
  squat: { label: 'Squat',    color: 'var(--squat)', data: [255,260,258,268,272,275,283,288,290,300,308,315] },
  bench: { label: 'Bench',    color: 'var(--bench)', data: [185,188,190,193,196,198,205,208,210,215,220,225] },
  dead:  { label: 'Deadlift', color: 'var(--dead)',  data: [345,352,350,360,368,372,380,385,390,395,400,405] }
};

/* Recent training sessions — each row appears in the Training Log table */
const log = [
  { date: 'May 30', lift: 'Deadlift', cls: 'dead',  sets: 3, reps: 5, wt: 365, note: 'PR' },
  { date: 'May 28', lift: 'Bench',    cls: 'bench', sets: 5, reps: 5, wt: 205, note: '' },
  { date: 'May 26', lift: 'Squat',    cls: 'squat', sets: 5, reps: 5, wt: 285, note: '' },
  { date: 'May 23', lift: 'Bench',    cls: 'bench', sets: 4, reps: 6, wt: 195, note: '' },
  { date: 'May 21', lift: 'Squat',    cls: 'squat', sets: 3, reps: 3, wt: 300, note: 'PR' },
  { date: 'May 19', lift: 'Deadlift', cls: 'dead',  sets: 3, reps: 5, wt: 355, note: '' },
];

/* Strength standards for a ~180 lb lifter — used by the "Where you stand" bars */
const standards = [
  { lift: 'Squat',    cls: 'squat', current: 315, tiers: [135, 225, 315, 405, 495] },
  { lift: 'Bench',    cls: 'bench', current: 225, tiers: [95,  155, 225, 275, 335] },
  { lift: 'Deadlift', cls: 'dead',  current: 405, tiers: [185, 275, 365, 455, 545] },
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

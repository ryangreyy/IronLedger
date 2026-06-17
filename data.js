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

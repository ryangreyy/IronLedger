/* challenges.js — IronGladiator XP & Challenges system
   Load order: firebase SDKs → firebase-config.js → data.js → challenges.js → app.js */

/* ============================================================
   RANKS
   ============================================================ */
const RANKS    = ['Recruit','Bronze','Silver','Gold','Elite','Titan','Legend','Gladiator'];
const RANK_XP  = [0, 300, 1000, 2500, 5000, 10000, 20000, 40000];

const RANK_HEX_COLS = [
  ['#4B5563','#9AA0AC'], // Recruit
  ['#7D4A1E','#CD7F32'], // Bronze
  ['#6B7280','#C8CAD0'], // Silver
  ['#92700A','#FFD700'], // Gold
  ['#1E40AF','#60A5FA'], // Elite
  ['#5B21B6','#A78BFA'], // Titan
  ['#9A3412','#FB923C'], // Legend
  ['#C1272D','#F0565B'], // Gladiator
];
function rankHexBadge(idx) {
  const [stroke, fill] = RANK_HEX_COLS[idx] || RANK_HEX_COLS[0];
  const num = ['I','II','III','IV','V','VI','VII','VIII'][idx] || 'I';
  return `<svg style="width:28px;height:32px;flex-shrink:0;" viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg">
    <polygon points="30,3 56,18 56,52 30,67 4,52 4,18" fill="#15171c" stroke="${stroke}" stroke-width="2.5"/>
    <text x="30" y="47" text-anchor="middle" font-family="Anton,sans-serif" font-size="28" fill="${fill}">${num}</text>
  </svg>`;
}

function getRankFromXP(xp) {
  let idx = 0;
  for (let i = RANK_XP.length - 1; i >= 0; i--) {
    if (xp >= RANK_XP[i]) { idx = i; break; }
  }
  return {
    rankIndex: idx,
    rankName:  RANKS[idx],
    thisXP:    RANK_XP[idx],
    nextXP:    RANK_XP[idx + 1] || null,
    nextName:  RANKS[idx + 1]   || null,
  };
}

/* ============================================================
   DATE HELPERS  (self-contained so load order doesn't matter)
   ============================================================ */
function _igLocalISO(d) {
  const t = d instanceof Date ? d : new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
}

function _igWeekStart(dateStr) {
  const d   = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return _igLocalISO(d);
}

/* ============================================================
   CHALLENGE POOL  (230 challenges)

   check.type values:
     session       — any non-rest session logged (daily: today / weekly: this week)
     sets          — total sets (daily: today / weekly: max sets in any day this week)
     sets_lift     — max sets on one lift (daily: today / weekly: max in any day this week)
     exercises     — distinct exercise names (daily: today / weekly: max in any day this week)
     muscle_groups — distinct cls values (daily: today / weekly: max in any day this week)
     reps          — total reps (daily: today / weekly: max reps in any day this week)
     streak        — consecutive training days ending today (same for daily & weekly)
     sessions_week — distinct days with sessions this week (same for daily & weekly)
     bw_logged     — bodyweight entry exists today (daily only)
     bw_days_week  — distinct days with BW entry this week (daily only)
     goal_done     — goals completed today (daily only)
     goal_added    — goals added today (daily only)
   ============================================================ */
const CHALLENGE_POOL = [

  // ─────── VOLUME — Easy ───────
  { id:'vol_e_1',  name:'Show up',           desc:'Log any session today',                cat:'volume', diff:'easy',   xp:25,  check:{type:'session',    threshold:1} },
  { id:'vol_e_2',  name:'Get moving',        desc:'Log at least 1 exercise today',        cat:'volume', diff:'easy',   xp:25,  check:{type:'exercises',  threshold:1} },
  { id:'vol_e_3',  name:'Put in the work',   desc:'Log 3+ sets today',                   cat:'volume', diff:'easy',   xp:25,  check:{type:'sets',       threshold:3} },
  { id:'vol_e_4',  name:'Clock in',          desc:'Complete a training session today',    cat:'volume', diff:'easy',   xp:25,  check:{type:'session',    threshold:1} },
  { id:'vol_e_5',  name:'Just lift',         desc:'Log any lift today',                  cat:'volume', diff:'easy',   xp:25,  check:{type:'exercises',  threshold:1} },
  { id:'vol_e_6',  name:'Still here',        desc:'Log a session today',                 cat:'volume', diff:'easy',   xp:25,  check:{type:'session',    threshold:1} },
  { id:'vol_e_7',  name:'Baseline',          desc:'Log at least 3 exercises today',      cat:'volume', diff:'easy',   xp:25,  check:{type:'exercises',  threshold:3} },
  { id:'vol_e_8',  name:'One more',          desc:'Log 5+ sets today',                   cat:'volume', diff:'easy',   xp:25,  check:{type:'sets',       threshold:5} },
  { id:'vol_e_9',  name:'Early work',        desc:'Log a session today',                 cat:'volume', diff:'easy',   xp:25,  check:{type:'session',    threshold:1} },
  { id:'vol_e_10', name:'Stay active',       desc:'Log any exercise today',              cat:'volume', diff:'easy',   xp:25,  check:{type:'exercises',  threshold:1} },
  { id:'vol_e_11', name:'Foundation',        desc:'Log 4+ sets today',                   cat:'volume', diff:'easy',   xp:25,  check:{type:'sets',       threshold:4} },
  { id:'vol_e_12', name:'Lace up',           desc:'Complete any training session today', cat:'volume', diff:'easy',   xp:25,  check:{type:'session',    threshold:1} },
  { id:'vol_e_13', name:'Opening set',       desc:'Log at least 1 set today',            cat:'volume', diff:'easy',   xp:25,  check:{type:'sets',       threshold:1} },
  { id:'vol_e_14', name:'Start somewhere',   desc:'Log at least 2 sets today',           cat:'volume', diff:'easy',   xp:25,  check:{type:'sets',       threshold:2} },
  { id:'vol_e_15', name:'Minimum entry',     desc:'Log 4+ sets today',                   cat:'volume', diff:'easy',   xp:25,  check:{type:'sets',       threshold:4} },
  { id:'vol_e_16', name:'Warm up complete',  desc:'Log 3+ sets of any lift',             cat:'volume', diff:'easy',   xp:25,  check:{type:'sets',       threshold:3} },
  { id:'vol_e_17', name:'Keep moving',       desc:'Log any session today',               cat:'volume', diff:'easy',   xp:25,  check:{type:'session',    threshold:1} },
  { id:'vol_e_18', name:'First step',        desc:'Log 3+ sets on a single lift',        cat:'volume', diff:'easy',   xp:25,  check:{type:'sets_lift',  threshold:3} },
  { id:'vol_e_19', name:'Stay in motion',    desc:'Log any training today',              cat:'volume', diff:'easy',   xp:25,  check:{type:'session',    threshold:1} },
  { id:'vol_e_20', name:'Daily work',        desc:'Log 3+ sets today',                   cat:'volume', diff:'easy',   xp:25,  check:{type:'sets',       threshold:3} },

  // ─────── VOLUME — Medium ───────
  { id:'vol_m_1',  name:'Load up',                 desc:'Hit 10+ sets today',                        cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:10} },
  { id:'vol_m_2',  name:'Stay hungry',             desc:'Log 4+ exercises in one session',           cat:'volume', diff:'medium', xp:60, check:{type:'exercises', threshold:4}  },
  { id:'vol_m_3',  name:'Double down',             desc:'Hit 6+ sets on a single lift today',        cat:'volume', diff:'medium', xp:60, check:{type:'sets_lift', threshold:6}  },
  { id:'vol_m_4',  name:'Push through',            desc:'Hit 12+ total sets today',                  cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:12} },
  { id:'vol_m_5',  name:'Heavy day',               desc:'Log 5+ sets of a compound lift',            cat:'volume', diff:'medium', xp:60, check:{type:'sets_lift', threshold:5}  },
  { id:'vol_m_6',  name:'Dig deeper',              desc:'Hit 15+ total sets in a session',           cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:15} },
  { id:'vol_m_7',  name:'Full send',               desc:'Complete 5+ exercises today',               cat:'volume', diff:'medium', xp:60, check:{type:'exercises', threshold:5}  },
  { id:'vol_m_8',  name:'Work ethic',              desc:'Hit 10+ sets before calling it a day',      cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:10} },
  { id:'vol_m_9',  name:'Turn it up',              desc:'Log a session with 12+ total sets',         cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:12} },
  { id:'vol_m_10', name:'Mean business',           desc:'Log 12+ total sets today',                  cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:12} },
  { id:'vol_m_11', name:'No shortcuts',            desc:'Log 12+ total sets today',                  cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:12} },
  { id:'vol_m_12', name:'Committed to the cause',  desc:'Log 10+ total sets today',                 cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:10} },
  { id:'vol_m_13', name:'Rep day',                 desc:'Log 50+ total reps today',                  cat:'volume', diff:'medium', xp:60, check:{type:'reps',      threshold:50} },
  { id:'vol_m_14', name:'Stay the course',         desc:'Log 10+ total sets today',                  cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:10} },
  { id:'vol_m_15', name:'Grind session',           desc:'Hit 14+ total sets today',                  cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:14} },
  { id:'vol_m_16', name:'More reps',               desc:'Log 50+ total reps today',                  cat:'volume', diff:'medium', xp:60, check:{type:'reps',      threshold:50} },
  { id:'vol_m_17', name:'Eyes on the prize',       desc:'Complete a 4+ exercise session',            cat:'volume', diff:'medium', xp:60, check:{type:'exercises', threshold:4}  },
  { id:'vol_m_18', name:'Raise the floor',         desc:'Log 12+ sets today',                        cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:12} },
  { id:'vol_m_19', name:'Locked in',               desc:'Log 10+ total sets today',                 cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:10} },
  { id:'vol_m_20', name:'Go the distance',         desc:'Log 15+ total sets today',                  cat:'volume', diff:'medium', xp:60, check:{type:'sets',      threshold:15} },

  // ─────── VOLUME — Hard ───────
  { id:'vol_h_1',  name:'Grind it out',       desc:'Hit 20+ sets in one session',                    cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:20} },
  { id:'vol_h_2',  name:'Beast mode',         desc:'Log 5+ different exercises today',               cat:'volume', diff:'hard', xp:150, check:{type:'exercises', threshold:5}  },
  { id:'vol_h_3',  name:'No ceiling',         desc:'Hit 25+ total sets today',                       cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:25} },
  { id:'vol_h_4',  name:'All out',            desc:'Hit 100+ total reps today',                      cat:'volume', diff:'hard', xp:150, check:{type:'reps',      threshold:100}},
  { id:'vol_h_5',  name:'Relentless',         desc:'Log 6+ different exercises today',               cat:'volume', diff:'hard', xp:150, check:{type:'exercises', threshold:6}  },
  { id:'vol_h_6',  name:'The full treatment', desc:'Complete a session with 25+ total sets',         cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:25} },
  { id:'vol_h_7',  name:'High tide',          desc:'Hit 30+ total sets today',                       cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:30} },
  { id:'vol_h_8',  name:'Unstoppable',        desc:'Complete 7+ exercises in one session',           cat:'volume', diff:'hard', xp:150, check:{type:'exercises', threshold:7}  },
  { id:'vol_h_9',  name:'Stack it up',        desc:'Hit 100+ total reps today',                      cat:'volume', diff:'hard', xp:150, check:{type:'reps',      threshold:100}},
  { id:'vol_h_10', name:'Maximum output',     desc:'Log 25+ total sets today',                       cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:25} },
  { id:'vol_h_11', name:'Earn it',            desc:'Log 20+ total sets today',                       cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:20} },
  { id:'vol_h_12', name:'Leave nothing',      desc:'Log 30+ sets today',                             cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:30} },
  { id:'vol_h_13', name:'Full arsenal',       desc:'Log 5+ different exercises today',               cat:'volume', diff:'hard', xp:150, check:{type:'exercises',threshold:5}  },
  { id:'vol_h_14', name:'Push your limits',   desc:'Hit 20+ sets today — your hardest session yet',  cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:20} },
  { id:'vol_h_15', name:'Volume siege',        desc:'Log 25+ total sets today',                       cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:25} },
  { id:'vol_h_16', name:'Built different',    desc:'Log 80+ total reps today',                       cat:'volume', diff:'hard', xp:150, check:{type:'reps',      threshold:80} },
  { id:'vol_h_17', name:'War ready',          desc:'Log 6+ different exercises today',               cat:'volume', diff:'hard', xp:150, check:{type:'exercises', threshold:6}  },
  { id:'vol_h_18', name:'Volume king',        desc:'Log 20+ total sets today',                       cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:20} },
  { id:'vol_h_19', name:'Iron man',           desc:'Log 30+ total sets today',                       cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:30} },
  { id:'vol_h_20', name:'No half measures',   desc:'Log 25+ total sets today',                       cat:'volume', diff:'hard', xp:150, check:{type:'sets',      threshold:25} },

  // ─────── CONSISTENCY — Easy ───────
  { id:'con_e_1',  name:'Keep the streak',        desc:'Log 3+ sets today',                  cat:'consistency', diff:'easy', xp:25, check:{type:'sets',        threshold:3} },
  { id:'con_e_2',  name:'Back again',             desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_3',  name:"Don't quit",             desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_4',  name:'Stay in it',             desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_5',  name:'Back at it',             desc:'Return to training today',           cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_6',  name:'Habit forming',          desc:'Log 5+ sets today',                  cat:'consistency', diff:'easy', xp:25, check:{type:'sets',        threshold:5} },
  { id:'con_e_7',  name:'Small wins',             desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_8',  name:'The grind starts',       desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_9',  name:'Never skip',             desc:'Train today',                        cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_10', name:'Daily bread',            desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_11', name:'Foot in the door',       desc:'Log any training today',             cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_12', name:'Keep it going',          desc:'Log 4+ sets today',                  cat:'consistency', diff:'easy', xp:25, check:{type:'sets',        threshold:4} },
  { id:'con_e_13', name:'One more day',           desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_14', name:"Don't break the chain",  desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_15', name:'Show up again',          desc:'Log 2+ exercises today',             cat:'consistency', diff:'easy', xp:25, check:{type:'exercises',   threshold:2} },
  { id:'con_e_16', name:'In the zone',            desc:'Train today',                        cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_17', name:'Regular season',         desc:'Train at least once today',          cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_18', name:'Momentum builder',       desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_19', name:'Stay sharp',             desc:'Train today',                        cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },
  { id:'con_e_20', name:'Just keep going',        desc:'Log a session today',                cat:'consistency', diff:'easy', xp:25, check:{type:'session',     threshold:1} },

  // ─────── CONSISTENCY — Medium ───────
  { id:'con_m_1',  name:'Locked in',              desc:'Log 10+ sets today',                    cat:'consistency', diff:'medium', xp:60, check:{type:'sets',          threshold:10} },
  { id:'con_m_2',  name:'Iron routine',           desc:'Hit 3 muscle groups today',             cat:'consistency', diff:'medium', xp:60, check:{type:'muscle_groups', threshold:3} },
  { id:'con_m_3',  name:'Momentum',               desc:'Log 4 different exercises today',       cat:'consistency', diff:'medium', xp:60, check:{type:'exercises',     threshold:4} },
  { id:'con_m_4',  name:'No excuses',             desc:'Log 12+ sets today',                    cat:'consistency', diff:'medium', xp:60, check:{type:'sets',          threshold:12} },
  { id:'con_m_5',  name:'Discipline check',       desc:'Hit 3 muscle groups today',             cat:'consistency', diff:'medium', xp:60, check:{type:'muscle_groups', threshold:3} },
  { id:'con_m_6',  name:'Hold the line',          desc:'Log 4+ exercises today',                cat:'consistency', diff:'medium', xp:60, check:{type:'exercises',     threshold:4} },
  { id:'con_m_7',  name:'3 peat',                 desc:'Log 10+ total sets today',              cat:'consistency', diff:'medium', xp:60, check:{type:'sets',          threshold:10} },
  { id:'con_m_8',  name:'Built on habits',        desc:'Hit 3 muscle groups today',             cat:'consistency', diff:'medium', xp:60, check:{type:'muscle_groups', threshold:3} },
  { id:'con_m_9',  name:'Show up and deliver',    desc:'Log 5 different exercises today',       cat:'consistency', diff:'medium', xp:60, check:{type:'exercises',     threshold:5} },
  { id:'con_m_10', name:'Mid-week push',          desc:'Complete 12+ sets today',               cat:'consistency', diff:'medium', xp:60, check:{type:'sets',          threshold:12} },
  { id:'con_m_11', name:'Keep the engine running',desc:'Hit 3 muscle groups today',             cat:'consistency', diff:'medium', xp:60, check:{type:'muscle_groups', threshold:3} },
  { id:'con_m_12', name:'The routine',            desc:'Log 15+ sets today',                    cat:'consistency', diff:'medium', xp:60, check:{type:'sets',          threshold:15} },
  { id:'con_m_13', name:'Committed',              desc:'Log 4 different exercises today',       cat:'consistency', diff:'medium', xp:60, check:{type:'exercises',     threshold:4} },
  { id:'con_m_14', name:'Steady pace',            desc:'Hit 3 muscle groups today',             cat:'consistency', diff:'medium', xp:60, check:{type:'muscle_groups', threshold:3} },
  { id:'con_m_15', name:'No days wasted',         desc:'Log 5+ exercises today',                cat:'consistency', diff:'medium', xp:60, check:{type:'exercises',     threshold:5} },
  { id:'con_m_16', name:'Full send',              desc:'Log 12+ sets today',                    cat:'consistency', diff:'medium', xp:60, check:{type:'sets',          threshold:12} },
  { id:'con_m_17', name:'Stay on track',          desc:'Hit 3 muscle groups today',             cat:'consistency', diff:'medium', xp:60, check:{type:'muscle_groups', threshold:3} },
  { id:'con_m_18', name:'Mid-week warrior',       desc:'Log 4 exercises today',                 cat:'consistency', diff:'medium', xp:60, check:{type:'exercises',     threshold:4} },
  { id:'con_m_19', name:'Routine locked',         desc:'Log 10+ total sets today',              cat:'consistency', diff:'medium', xp:60, check:{type:'sets',          threshold:10} },
  { id:'con_m_20', name:'Consistent effort',      desc:'Hit 3 muscle groups today',             cat:'consistency', diff:'medium', xp:60, check:{type:'muscle_groups', threshold:3} },

  // ─────── CONSISTENCY — Hard ───────
  { id:'con_h_1',  name:'Unbreakable',           desc:'Log 20+ sets today',               cat:'consistency', diff:'hard', xp:150, check:{type:'sets',          threshold:20} },
  { id:'con_h_2',  name:'Iron will',             desc:'Hit all 4 muscle groups today',    cat:'consistency', diff:'hard', xp:150, check:{type:'muscle_groups', threshold:4} },
  { id:'con_h_3',  name:'Full send',             desc:'Log 25+ sets today',               cat:'consistency', diff:'hard', xp:150, check:{type:'sets',          threshold:25} },
  { id:'con_h_4',  name:'No days off',           desc:'Log 6+ exercises today',           cat:'consistency', diff:'hard', xp:150, check:{type:'exercises',     threshold:6} },
  { id:'con_h_5',  name:'All four',              desc:'Hit all 4 muscle groups today',    cat:'consistency', diff:'hard', xp:150, check:{type:'muscle_groups', threshold:4} },
  { id:'con_h_6',  name:'Perfect session',       desc:'Log 20+ sets today',               cat:'consistency', diff:'hard', xp:150, check:{type:'sets',          threshold:20} },
  { id:'con_h_7',  name:'Beast mode',            desc:'Log 7 different exercises today',  cat:'consistency', diff:'hard', xp:150, check:{type:'exercises',     threshold:7} },
  { id:'con_h_8',  name:'All in',                desc:'Log 100+ total reps today',        cat:'consistency', diff:'hard', xp:150, check:{type:'reps',          threshold:100} },
  { id:'con_h_9',  name:'Steel session',         desc:'Log 25+ sets today',               cat:'consistency', diff:'hard', xp:150, check:{type:'sets',          threshold:25} },
  { id:'con_h_10', name:'Non-negotiable',        desc:'Hit all 4 muscle groups today',    cat:'consistency', diff:'hard', xp:150, check:{type:'muscle_groups', threshold:4} },
  { id:'con_h_11', name:'Machine',               desc:'Log 6+ exercises today',           cat:'consistency', diff:'hard', xp:150, check:{type:'exercises',     threshold:6} },
  { id:'con_h_12', name:'Siege mode',            desc:'Log 150+ total reps today',        cat:'consistency', diff:'hard', xp:150, check:{type:'reps',          threshold:150} },
  { id:'con_h_13', name:'The grind never stops', desc:'Log 20+ sets today',               cat:'consistency', diff:'hard', xp:150, check:{type:'sets',          threshold:20} },
  { id:'con_h_14', name:'Relentless',            desc:'Log 7+ exercises today',           cat:'consistency', diff:'hard', xp:150, check:{type:'exercises',     threshold:7} },
  { id:'con_h_15', name:'Built for this',        desc:'Hit all 4 muscle groups today',    cat:'consistency', diff:'hard', xp:150, check:{type:'muscle_groups', threshold:4} },
  { id:'con_h_16', name:'Unstoppable',           desc:'Log 25+ sets today',               cat:'consistency', diff:'hard', xp:150, check:{type:'sets',          threshold:25} },
  { id:'con_h_17', name:'No stopping now',       desc:'Log 200+ total reps today',        cat:'consistency', diff:'hard', xp:150, check:{type:'reps',          threshold:200} },
  { id:'con_h_18', name:'Lock in',               desc:'Log 6 or more exercises today',    cat:'consistency', diff:'hard', xp:150, check:{type:'exercises',     threshold:6} },
  { id:'con_h_19', name:"Warrior's session",     desc:'Log 30+ sets today',               cat:'consistency', diff:'hard', xp:150, check:{type:'sets',          threshold:30} },
  { id:'con_h_20', name:'The obsessed',          desc:'Log 200+ total reps today',        cat:'consistency', diff:'hard', xp:150, check:{type:'reps',          threshold:200} },

  // ─────── VARIETY — Easy ───────
  { id:'var_e_1',  name:'Mix it up',           desc:'Hit 2+ different lifts today',                    cat:'variety', diff:'easy', xp:25, check:{type:'exercises',    threshold:2} },
  { id:'var_e_2',  name:'Branch out',          desc:'Log 2+ different exercises today',                cat:'variety', diff:'easy', xp:25, check:{type:'exercises',    threshold:2} },
  { id:'var_e_3',  name:'Keep it fresh',       desc:"Do a lift you haven't done in a few days",        cat:'variety', diff:'easy', xp:25, check:{type:'exercises',    threshold:2} },
  { id:'var_e_4',  name:'Two birds',           desc:'Hit 2 different muscle groups today',             cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_5',  name:'Go wide',             desc:'Log exercises from 2 different categories',       cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_6',  name:'Not just one',        desc:'Hit 2+ different lifts today',                    cat:'variety', diff:'easy', xp:25, check:{type:'exercises',    threshold:2} },
  { id:'var_e_7',  name:'Spread the work',     desc:'Train 2 different muscle groups today',           cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_8',  name:'Add to the mix',      desc:'Log 2+ different exercises today',                cat:'variety', diff:'easy', xp:25, check:{type:'exercises',    threshold:2} },
  { id:'var_e_9',  name:'Diversify',           desc:'Hit 2+ different categories today',               cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_10', name:'Something different', desc:'Log 2+ different exercises today',                cat:'variety', diff:'easy', xp:25, check:{type:'exercises',    threshold:2} },
  { id:'var_e_11', name:'All angles',          desc:'Hit 2 different muscle groups today',             cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_12', name:'Open it up',          desc:'Log exercises from 2+ categories today',          cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_13', name:'Not a one-trick pony',desc:'Hit 2 different lifts today',                     cat:'variety', diff:'easy', xp:25, check:{type:'exercises',    threshold:2} },
  { id:'var_e_14', name:'Show range',          desc:'Log 2+ exercises from different categories',      cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_15', name:'Balanced attack',     desc:'Train 2 muscle groups today',                     cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_16', name:'Change of pace',      desc:'Log 2+ different exercises today',                cat:'variety', diff:'easy', xp:25, check:{type:'exercises',    threshold:2} },
  { id:'var_e_17', name:'Switch lanes',        desc:'Do a different lift than your usual opener',      cat:'variety', diff:'easy', xp:25, check:{type:'exercises',    threshold:2} },
  { id:'var_e_18', name:'Cross work',          desc:'Hit 2 different muscle groups today',             cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_19', name:'Explore',             desc:'Log an exercise from a new category today',       cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },
  { id:'var_e_20', name:'Widen the net',       desc:'Log exercises from 2 categories today',           cat:'variety', diff:'easy', xp:25, check:{type:'muscle_groups',threshold:2} },

  // ─────── VARIETY — Medium ───────
  { id:'var_m_1',  name:'Switch it up',          desc:'Hit 3+ different lifts today',               cat:'variety', diff:'medium', xp:60, check:{type:'exercises',    threshold:3} },
  { id:'var_m_2',  name:'Full assault',           desc:'Train 3 muscle groups today',               cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:3} },
  { id:'var_m_3',  name:'Three-way',              desc:'Log 3+ different exercises today',          cat:'variety', diff:'medium', xp:60, check:{type:'exercises',    threshold:3} },
  { id:'var_m_4',  name:'Attack from all sides',  desc:'Train 3 different muscle groups today',     cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:3} },
  { id:'var_m_5',  name:'Well-rounded',           desc:'Hit exercises from 3 different categories', cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:3} },
  { id:'var_m_6',  name:'No comfort zone',        desc:'Log 4+ different exercises today',          cat:'variety', diff:'medium', xp:60, check:{type:'exercises',    threshold:4} },
  { id:'var_m_7',  name:'Rotation',               desc:'Hit 2 different muscle groups today',           cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:2} },
  { id:'var_m_8',  name:'Keep them guessing',     desc:'Log 3+ different exercises today',          cat:'variety', diff:'medium', xp:60, check:{type:'exercises',    threshold:3} },
  { id:'var_m_9',  name:'Full body start',        desc:'Hit 2 different muscle groups today',       cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:2} },
  { id:'var_m_10', name:'Cover the bases',        desc:'Train 3+ muscle groups today',              cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:3} },
  { id:'var_m_11', name:'Balanced week',          desc:'Train at least 3 different muscle groups',  cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:3} },
  { id:'var_m_12', name:'Shock the system',       desc:'Hit 2 different muscle groups today',       cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:2} },
  { id:'var_m_13', name:'Triple threat',          desc:'Hit 3 different muscle groups today',       cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:3} },
  { id:'var_m_14', name:'Expand the playbook',    desc:'Log 4+ different exercises today',          cat:'variety', diff:'medium', xp:60, check:{type:'exercises',    threshold:4} },
  { id:'var_m_15', name:'Three different',        desc:'Log 3 exercises from 3 different categories', cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:3} },
  { id:'var_m_16', name:'No weak points',         desc:'Hit 2 different muscle groups today',            cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:2} },
  { id:'var_m_17', name:'Arsenal',                desc:'Use 4+ different exercises today',          cat:'variety', diff:'medium', xp:60, check:{type:'exercises',    threshold:4} },
  { id:'var_m_18', name:'Full rotation',          desc:'Hit 3 different muscle groups by end of session', cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:3} },
  { id:'var_m_19', name:'Widen the arsenal',      desc:'Log 3 exercises from 3 different categories', cat:'variety', diff:'medium', xp:60, check:{type:'muscle_groups',threshold:3} },
  { id:'var_m_20', name:'Spread thin but strong', desc:'Hit 4+ different lifts today',              cat:'variety', diff:'medium', xp:60, check:{type:'exercises',    threshold:4} },

  // ─────── VARIETY — Hard ───────
  { id:'var_h_1',  name:'Full body blitz',       desc:'Train 4+ muscle groups in one session',          cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_2',  name:'No muscle left behind', desc:'Hit every major category today',                 cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_3',  name:'The full menu',         desc:'Log exercises from 4+ different categories',     cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_4',  name:'All angles covered',    desc:'Train 4 different muscle groups today',          cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_5',  name:'Complete attack',       desc:'Hit 4 different muscle groups today',            cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_6',  name:'Master of all',         desc:'Log 6+ different exercises today',               cat:'variety', diff:'hard', xp:150, check:{type:'exercises',    threshold:6} },
  { id:'var_h_7',  name:'Nothing off limits',    desc:'Hit 4 different muscle groups today',            cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_8',  name:'Full spectrum',         desc:'Log exercises from all major categories',         cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_9',  name:'Total warfare',         desc:'Hit 4 different muscle groups today',            cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_10', name:'Cover everything',      desc:'Log exercises from 4 different categories',       cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_11', name:'No blind spots',        desc:'Train every major muscle group today',            cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_12', name:'The whole arsenal',     desc:'Log 6+ different exercises today',               cat:'variety', diff:'hard', xp:150, check:{type:'exercises',    threshold:6} },
  { id:'var_h_13', name:'Complete soldier',      desc:'Train 4 muscle groups in a single session',      cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_14', name:'Leave no muscle untrained', desc:'Hit all major categories today',             cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_15', name:'Dominate all fronts',   desc:'Hit 4 different muscle groups today',            cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_16', name:'Total body campaign',   desc:'Train every major muscle group today',            cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_17', name:'Iron versatility',      desc:'Hit 4 different muscle groups today',            cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_18', name:'The complete warrior',  desc:'Log exercises from all major categories today',   cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_19', name:'Siege mentality',       desc:'Hit 4 different muscle groups today',            cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },
  { id:'var_h_20', name:'Depth and width',       desc:'Hit 4 different muscle groups today',            cat:'variety', diff:'hard', xp:150, check:{type:'muscle_groups',threshold:4} },

  // ─────── BODYWEIGHT — Easy (daily only) ───────
  { id:'bw_e_1',  name:'Check in',          desc:'Log your weight today',      cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },
  { id:'bw_e_2',  name:'Step on the scale', desc:'Log your bodyweight today',  cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },
  { id:'bw_e_3',  name:'Know the number',   desc:'Log your weight today',      cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },
  { id:'bw_e_4',  name:'Face the scale',    desc:'Log your bodyweight today',  cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },
  { id:'bw_e_5',  name:'Take stock',        desc:'Log your weight today',      cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },
  { id:'bw_e_6',  name:"Numbers don't lie", desc:'Log your bodyweight today',  cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },
  { id:'bw_e_7',  name:'Stay aware',        desc:'Log your weight today',      cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },
  { id:'bw_e_8',  name:'The honest check',  desc:'Log your bodyweight today',  cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },
  { id:'bw_e_9',  name:'Body check',        desc:'Log your current weight',    cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },
  { id:'bw_e_10', name:'Daily weigh-in',    desc:'Log your bodyweight today',  cat:'bodyweight', diff:'easy', xp:25, check:{type:'bw_logged',threshold:1} },

  // ─────── BODYWEIGHT — Medium (daily only) ───────
  { id:'bw_m_1',  name:'3-day check',          desc:'Log your weight 3 times this week',    cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:3} },
  { id:'bw_m_2',  name:'Track it',             desc:'Log your bodyweight 2 days this week', cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:2} },
  { id:'bw_m_3',  name:'Stay consistent',      desc:'Log your weight 3 days this week',     cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:3} },
  { id:'bw_m_4',  name:'Weekly average',       desc:'Log your weight 3+ times this week',   cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:3} },
  { id:'bw_m_5',  name:'Twice this week',      desc:'Log your weight 2 times this week',    cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:2} },
  { id:'bw_m_6',  name:'Body awareness',       desc:'Log your weight 2 days this week',     cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:2} },
  { id:'bw_m_7',  name:'Consistent tracking',  desc:'Log your weight 3 days this week',     cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:3} },
  { id:'bw_m_8',  name:'Body data',            desc:'Log your weight 3 times this week',    cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:3} },
  { id:'bw_m_9',  name:'Mid-week weigh-in',    desc:'Log your weight 2 days this week',     cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:2} },
  { id:'bw_m_10', name:'Know your baseline',   desc:'Log your weight 2 days in a row',      cat:'bodyweight', diff:'medium', xp:60, check:{type:'bw_days_week',threshold:2} },

  // ─────── BODYWEIGHT — Hard (daily only) ───────
  { id:'bw_h_1',  name:'Daily logger',      desc:'Log your weight every day this week',    cat:'bodyweight', diff:'hard', xp:150, check:{type:'bw_days_week',threshold:5} },
  { id:'bw_h_2',  name:'Full week track',   desc:'Log your bodyweight 5+ times this week', cat:'bodyweight', diff:'hard', xp:150, check:{type:'bw_days_week',threshold:5} },
  { id:'bw_h_3',  name:'No gaps',           desc:'Log your weight 5 days this week',       cat:'bodyweight', diff:'hard', xp:150, check:{type:'bw_days_week',threshold:5} },
  { id:'bw_h_4',  name:'7-day log',         desc:'Log your weight every day this week',    cat:'bodyweight', diff:'hard', xp:150, check:{type:'bw_days_week',threshold:7} },
  { id:'bw_h_5',  name:'Perfect tracking',  desc:'Log your weight 7 days this week',       cat:'bodyweight', diff:'hard', xp:150, check:{type:'bw_days_week',threshold:7} },

  // ─────── GOALS — Easy (daily only) ───────
  { id:'goal_e_1',  name:'Cross it off',    desc:'Complete any goal today',         cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },
  { id:'goal_e_2',  name:'One down',        desc:'Mark a goal as complete today',   cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },
  { id:'goal_e_3',  name:'Make it happen',  desc:'Complete a goal today',           cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },
  { id:'goal_e_4',  name:'Close it out',    desc:'Complete any active goal today',  cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },
  { id:'goal_e_5',  name:'Check the box',   desc:'Complete a goal today',           cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },
  { id:'goal_e_6',  name:'Get it done',     desc:'Finish any active goal today',    cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },
  { id:'goal_e_7',  name:'Follow through',  desc:'Complete a goal today',           cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },
  { id:'goal_e_8',  name:'Mark it done',    desc:'Complete any goal today',         cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },
  { id:'goal_e_9',  name:'Finish line',     desc:'Complete an active goal today',   cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },
  { id:'goal_e_10', name:'Deliver',         desc:'Complete any goal today',         cat:'goals', diff:'easy', xp:25, check:{type:'goal_done', threshold:1} },

  // ─────── GOALS — Medium (daily only) ───────
  { id:'goal_m_1',  name:'Set the stage',   desc:'Add a new goal today',                     cat:'goals', diff:'medium', xp:60, check:{type:'goal_added',threshold:1} },
  { id:'goal_m_2',  name:'Think ahead',     desc:'Add 2 new goals today',                    cat:'goals', diff:'medium', xp:60, check:{type:'goal_added',threshold:2} },
  { id:'goal_m_3',  name:'New target',      desc:'Add a new goal today',                     cat:'goals', diff:'medium', xp:60, check:{type:'goal_added',threshold:1} },
  { id:'goal_m_4',  name:'Goal setter',     desc:'Add a new goal today',                     cat:'goals', diff:'medium', xp:60, check:{type:'goal_added',threshold:1} },
  { id:'goal_m_5',  name:'Raise the bar',   desc:'Add a more ambitious goal today',          cat:'goals', diff:'medium', xp:60, check:{type:'goal_added',threshold:1} },
  { id:'goal_m_6',  name:'Map it out',      desc:'Add 2 new goals today',                    cat:'goals', diff:'medium', xp:60, check:{type:'goal_added',threshold:2} },
  { id:'goal_m_7',  name:'Future focused',  desc:"Add a goal you haven't attempted before",  cat:'goals', diff:'medium', xp:60, check:{type:'goal_added',threshold:1} },
  { id:'goal_m_8',  name:'Set your sights', desc:'Add a new goal today',                     cat:'goals', diff:'medium', xp:60, check:{type:'goal_added',threshold:1} },
  { id:'goal_m_9',  name:'Expand the list', desc:'Add 2 new goals today',                    cat:'goals', diff:'medium', xp:60, check:{type:'goal_added',threshold:2} },
  { id:'goal_m_10', name:'Plan it out',     desc:'Add a goal and complete one today',        cat:'goals', diff:'medium', xp:60, check:{type:'goal_done', threshold:1} },

  // ─────── GOALS — Hard (daily only) ───────
  { id:'goal_h_1',  name:'Clean sweep',    desc:'Complete 2 goals today',              cat:'goals', diff:'hard', xp:150, check:{type:'goal_done',threshold:2} },
  { id:'goal_h_2',  name:'Double down',    desc:'Complete 2 goals today',              cat:'goals', diff:'hard', xp:150, check:{type:'goal_done',threshold:2} },
  { id:'goal_h_3',  name:'Get after it',   desc:'Complete 2+ goals today',             cat:'goals', diff:'hard', xp:150, check:{type:'goal_done',threshold:2} },
  { id:'goal_h_4',  name:'Clear the board',desc:'Complete 2+ goals today',             cat:'goals', diff:'hard', xp:150, check:{type:'goal_done',threshold:2} },
  { id:'goal_h_5',  name:'Goal crusher',   desc:'Complete 2+ goals today',             cat:'goals', diff:'hard', xp:150, check:{type:'goal_done',threshold:2} },

  // ─────── PERFORMANCE — PR-based (daily only) ───────
  { id:'perf_e_1', name:'New record',      desc:'Beat your previous best weight on any lift today', cat:'performance', diff:'easy',   xp:25,  check:{type:'pr_today',threshold:1} },
  { id:'perf_e_2', name:'Personal best',   desc:'Log a new max weight on any lift today',           cat:'performance', diff:'easy',   xp:25,  check:{type:'pr_today',threshold:1} },
  { id:'perf_e_3', name:'Raise the bar',   desc:'Hit a personal record on any lift today',          cat:'performance', diff:'easy',   xp:25,  check:{type:'pr_today',threshold:1} },
  { id:'perf_e_4', name:'Break through',   desc:'Beat your all-time best on any lift today',        cat:'performance', diff:'easy',   xp:25,  check:{type:'pr_today',threshold:1} },
  { id:'perf_e_5', name:'Push the limit',  desc:'Set a new PR on any lift today',                   cat:'performance', diff:'easy',   xp:25,  check:{type:'pr_today',threshold:1} },
  { id:'perf_m_1', name:'PR day',          desc:'Beat your previous best weight on any lift today', cat:'performance', diff:'medium', xp:60,  check:{type:'pr_today',threshold:1} },
  { id:'perf_m_2', name:'Top yourself',    desc:'Log a new all-time high weight on any lift today', cat:'performance', diff:'medium', xp:60,  check:{type:'pr_today',threshold:1} },
  { id:'perf_m_3', name:'Shatter it',      desc:'Hit a new personal record on any lift today',      cat:'performance', diff:'medium', xp:60,  check:{type:'pr_today',threshold:1} },
  { id:'perf_h_1', name:'Iron ceiling',    desc:'Set a personal record on any lift today',          cat:'performance', diff:'hard',   xp:150, check:{type:'pr_today',threshold:1} },
  { id:'perf_h_2', name:'Untouchable',     desc:'Beat your all-time best weight on any lift today', cat:'performance', diff:'hard',   xp:150, check:{type:'pr_today',threshold:1} },

  // ─────── VARIETY — Full rotation (weekly, mgroups_week) ───────
  { id:'var_e_21', name:'Hit them all',    desc:'Train all 4 muscle groups before the week is out', cat:'variety', diff:'easy',   xp:25,  check:{type:'mgroups_week',threshold:4} },
  { id:'var_m_21', name:'Full rotation',   desc:'Hit all 4 muscle groups this week',                cat:'variety', diff:'medium', xp:60,  check:{type:'mgroups_week',threshold:4} },
  { id:'var_h_21', name:'Total coverage',  desc:'Train every muscle group at least once this week', cat:'variety', diff:'hard',   xp:150, check:{type:'mgroups_week',threshold:4} },
];

/* ============================================================
   METRICS COMPUTATION
   ============================================================ */
function igComputeStreak(sessions) {
  const today = _igLocalISO();
  const days = new Set(sessions.filter(s => !s.isRestDay && s.dateRaw).map(s => s.dateRaw));
  if (!days.has(today)) return 0;
  let count = 0, d = new Date();
  while (days.has(_igLocalISO(d))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}

function igComputeMetrics(sessions, bwEntries, goals) {
  const today     = _igLocalISO();
  const weekStart = _igWeekStart(today);

  const todaySess = sessions.filter(s => s.dateRaw === today && !s.isRestDay);
  const weekSess  = sessions.filter(s => s.dateRaw >= weekStart && s.dateRaw <= today && !s.isRestDay);

  /* ── Daily metrics ── */
  const setsToday       = todaySess.reduce((n, s) => n + (s.sets || 0), 0);
  const repsToday       = todaySess.reduce((n, s) => n + (s.sets || 0) * (s.reps || 0), 0);
  const sessionsToday   = todaySess.length > 0 ? 1 : 0;
  const exercisesToday  = new Set(todaySess.map(s => s.lift)).size;
  const mGroupsToday    = new Set(todaySess.map(s => s.cls).filter(Boolean)).size;

  const liftMap = {};
  todaySess.forEach(s => { liftMap[s.lift] = (liftMap[s.lift] || 0) + (s.sets || 0); });
  const setsLiftToday = Object.values(liftMap).length ? Math.max(...Object.values(liftMap)) : 0;

  /* ── Weekly metrics ── */
  const sessionsWeek = new Set(weekSess.map(s => s.dateRaw)).size;

  const daySetMap = {}, dayExMap = {}, dayMgMap = {}, dayRepMap = {}, dayLiftMap = {};
  weekSess.forEach(s => {
    const d = s.dateRaw;
    daySetMap[d] = (daySetMap[d] || 0) + (s.sets || 0);
    dayRepMap[d] = (dayRepMap[d] || 0) + (s.sets || 0) * (s.reps || 0);
    if (!dayExMap[d]) dayExMap[d] = new Set();
    dayExMap[d].add(s.lift);
    if (!dayMgMap[d]) dayMgMap[d] = new Set();
    if (s.cls) dayMgMap[d].add(s.cls);
    if (!dayLiftMap[d]) dayLiftMap[d] = {};
    dayLiftMap[d][s.lift] = (dayLiftMap[d][s.lift] || 0) + (s.sets || 0);
  });

  const vals = arr => arr.length ? Math.max(...arr) : 0;
  const maxSetsInDayWeek     = vals(Object.values(daySetMap));
  const maxRepsInDayWeek     = vals(Object.values(dayRepMap));
  const maxExInDayWeek       = vals(Object.values(dayExMap).map(s => s.size));
  const maxMgInDayWeek       = vals(Object.values(dayMgMap).map(s => s.size));
  const maxSetsLiftInDayWeek = vals(Object.values(dayLiftMap).map(m => vals(Object.values(m))));

  /* ── Bodyweight ── */
  const bwToday    = bwEntries.some(e => e.date === today);
  const bwDaysWeek = new Set(bwEntries.filter(e => e.date >= weekStart && e.date <= today).map(e => e.date)).size;

  /* ── PR detection — true if today's max weight on any lift beats all prior sessions ── */
  const allLiftMaxBefore = {};
  sessions.filter(s => s.dateRaw < today && !s.isRestDay && parseFloat(s.wt) > 0).forEach(s => {
    const w = parseFloat(s.wt);
    if (!allLiftMaxBefore[s.lift] || w > allLiftMaxBefore[s.lift]) allLiftMaxBefore[s.lift] = w;
  });
  const prToday = todaySess.some(s => {
    const w = parseFloat(s.wt);
    return w > 0 && allLiftMaxBefore[s.lift] && w > allLiftMaxBefore[s.lift];
  });

  /* ── Weekly muscle group variety (distinct cls values across the whole week) ── */
  const mGroupsWeek = new Set(weekSess.map(s => s.cls).filter(Boolean)).size;

  /* ── Goals ── */
  const todayMs = new Date(today + 'T00:00:00').getTime();
  const nextMs  = todayMs + 86400000;
  const goalsDoneToday  = (goals || []).filter(g => g.done && g.completedAt >= todayMs && g.completedAt < nextMs).length;
  const goalsAddedToday = (goals || []).filter(g => g.createdAt  >= todayMs && g.createdAt  < nextMs).length;

  return {
    setsToday, repsToday, sessionsToday, exercisesToday, mGroupsToday, setsLiftToday,
    sessionsWeek, maxSetsInDayWeek, maxRepsInDayWeek, maxExInDayWeek, maxMgInDayWeek, maxSetsLiftInDayWeek,
    streakDays: igComputeStreak(sessions),
    bwToday, bwDaysWeek,
    goalsDoneToday, goalsAddedToday,
    prToday, mGroupsWeek,
  };
}

function igEvalChallenge(challenge, metrics, scope) {
  const { type, threshold } = challenge.check;
  if (scope === 'daily') {
    switch (type) {
      case 'session':       return metrics.sessionsToday   >= threshold;
      case 'sets':          return metrics.setsToday       >= threshold;
      case 'sets_lift':     return metrics.setsLiftToday   >= threshold;
      case 'exercises':     return metrics.exercisesToday  >= threshold;
      case 'muscle_groups': return metrics.mGroupsToday    >= threshold;
      case 'reps':          return metrics.repsToday       >= threshold;
      case 'streak':        return metrics.streakDays      >= threshold;
      case 'sessions_week': return metrics.sessionsWeek    >= threshold;
      case 'bw_logged':     return metrics.bwToday;
      case 'bw_days_week':  return metrics.bwDaysWeek      >= threshold;
      case 'goal_done':     return metrics.goalsDoneToday  >= threshold;
      case 'goal_added':    return metrics.goalsAddedToday >= threshold;
      case 'pr_today':      return metrics.prToday;
      case 'mgroups_week':  return metrics.mGroupsWeek     >= threshold;
      default: return false;
    }
  } else {
    switch (type) {
      case 'session':       return metrics.sessionsWeek        >= 1;
      case 'sets':          return metrics.maxSetsInDayWeek    >= threshold;
      case 'sets_lift':     return metrics.maxSetsLiftInDayWeek>= threshold;
      case 'exercises':     return metrics.maxExInDayWeek      >= threshold;
      case 'muscle_groups': return metrics.maxMgInDayWeek      >= threshold;
      case 'reps':          return metrics.maxRepsInDayWeek    >= threshold;
      case 'streak':        return metrics.streakDays          >= threshold;
      case 'sessions_week': return metrics.sessionsWeek        >= threshold;
      case 'mgroups_week':  return metrics.mGroupsWeek         >= threshold;
      default: return false;
    }
  }
}

/* ============================================================
   SMART ASSIGNMENT — profile + scorer
   ============================================================ */

/* Build a profile from the last 14 days of sessions */
function igComputeRecentProfile(sessions, bwEntries) {
  const today     = _igLocalISO();
  const weekStart = _igWeekStart(today);
  const cutoff    = _igLocalISO(new Date(Date.now() - 14 * 86400000));

  const recent = (sessions || []).filter(s => !s.isRestDay && s.dateRaw >= cutoff);

  const byDay = {};
  recent.forEach(s => {
    if (!byDay[s.dateRaw]) byDay[s.dateRaw] = [];
    byDay[s.dateRaw].push(s);
  });

  const days = Object.values(byDay);
  const avg  = arr => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  const avgSets         = avg(days.map(d => d.reduce((s, x) => s + (x.sets || 0), 0)));
  const avgReps         = avg(days.map(d => d.reduce((s, x) => s + (x.sets || 0) * (x.reps || 0), 0)));
  const avgExercises    = avg(days.map(d => new Set(d.map(s => s.lift)).size));
  const avgMuscleGroups = avg(days.map(d => new Set(d.map(s => s.cls).filter(Boolean)).size));
  const avgSetsLift     = avg(days.map(d => {
    const m = {};
    d.forEach(s => { m[s.lift] = (m[s.lift] || 0) + (s.sets || 0); });
    const vals = Object.values(m);
    return vals.length ? Math.max(...vals) : 0;
  }));

  const streakDays  = igComputeStreak(sessions || []);
  const sessionsWeek = new Set(
    (sessions || []).filter(s => !s.isRestDay && s.dateRaw >= weekStart && s.dateRaw <= today)
      .map(s => s.dateRaw)
  ).size;
  const bwDaysWeek = new Set(
    (bwEntries || []).filter(e => e.date >= weekStart && e.date <= today).map(e => e.date)
  ).size;
  const bwToday = (bwEntries || []).some(e => e.date === today);

  return { avgSets, avgReps, avgExercises, avgMuscleGroups, avgSetsLift,
           streakDays, sessionsWeek, bwDaysWeek, bwToday, hasSessions: days.length > 0 };
}

/* Score how well a challenge fits this user's profile.
   Returns a number — higher = better fit. */
function _scoreChallenge(c, profile) {
  if (!profile || !profile.hasSessions) return 0.5 + Math.random() * 0.1;

  const { type, threshold } = c.check;

  /* How close is the threshold to the user's typical output?
     Sweet spot: target is 90–140% of average (challenging but reachable). */
  function proximity(actual, target) {
    if (!actual || actual <= 0) return 0.4;
    const r = target / actual;
    if (r < 0.5)             return 0.05; // they already blow past this
    if (r > 3.0)             return 0.05; // way out of reach
    if (r >= 0.9 && r <= 1.4) return 1.0; // sweet spot
    if (r >= 0.7 && r <= 2.0) return 0.55;
    return 0.25;
  }

  switch (type) {
    case 'session':       return 0.75;
    case 'sets':          return proximity(profile.avgSets,         threshold);
    case 'sets_lift':     return proximity(profile.avgSetsLift,     threshold);
    case 'exercises':     return proximity(profile.avgExercises,    threshold);
    case 'muscle_groups': return proximity(profile.avgMuscleGroups, threshold);
    case 'reps':          return proximity(profile.avgReps,         threshold);
    case 'streak': {
      const need = threshold - profile.streakDays;
      if (need <= 0)  return 0.05; // already done
      if (need === 1) return 2.0;  // one day away — perfect
      if (need === 2) return 0.6;
      return 0.1;
    }
    case 'sessions_week': {
      const need = threshold - profile.sessionsWeek;
      if (need <= 0)  return 0.05;
      if (need === 1) return 1.5;
      if (need === 2) return 0.6;
      return 0.2;
    }
    case 'bw_logged':    return profile.bwToday   ? 0.05 : 1.0;
    case 'bw_days_week': {
      const need = threshold - profile.bwDaysWeek;
      if (need <= 0)  return 0.05;
      if (need === 1) return 1.5;
      return 0.5;
    }
    case 'goal_done':
    case 'goal_added':   return 0.5;
    case 'pr_today':     return 0.5;
    case 'mgroups_week': return threshold <= 4 ? 0.6 : 0.2;
    default:             return 0.5;
  }
}

/* Pick from pool weighted by profile fit, with a small random factor
   so the same user doesn't always get the identical challenge. */
function _pickWeighted(pool, profile) {
  if (!pool.length) return null;
  const scored = pool.map(c => ({ c, w: _scoreChallenge(c, profile) + Math.random() * 0.35 }));
  scored.sort((a, b) => b.w - a.w);
  return scored[0].c;
}

function _pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ============================================================
   ASSIGNMENT
   ============================================================ */
const _CORE_CATS  = ['volume','consistency','variety'];
const _DAILY_COMBOS  = [['easy','easy','medium'],['easy','easy','hard'],['easy','medium','medium'],['easy','medium','hard']];
const _WEEKLY_COMBOS = [['easy','medium'],['easy','hard'],['medium','medium'],['medium','hard']];

function igAssignDaily(recentIds, profile) {
  const combo = _pickRandom(_DAILY_COMBOS);
  const result = [];
  const usedCats = new Set();
  const usedIds  = new Set(recentIds);

  /* 35% chance one slot becomes a bodyweight, goals, or performance challenge */
  const specialCat  = Math.random() < 0.35 ? _pickRandom(['bodyweight','goals','performance']) : null;
  let   specialUsed = false;

  combo.forEach((diff, i) => {
    const wantSpecial = specialCat && !specialUsed && i === combo.length - 1;
    const cats = wantSpecial ? [specialCat] : _CORE_CATS;

    let pool = CHALLENGE_POOL.filter(c =>
      cats.includes(c.cat) && c.diff === diff && !usedIds.has(c.id) && !usedCats.has(c.cat)
    );
    if (!pool.length) {
      pool = CHALLENGE_POOL.filter(c =>
        cats.includes(c.cat) && c.diff === diff && !usedCats.has(c.cat)
      );
    }
    if (!pool.length) return;

    const pick = _pickWeighted(pool, profile);
    result.push({ id: pick.id, completed: false, completedAt: null });
    usedIds.add(pick.id);
    usedCats.add(pick.cat);
    if (wantSpecial) specialUsed = true;
  });

  return result;
}

function igAssignWeekly(recentIds, profile) {
  const combo = _pickRandom(_WEEKLY_COMBOS);
  const result = [];
  const usedCats = new Set();
  const usedIds  = new Set(recentIds);

  combo.forEach(diff => {
    let pool = CHALLENGE_POOL.filter(c =>
      _CORE_CATS.includes(c.cat) && c.diff === diff && !usedIds.has(c.id) && !usedCats.has(c.cat)
    );
    if (!pool.length) {
      pool = CHALLENGE_POOL.filter(c =>
        _CORE_CATS.includes(c.cat) && c.diff === diff && !usedCats.has(c.cat)
      );
    }
    if (!pool.length) return;

    const pick = _pickWeighted(pool, profile);
    result.push({ id: pick.id, completed: false, completedAt: null });
    usedIds.add(pick.id);
    usedCats.add(pick.cat);
  });

  return result;
}

/* ============================================================
   FIRESTORE INIT — call once after sign-in
   Returns { dailyRef, weeklyRef, xpRef }
   ============================================================ */
async function igInitChallenges(uid, db) {
  _igUid = uid; _igDb = db;
  const today     = _igLocalISO();
  const weekStart = _igWeekStart(today);

  const challengesCol = db.collection('users').doc(uid).collection('challenges');
  const xpRef         = db.collection('users').doc(uid).collection('xp').doc('main');
  const dailyRef      = challengesCol.doc('daily_' + today);
  const weeklyRef     = challengesCol.doc('weekly_' + weekStart);

  /* Check whether we need to assign anything (avoid extra reads if docs exist) */
  const [dailySnap, weeklySnap] = await Promise.all([dailyRef.get(), weeklyRef.get()]);
  const needDaily  = !dailySnap.exists;
  const needWeekly = !weeklySnap.exists;

  /* Fetch session history + BW once only if either doc needs assignment */
  let profile = null;
  if (needDaily || needWeekly) {
    const cutoff = _igLocalISO(new Date(Date.now() - 14 * 86400000));
    const [sessSnap, bwSnap] = await Promise.all([
      db.collection('users').doc(uid).collection('sessions')
        .where('dateRaw', '>=', cutoff).get(),
      db.collection('users').doc(uid).collection('bw')
        .orderBy('date', 'desc').limit(30).get(),
    ]);
    profile = igComputeRecentProfile(
      sessSnap.docs.map(d => d.data()),
      bwSnap.docs.map(d => d.data())
    );
  }

  /* Create daily doc if it doesn't exist yet */
  if (needDaily) {
    const yesterday = _igLocalISO(new Date(Date.now() - 86400000));
    const ySnap     = await challengesCol.doc('daily_' + yesterday).get();
    const recentIds = ySnap.exists ? (ySnap.data().assigned || []).map(c => c.id) : [];
    await dailyRef.set({ date: today, scope: 'daily', assigned: igAssignDaily(recentIds, profile) });
  }

  /* Create weekly doc if it doesn't exist yet */
  if (needWeekly) {
    const lastWeek  = _igLocalISO(new Date(new Date(weekStart + 'T00:00:00').getTime() - 7 * 86400000));
    const lwSnap    = await challengesCol.doc('weekly_' + lastWeek).get();
    const recentIds = lwSnap.exists ? (lwSnap.data().assigned || []).map(c => c.id) : [];
    await weeklyRef.set({ weekStart, scope: 'weekly', assigned: igAssignWeekly(recentIds, profile) });
  }

  /* Create XP doc if missing */
  const xpSnap = await xpRef.get();
  if (!xpSnap.exists) await xpRef.set({ total: 0 });

  return { dailyRef, weeklyRef, xpRef };
}

/* ============================================================
   AUTO-CHECK — call after any data change (sessions, bw, goals)
   ============================================================ */
let _igChecking = false; // prevent overlapping runs
let _igUid = null, _igDb = null; // stored on init for reroll access

async function igCheckChallenges(uid, db, sessions, bwEntries, goals) {
  if (!uid || _igChecking) return;
  _igChecking = true;
  try {
    const today     = _igLocalISO();
    const weekStart = _igWeekStart(today);
    const metrics   = igComputeMetrics(sessions || [], bwEntries || [], goals || []);

    const challengesCol = db.collection('users').doc(uid).collection('challenges');
    const xpRef         = db.collection('users').doc(uid).collection('xp').doc('main');
    const pairs = [
      [challengesCol.doc('daily_'  + today),     'daily'],
      [challengesCol.doc('weekly_' + weekStart),  'weekly'],
    ];

    for (const [ref, scope] of pairs) {
      const snap = await ref.get();
      if (!snap.exists) continue;

      const assigned = snap.data().assigned || [];
      let xpEarned = 0, changed = false;

      const updated = assigned.map(entry => {
        if (entry.completed) return entry;
        const c = CHALLENGE_POOL.find(x => x.id === entry.id);
        if (!c) return entry;
        if (igEvalChallenge(c, metrics, scope)) {
          xpEarned += c.xp;
          changed = true;
          return { ...entry, completed: true, completedAt: Date.now() };
        }
        return entry;
      });

      if (changed) {
        await ref.update({ assigned: updated });
        if (xpEarned > 0) {
          await xpRef.set(
            { total: firebase.firestore.FieldValue.increment(xpEarned) },
            { merge: true }
          );
        }
      }
    }
  } catch (e) {
    console.error('Challenge check error:', e);
  } finally {
    _igChecking = false;
  }
}

/* ============================================================
   REROLL
   ============================================================ */
function igOpenRerollPanel() {
  const panel = document.getElementById('ig-reroll-panel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
}

async function igDoReroll() {
  if (!_igUid || !_igDb) return;
  const checked = [...document.querySelectorAll('.ig-reroll-cb:checked')].map(el => el.value);
  if (!checked.length) return;

  const btn = document.getElementById('ig-reroll-btn');
  if (btn) { btn.textContent = 'Rerolling…'; btn.disabled = true; }

  try {
    const today    = _igLocalISO();
    const dailyRef = _igDb.collection('users').doc(_igUid).collection('challenges').doc('daily_' + today);
    const snap     = await dailyRef.get();
    if (!snap.exists) return;

    const assigned = snap.data().assigned || [];
    const usedIds  = new Set(assigned.map(e => e.id));

    const updated = assigned.map(entry => {
      if (!checked.includes(entry.id) || entry.completed) return entry;
      const orig = CHALLENGE_POOL.find(c => c.id === entry.id);
      if (!orig) return entry;

      usedIds.delete(entry.id);
      let pool = CHALLENGE_POOL.filter(c =>
        _CORE_CATS.includes(c.cat) && c.diff === orig.diff && !usedIds.has(c.id)
      );
      if (!pool.length) pool = CHALLENGE_POOL.filter(c => c.diff === orig.diff && !usedIds.has(c.id));
      if (!pool.length) return entry;

      const pick = _pickWeighted(pool, null);
      usedIds.add(pick.id);
      return { id: pick.id, completed: false, completedAt: null };
    });

    await dailyRef.update({ assigned: updated, rerolled: true });
    // onSnapshot in app.js will re-render automatically
  } catch(e) {
    console.error('Reroll failed:', e);
    if (btn) { btn.textContent = 'Reroll Selected'; btn.disabled = false; }
  }
}

/* ============================================================
   UI RENDER
   ============================================================ */
function igRenderChallenges(dailyData, weeklyData, xpTotal) {
  const section = document.getElementById('challenges-section');
  if (!section) return;

  igRenderXPBar(xpTotal);

  function card(entry) {
    const c = CHALLENGE_POOL.find(x => x.id === entry.id);
    if (!c) return '';
    const diffLabel = { easy:'Easy', medium:'Medium', hard:'Hard' }[c.diff];
    const catLabel  = { volume:'Volume', consistency:'Consistency', variety:'Variety', bodyweight:'Bodyweight', goals:'Goals' }[c.cat];
    return `
      <div class="ch-card${entry.completed ? ' ch-done' : ''}">
        <div class="ch-check${entry.completed ? ' ch-check-done' : ''}">
          ${entry.completed ? '<svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1.5 5L5 8.5L11.5 1.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
        </div>
        <div class="ch-body">
          <div class="ch-meta">
            <span class="ch-badge ch-${c.diff}">${diffLabel}</span>
            <span class="ch-cat">${catLabel}</span>
          </div>
          <div class="ch-name">${c.name}</div>
          <div class="ch-desc">${c.desc}</div>
          <div class="ch-xp">+${c.xp} XP</div>
        </div>
      </div>`;
  }

  /* Countdown helpers */
  const now = new Date();
  const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const dSec = Math.max(0, Math.floor((midnight - now) / 1000));
  const dH = Math.floor(dSec / 3600), dM = Math.floor((dSec % 3600) / 60);

  const dow    = now.getDay();
  const toMon  = (8 - dow) % 7 || 7;
  const monMid = new Date(now); monMid.setDate(now.getDate() + toMon); monMid.setHours(0,0,0,0);
  const wSec   = Math.max(0, Math.floor((monMid - now) / 1000));
  const wD = Math.floor(wSec / 86400), wH = Math.floor((wSec % 86400) / 3600);

  const dailyAssigned  = dailyData?.assigned  || [];
  const weeklyAssigned = weeklyData?.assigned || [];
  const activeDaily    = dailyAssigned.filter(e => !e.completed);

  section.innerHTML = `
    <div class="eyebrow" style="margin-bottom:14px;">Challenges</div>

    <div class="ch-section-head">
      <div class="ch-section-label">
        <div class="ch-dot ch-dot-daily"></div>
        <div class="ch-section-title ch-section-title-stack"><span>Daily</span><span>Challenges</span></div>
      </div>
      <div class="ch-section-actions">
        <div class="ch-timer">resets in ${dH}h ${dM}m</div>
        ${activeDaily.length ? (dailyData?.rerolled ? `<span class="ch-reroll-used">↺ Rerolled</span>` : `<button class="ch-reroll-toggle" onclick="igOpenRerollPanel()">↺ Reroll</button>`) : ''}
      </div>
    </div>

    ${activeDaily.length ? `
    <div id="ig-reroll-panel" class="ch-reroll-panel" style="display:none;">
      <div class="ch-reroll-label">Select challenges to replace:</div>
      ${activeDaily.map(e => {
        const c = CHALLENGE_POOL.find(x => x.id === e.id);
        return c ? `<label class="ch-reroll-item">
          <input type="checkbox" class="ig-reroll-cb" value="${e.id}" checked>
          <span class="ch-reroll-text">
            <span class="ch-reroll-name">${c.name}</span>
            <span class="ch-reroll-desc">${c.desc}</span>
          </span>
        </label>` : '';
      }).join('')}
      <div class="ch-reroll-actions">
        <button id="ig-reroll-btn" class="ch-reroll-confirm" onclick="igDoReroll()">Reroll Selected</button>
        <button class="ch-reroll-cancel" onclick="igOpenRerollPanel()">Cancel</button>
      </div>
    </div>` : ''}

    ${dailyAssigned.length ? dailyAssigned.map(card).join('') : '<p class="ch-empty">No daily challenges assigned yet.</p>'}

    <div class="ch-divider"></div>

    <div class="ch-section-head">
      <div class="ch-section-label">
        <div class="ch-dot ch-dot-weekly"></div>
        <div class="ch-section-title">Weekly Challenges</div>
      </div>
      <div class="ch-timer">resets in ${wD}d ${wH}h</div>
    </div>

    ${weeklyAssigned.length ? weeklyAssigned.map(card).join('') : '<p class="ch-empty">No weekly challenges assigned yet.</p>'}
  `;
}

/* Render XP progress bar — targets #profile-xp-bar on profile.html */
function igRenderXPBar(xpTotal) {
  const el = document.getElementById('profile-xp-bar');
  if (!el) return;

  const total    = xpTotal || 0;
  const rank     = getRankFromXP(total);
  const progress = rank.nextXP
    ? Math.min(100, Math.round(((total - rank.thisXP) / (rank.nextXP - rank.thisXP)) * 100))
    : 100;
  const xpLeft   = rank.nextXP
    ? (rank.nextXP - total).toLocaleString() + ' XP until ' + rank.nextName
    : 'Maximum rank achieved';

  el.innerHTML = `
    <div class="ch-xp-card" style="margin-top:16px;padding:18px 20px 16px;background:var(--surface);border:1px solid var(--border);border-radius:14px;">
      <div class="ch-xp-row">
        <div style="display:flex;align-items:center;gap:10px;">
          ${rankHexBadge(rank.rankIndex)}
          <div class="ch-rank-name">${rank.rankName}</div>
        </div>
        <div class="ch-xp-nums">${total.toLocaleString()} / ${rank.nextXP ? rank.nextXP.toLocaleString() : '—'} XP</div>
      </div>
      <div class="ch-bar-bg"><div class="ch-bar-fill" style="width:${progress}%"></div></div>
      <div class="ch-xp-sub">${xpLeft}</div>
    </div>
  `;
}

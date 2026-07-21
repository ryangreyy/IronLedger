# IRONLEDGER — Project Explainer

*A plain-language reference for presenting and answering questions. Keep this open next to you during the demo.*

---

## The one-liner

**IRONLEDGER is a training analytics dashboard that turns weightlifting sessions into clean, trackable data.** The name is deliberate: a *ledger* records value over time, which is exactly what a training log is — so the project speaks the language of a finance audience while showing my own interests.

---

## What it's built with (in plain terms)

It's a **static website** — three core web technologies, nothing exotic:

- **HTML** — the structure (the sections, text, and tables you see).
- **CSS** — the styling (colors, fonts, layout, the dark theme).
- **JavaScript** — the logic (the calculator, the chart, the count-up numbers).

There is **no framework, database, or server.** That's an intentional choice: for a project this size it keeps things simple, fast, and impossible to "break" during a live demo. It runs in any web browser by opening one file.

*Why mention this:* it shows I matched the tool to the job instead of over-engineering it.

---

## How the project is organized

After reorganizing the original single file into a proper structure, the project looks like this:

```
fitness-tracker/
├── index.html        ← the page structure
├── styles.css        ← all the styling / theme
├── app.js            ← all the interactive logic
├── README.md         ← overview anyone can read on GitHub
├── .gitignore        ← tells Git which files to ignore
└── docs/
    └── PROJECT-EXPLAINER.md   ← this document
```

*(Exact filenames may vary slightly depending on how the reorganization ran.)*

**Why split one file into several?** The same reason you'd never keep an entire company's accounting in one cell of a spreadsheet. Separating structure, styling, and logic means I can change one part without risking the others, and anyone reading the code can find what they need fast.

---

## How it's stored and managed

- **Git** takes timestamped snapshots ("commits") of the project. Every change is saved, so there's full history and I can roll back anytime.
- **GitHub** stores those snapshots in the cloud — it's the backup, the shareable link, and the professional home for the code.

*Why it matters:* there's now a visible, dated record showing the project was built deliberately and incrementally — not thrown together at the last minute.

---

## What each feature does (and how)

**KPI dashboard cards** — Headline numbers (monthly volume, sessions, streak, estimated total). The numbers animate upward when they scroll into view; that's purely cosmetic polish.

**Progress chart** — Shows 12 weeks of estimated strength gains. It's drawn directly in code (as an SVG graphic) rather than using an outside chart library, so it works fully offline. The Squat / Bench / Deadlift toggle swaps the data and redraws it.

**1-rep-max calculator (the interactive centerpiece)** — You enter a weight and the reps you did; it estimates the most you could lift for a single rep, then builds a table of working weights for every rep range.
- The math is the **Epley formula**, a standard equation in strength training: **estimated max = weight × (1 + reps ÷ 30)**.
- *Demo move:* change a number live and let them watch the whole table update. That's the moment that proves it's functional, not a mockup.

**Training log** — A table of recent sessions. Volume (sets × reps × weight) is calculated automatically, so it can't be entered wrong.

**Strength standards** — Plots the current maxes against common benchmark tiers (Beginner → Elite) for a 180 lb lifter, with animated bars.

---

## Likely executive questions — and crisp answers

**"Is this using real data?"**
> It's realistic sample data, structured exactly how it would work with real inputs. I built it to demonstrate the system, not to pretend it's live — and the calculator runs on real math you can test right now.

**"How does the calculator actually work?"**
> It uses the Epley formula, a well-established strength-training equation: weight times one-plus-reps-over-thirty. Every working-weight figure below is a percentage of that result.

**"Why didn't you use [some big platform / framework]?"**
> For a project this size, a lightweight static site is faster to build, easier to maintain, and has zero moving parts to fail. If we needed user accounts or saved data, that's the natural next step — see the roadmap.

**"What did you learn building it?"**
> How to structure a real project, use version control with Git and GitHub, and make deliberate trade-offs between simplicity and features.

**"Can it grow into something bigger?"**
> Yes — it's organized so features can be added cleanly. See the roadmap below.

---

## Honest notes & roadmap (good to volunteer)

Saying what's *not* done yet reads as maturity, not weakness:

- **Sample data, not live entry** — the numbers are illustrative.
- **No saving between visits** — refreshing resets it (a static site has no database).

**If I took it further, the next steps would be:**
1. Let a user log their own workouts and have them persist.
2. Add accounts so multiple lifters each have private data.
3. Connect to a real database so history is stored long-term.

---

## If someone asks me to change something on the spot

I don't edit the code live in front of the room. The honest, confident answer is:
> "Great idea — I'll take that back to Claude Code, make the change, and you'll see it in the next commit." 

That's also a chance to show off the workflow: every change becomes a tracked commit on GitHub.

---

*Built as an internship project. Tech: HTML, CSS, JavaScript. Managed with Git + GitHub.*

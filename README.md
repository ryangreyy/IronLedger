# IRONLEDGER

**A training analytics dashboard that turns weightlifting sessions into clean, trackable data.**

---

## Overview

IRONLEDGER is a lightweight web dashboard for logging and analyzing strength training. It tracks volume, session streaks, and estimated strength over time, and includes an interactive one-rep-max calculator built on a standard strength-training formula.

The name is deliberate: a *ledger* records value over time — which is exactly what a training log is. The project applies a financial, data-driven lens to fitness, presenting progress as measurable metrics rather than guesswork.

Built as a finance-department internship project to demonstrate clean structure, functional interactivity, and a professional, presentation-ready interface.

---

## Features

- **Performance dashboard** — Headline metrics at a glance: monthly volume lifted, sessions completed, current streak, and estimated total.
- **Strength trend chart** — Twelve weeks of estimated one-rep-max progression, with a toggle to switch between Squat, Bench, and Deadlift. Rendered directly in code (SVG) so it works fully offline with no external libraries.
- **One-rep-max calculator** — The interactive centerpiece. Enter a weight and reps; it estimates your single-rep maximum and builds a full table of recommended working weights for every rep range. Updates live as you type.
- **Training log** — A clean record of recent sessions with volume (sets x reps x weight) calculated automatically.
- **Strength standards** — Current estimated maxes plotted against common benchmark tiers, from Beginner to Elite.

---

## Tech stack

A deliberately simple, dependency-free **static website**:

- **HTML** — structure
- **CSS** — styling and the dark, dashboard-style theme
- **JavaScript** — all interactive logic (calculator, chart, animations)

No frameworks, no build tools, no database. For a project this size, that keeps it fast, portable, and easy to maintain — and it runs in any browser by opening a single file.

---

## How to run it

No installation required.

1. Download or clone this repository.
2. Open `index.html` in any web browser (Chrome, Edge, Safari, or Firefox).

That's it. Because it's a static site, there's nothing to install or start up.

---

## Project structure

```
fitness-tracker/
├── index.html      # Page structure and content
├── styles.css      # Theme, layout, and styling
├── app.js          # Interactive logic
├── README.md       # This file
├── .gitignore      # Files Git intentionally ignores
└── docs/
    └── PROJECT-EXPLAINER.md   # Plain-language project reference
```

---

## How the calculator works

The one-rep-max estimate uses the **Epley formula**, a widely used equation in strength training:

```
estimated 1RM = weight x (1 + reps / 30)
```

Every working-weight figure in the results table is then calculated as a percentage of that estimate, mapped to typical rep ranges (for example, ~80% of max for a 5-rep set).

---

## Roadmap

Possible future enhancements, in rough order of value:

1. Let users log their own workouts and have the data persist between visits.
2. Add user accounts so multiple lifters can keep private data.
3. Connect a database for long-term history and trend analysis.

---

## Note on data

The figures shown are realistic sample data, included to demonstrate how the dashboard behaves with real inputs. The one-rep-max calculator runs on live math and can be tested with any values.

---

*Built as a finance internship project. Tech: HTML, CSS, JavaScript. Version-controlled with Git and GitHub.*

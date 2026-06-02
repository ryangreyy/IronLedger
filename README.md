# IRONLEDGER — Training Analytics Dashboard

A weightlifting training dashboard built as a static website. No installation, no server, no dependencies — open `index.html` in any browser and it works.

## What it does

- **Dashboard** — headline training metrics (volume, sessions, streak, estimated total)
- **Progress chart** — 12 weeks of estimated 1-rep max for Squat, Bench, and Deadlift
- **1RM Calculator** — enter a weight and rep count; the Epley formula estimates your max and fills a percentage table instantly
- **Training log** — recent sessions with auto-calculated volume
- **Strength standards** — animated bars showing where current maxes sit against common strength tiers

## How to open it

1. Download or clone this repository to your computer
2. Double-click `index.html` — it opens directly in your browser
3. No internet connection required (fonts fall back gracefully if offline)

## File structure

```
index.html    — page structure (the skeleton)
styles.css    — all visual design: colors, fonts, spacing
data.js       — sample workout numbers (edit this to use real data)
app.js        — interactive logic: chart, calculator, animations
```

## Tech used

| Technology | What it does here |
|---|---|
| HTML5 | Page structure and content |
| CSS3 | Layout, colors, animations, responsive design |
| Vanilla JavaScript | Chart drawing, 1RM math, scroll animations |
| Google Fonts | Anton (display), Manrope (body), JetBrains Mono (numbers) |
| SVG | The progress chart — hand-drawn, no chart library |

No frameworks. No build tools. No `npm install`. Just four text files.

## Customising the data

Open `data.js` and edit the three arrays:

- **`lifts`** — the 12 weekly 1RM estimates for the chart
- **`log`** — the training session rows in the log table
- **`standards`** — the current max and tier thresholds for each lift

Save the file and refresh the browser — changes appear immediately.

---

*Built as an internship demo. All data is illustrative.*

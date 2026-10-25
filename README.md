# DVFE Framework

A UI for scoring product ideas against a Desirability / Viability (Business Economics) /
Feasibility (Data & Tech) / Ethics (Governance & Risk) rubric, seeded from your original
`DVFE Framework.xlsx`.

## Structure

- `backend/` — Express API, file-based storage (`backend/data/framework.json` and
  `backend/data/ideas/*.json`), and the scoring engine (`backend/lib/scoring.js`).
- `frontend/` — React + Vite + Tailwind + Recharts UI.

## Running locally

```bash
# terminal 1
cd backend && npm install && npm run dev   # http://localhost:4000

# terminal 2
cd frontend && npm install && npm run dev  # http://localhost:5173
```

Open http://localhost:5173.

## How it works

- **Framework Editor** — add/edit/remove pillars and sub-criteria, their weights, rubric
  text (Red/Yellow/Green), score cutoffs, gate thresholds, and the global verdict rules.
  Edits here only affect **new** ideas — each idea snapshots the framework at creation time,
  so past evaluations stay stable even if you later tweak the rubric.
- **Ideas** — create an evaluation, score each sub-criterion (0-25 by default), and see
  pillar subtotals, gate status, the overall weighted viability score, and the strategic
  verdict update live.
- **Compare** — overlay multiple ideas' pillar scores on one radar chart.

## Scoring logic

Each pillar subtotal is the sum of its sub-criteria scores, normalized to 0-100. The overall
score is the weighted sum of normalized pillar scores. A pillar gate triggers "KILL" if its
score falls below `hardGateMin` (default 40); the Governance pillar additionally has a
"CAP AT HITL COPILOT" tier between 40-69. The final verdict combines the hard gate (minimum
pillar score), the overall score vs. `conditionalThreshold`/`goThreshold`, and whether any
pillar flagged as an "autonomy gate" clears `autonomyThreshold` — mirroring the nested-IF
logic from the original spreadsheet.

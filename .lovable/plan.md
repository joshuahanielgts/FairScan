# FairScan — UI Shell Build Plan

A complete, production-grade UI shell for **FairScan**, an AI-powered bias auditing tool. Five views, dense enterprise-dashboard aesthetic, all mock data, no API calls, no real computation.

## Stack adaptations

The project ships on **TanStack Start + Tailwind v4** (not plain CRA + Tailwind config). Two small adjustments to your spec:

- **Routing**: You asked for a single `currentView` state with no router. TanStack Start uses file-based routing. I'll keep the same UX (in-app fade transitions between steps) by storing `currentView` in a top-level state on the index route and rendering the 5 views conditionally — exactly the architecture you asked for. The audit flow lives entirely on `/`.
- **Design tokens**: Colors and fonts go into `src/styles.css` as CSS variables wired into Tailwind v4's `@theme` block (project convention), so utilities like `bg-brand`, `text-critical`, etc. work everywhere. This satisfies your "no hardcoded hex in components" rule.
- **Fonts**: DM Serif Display, DM Sans, JetBrains Mono loaded via `<link>` tags in `__root.tsx` head.

Everything else matches your spec exactly.

## Views

### 1. Landing (`landing`)
Full-screen hero, no navbar. Subtle dot-grid SVG background. Logo top-left (ShieldCheck + "FairScan"), nav links + "Start Auditing →" top-right. Centered: Gemini pill badge → 2-line DM Serif headline → muted subhead → two CTAs ("Upload a CSV" filled, "Paste model description" outlined). Below: 3 feature cards (Fairness Metrics Engine / Gemini Explanations / PDF Export) with Lucide icons in 40px tiles. Bottom stat strip with dot separators.

### 2. Upload (`upload`)
Persistent navbar with logo + 4-step indicator (Upload → Configure → Scan → Results) + "New Audit". Centered 720px column. Title + green-lock subtitle. Two tabs: **CSV Upload** (active) shows 280px dashed drop zone with UploadCloud icon + sample dataset pills (UCI Adult Income / Loan Approval / Hiring Dataset). **Model Description** shows monospace textarea + Gemini hint. Full-width "Continue →" button at bottom.

### 3. Configure (`configure`)
Title + dataset summary strip (filename · rows · columns · size in JetBrains Mono). 8-row column table (age, workclass, education, marital_status, occupation, sex, race, income) with: Column Name | Sample Values | Data Type pill | Role dropdown. Roles have colored left indicators (Sensitive=blue, Outcome=green, Ignore=gray). Auto-detected rows (age, sex, race, income) show a "⚡ Auto-detected" pill. Back + "Run Fairness Scan →" buttons.

### 4. Scanning (`scanning`)
Centered. 200px circle with spinning brand-blue arc + pulsing ShieldCheck + "73%" in JetBrains Mono. "Analyzing demographic slices..." status. 5 progress steps with check/spinner/dim states. Auto-transitions to results after 2500ms via `setTimeout`.

### 5. Results (`results`)
The flagship screen.

- **Top bar**: file metadata (mono) + New Audit / Export PDF buttons. Export shows 1500ms "Preparing report..." state.
- **Score hero card**: 3 columns
  - FairScan Score `55/100` in DM Serif 96px orange + HIGH RISK pill + horizontal bar with marker dot at 55%
  - 3 mini metric cards (Disparate Impact 0.61 Critical / Demographic Parity Gap 0.34 High / Representation Imbalance 0.41 High)
  - CSS/SVG donut chart showing 1 Critical / 3 High / 2 Medium / 1 Low + caption "7 slices flagged across 3 sensitive attributes"
- **Left column (65%)**:
  - **Flagged Bias Slices** table — 7 rows exactly as specified, severity pills with colored left border + faint tint, intersectional row prefixed with `∩`, clickable rows with brand-glow active state
  - **Fairness Visualizations** — 4 tabs (Outcome Rates / FPR-FNR / Intersectional / Representation). Outcome Rates active by default with a pure-CSS bar chart (5 bars at specified heights/colors, Y-axis 0–40%, rotated X labels, dashed "Average" line at 25%). Other tabs show styled placeholder boxes with relevant Lucide icons.
- **Right column (35%)**:
  - **Gemini Analysis** card — Brain icon header + Gemini badge + 3 expandable explanation items (item 1 expanded with full Female bias text, items 2–3 collapsed). "View all 7 explanations" link.
  - **Recommended Fixes** card — Wrench icon + 3 numbered fix cards (Resample / Remove ZIP / Threshold adjustment) with tag pills
  - **Real-World Impact** card — AlertTriangle + amber-bordered quote card with the 127-fewer-female-candidates italic text + Gemini attribution

## Interactions

- View transitions with 200ms fade
- Step indicator updates each step
- Slice row click → highlights row + scrolls/highlights matching explanation
- Chart tabs swap visible chart
- Explanation items expand/collapse with height transition
- Sample dataset pill click → drop zone shows "✓ adult_income.csv loaded — 48,842 rows" success state
- Export PDF → 1500ms disabled state, then reverts

## Design system

All in `src/styles.css` (Tailwind v4 `@theme` block):
- Colors: bg `#0C0F14`, surface `#141820`, surface-2 `#1C2230`, border `#252D3D`, border-2 `#2E3A50`, text-primary `#F0F4FF`, text-secondary `#8A97B0`, text-dim `#4A5568`, brand `#4F8EF7` (+ glow), critical/high/medium/low risk colors with glow variants
- Fonts: DM Serif Display (display), DM Sans (body/UI), JetBrains Mono (numbers/metrics)
- Cards: 1px border, rounded-xl, faint inset glow on hover
- Risk badges: pill, colored 3px left border + faint colored bg tint
- Background: subtle dot-grid SVG (white 3% opacity, 24px spacing) on landing

## File structure

```text
src/
  routes/
    __root.tsx            (add Google Fonts links)
    index.tsx             (currentView state + view switcher)
  views/
    LandingView.tsx
    UploadView.tsx
    ConfigureView.tsx
    ScanningView.tsx
    ResultsView.tsx
  components/
    Navbar.tsx
    StepIndicator.tsx
    RiskBadge.tsx
    MetricCard.tsx
    SliceTable.tsx
    ChartPlaceholder.tsx
    OutcomeRatesChart.tsx (CSS bar chart)
    RiskDonut.tsx         (inline SVG donut)
    GeminiPanel.tsx
    FixCard.tsx
    DotGridBackground.tsx
  data/
    mockData.ts           (columns, slices, explanations, fixes, metrics)
  types.ts                (Column, Slice, Severity, Explanation, Fix, ScanResult)
  styles.css              (design tokens added to @theme)
```

## Constraints honored

- No charting libraries (donut = inline SVG, bar chart = CSS divs, other charts = styled placeholders)
- No API calls, no form submissions — buttons only switch view state
- TypeScript strict, no `any`
- All colors via CSS variables / Tailwind utilities — no hex literals in components
- Lucide React for all icons
- Mock data centralized in `data/mockData.ts` for easy later replacement

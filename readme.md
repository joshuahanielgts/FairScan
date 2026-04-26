<div align="center">

<img src="public/favicon.svg" width="64" height="64" alt="FairScan Shield Logo" />

# FairScan

### AI-Powered Bias Auditing for Datasets and AI Models

[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%202.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

**[Live Demo](https://fairscan.vercel.app)** · **[Report a Bug](https://github.com/yourusername/fairscan/issues)** · **[Solution Challenge 2026](https://developers.google.com/community/gdg-campus/solution-challenge)**

---

_Built for Google Developers Solution Challenge 2026 India · Theme: Unbiased AI Decision_

</div>

---

## What is FairScan?

AI systems now decide who gets hired, who receives a loan, who gets medical care. These systems learn from historical data — and historical data is biased. FairScan makes that bias **visible, measurable, and fixable** before a model ever reaches production.

Upload a CSV dataset, mark your sensitive attributes (gender, age, race, income), and FairScan returns a scored fairness audit in under 10 seconds — powered by Gemini AI for plain-English explanations and actionable fix recommendations.

> **Zero data uploaded. All computation runs in your browser. Your data never leaves your device.**

---

## Features

### Core Audit Engine

- **5 fairness metrics** computed per demographic group: Demographic Parity, Disparate Impact Ratio, Equalized Odds Gap, Equal Opportunity Gap, and Representation Imbalance
- **Intersectional bias detection** — finds bias at the intersection of multiple attributes (e.g. Women under 30 from low-income ZIP codes)
- **FairScan Score (0–100)** — a single composite score with weighted metric normalization
- **Severity classification** — each slice rated Critical / High / Medium / Low with color-coded risk badges

### Gemini-Powered Intelligence

- **Plain-English explanations** — Gemini 2.5 Flash translates metric values into human-readable impact descriptions
- **Bias type labeling** — classifies each flagged slice as Representation, Measurement, Evaluation, Deployment, or Intersectional bias
- **Real-world impact stories** — "If deployed in hiring, this disparity would result in ~127 fewer female candidates per year"
- **3 fix recommendations per slice** — Pre-processing, post-processing, and feature engineering suggestions

### Dashboard & Visualizations

- Outcome rates bar chart by demographic group
- FPR / FNR comparison charts
- Intersectional heatmap (color-coded by disparity value)
- Representation balance chart
- One-click PDF export — consulting-grade report with charts, scores, and recommendations

### Text Mode

- Paste a model description or LLM system prompt — no CSV needed
- Gemini identifies proxy features (e.g. ZIP code → race proxy), sensitive attributes, and bias type risk map

### Privacy-First Architecture

- **No backend server** — all CSV parsing and metric computation runs in the browser
- **No file upload** — raw data never leaves the device

- Gemini receives computed metrics and column names only — never raw data

---

## Tech Stack

| Layer            | Technology                                  | Why                                                   |
| ---------------- | ------------------------------------------- | ----------------------------------------------------- |
| Frontend         | React 18 + TypeScript + Vite                | Fast, type-safe, browser-native                       |
| Styling          | Tailwind CSS                                | Utility-first, no runtime overhead                    |
| AI               | Gemini 2.5 Flash (free tier)                | Best free-tier context window; structured JSON output |
| CSV Parsing      | papaparse                                   | Fast, battle-tested, browser-native                   |
| Fairness Metrics | Custom TypeScript engine                    | No heavy ML library needed for these computations     |
| Charts           | Chart.js + Plotly.js                        | Lightweight bar charts + heatmap support              |
| PDF Export       | jsPDF + html2canvas                         | Fully client-side, no server                          |

| Hosting          | Vercel (Hobby free tier)                    | Static React build, global CDN, instant deploys       |

### What is NOT used (and why)

| Excluded                         | Reason                                                            |
| -------------------------------- | ----------------------------------------------------------------- |
| Python backend / Flask / FastAPI | No server needed — all computation is browser-side                |
| Render / Railway                 | No backend = no hosting needed beyond Vercel                      |

| aif360                           | Heavy TensorFlow dependency and version conflicts                 |
| Vercel Python functions          | 60s timeout insufficient for ML compute; not needed               |

---

## Deployment

FairScan is a **static React app**. Deployment requires:

1. **Vercel** — hosts the compiled frontend (free Hobby tier, no credit card needed)
2. **Gemini API key** — free from Google AI Studio, no billing required


That's it. No server. No database server. No paid tier needed for the hackathon.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free)


### 1. Clone the repository

```bash
git clone https://github.com/yourusername/fairscan.git
cd fairscan
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your keys:

```env
# Required — get free key at https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Required for email reporting (Server-side only) — get from resend.com/api-keys
RESEND_API_KEY=your_resend_api_key_here


```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Build for production

```bash
npm run build
```

---

## Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/fairscan)

### Manual deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework preset: **Vite**
4. Add environment variables in Vercel dashboard:
   - `VITE_GEMINI_API_KEY` → your Gemini API key

   - `RESEND_API_KEY` → your Resend API key
5. Click **Deploy**

> **Important:** Vercel Hobby tier is completely free for static sites. No credit card required. No usage limits for a React build.



---

## Project Structure

```
fairscan/
├── public/
│   ├── index.html              # Meta tags, OG tags, fonts
│   ├── favicon.svg
│   └── samples/
│       ├── adult_income.csv    # Demo: UCI Adult Income (200 rows)
│       ├── loan_approval.csv   # Demo: Loan approval dataset
│       └── hiring.csv          # Demo: Hiring dataset
├── src/
│   ├── lib/
│   │   ├── csvParser.ts        # papaparse wrapper + column analysis
│   │   ├── fairnessMetrics.ts  # All fairness metric computations
│   │   ├── geminiClient.ts     # Gemini 2.5 Flash API (3-call batch)
│   │   ├── scanOrchestrator.ts # Full scan flow with progress reporting
│   │   ├── exportReport.ts     # jsPDF report generation

│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── RiskBadge.tsx
│   │   ├── MetricCard.tsx
│   │   ├── SliceTable.tsx
│   │   ├── GeminiPanel.tsx
│   │   ├── FixCard.tsx
│   │   └── ErrorBoundary.tsx
│   ├── views/
│   │   ├── LandingView.tsx
│   │   ├── UploadView.tsx
│   │   ├── ConfigureView.tsx
│   │   ├── ScanningView.tsx
│   │   ├── ResultsView.tsx
│   │   └── TextModeResultsView.tsx
│   ├── types.ts                # All TypeScript interfaces
│   ├── App.tsx                 # View state management
│   └── main.tsx
├── .env.example
├── .env.local                  # Your keys (gitignored)
├── vite.config.ts
└── package.json
```

---

## Fairness Metrics Reference

| Metric                   | Formula                                     | Flag Threshold   |
| ------------------------ | ------------------------------------------- | ---------------- |
| Disparate Impact         | P(ŷ=1 \| GroupA) / P(ŷ=1 \| GroupB)         | < 0.80 or > 1.25 |
| Demographic Parity Gap   | \|P(ŷ=1 \| A) − P(ŷ=1 \| B)\|               | > 0.10           |
| Representation Imbalance | \|N_A − N_B\| / (N_A + N_B)                 | > 0.30           |
| Label Skew               | \|GroupPositiveRate − OverallPositiveRate\| | > 0.15           |

**FairScan Score formula:**

```
score = (disparateImpactScore × 0.40)
      + (demographicParityScore × 0.35)
      + (representationScore × 0.25)

Clamped 0–100. Worst slice drives the composite.
```

**Risk levels:** Critical (0–39) · High (40–59) · Medium (60–79) · Low (80–100)

---

## Demo Dataset

The app ships with a 200-row sample of the UCI Adult Income dataset (`public/samples/adult_income.csv`). This dataset has well-documented gender and racial income disparities — FairScan should return a score of ~50–60 (High Risk) with the following key findings:

- `sex = Female` → Disparate Impact ~0.61 (Critical)
- `race = Black` → Disparate Impact ~0.72 (High)
- `sex=Female ∩ age<25` → Intersectional Disparate Impact ~0.54 (Critical)

This makes it ideal for live demos — the bias is real, measurable, and explainable.

---

## Gemini API Usage

FairScan makes a maximum of **3 API calls per scan**, well within the free tier:

| Call | Purpose                            | Estimated tokens          |
| ---- | ---------------------------------- | ------------------------- |
| 1    | Column classification (optional)   | ~500 input / 100 output   |
| 2    | Batch bias analysis + explanations | ~2000 input / 1500 output |
| 3    | Fix recommendations                | ~1000 input / 800 output  |

**Free tier limits (Gemini 2.5 Flash):** 10 RPM · 250 RPD · 1M token context window

If you hit the rate limit, the app shows metrics and charts immediately and retries Gemini analysis automatically after 65 seconds.

---

## Evaluation Criteria Alignment

| Criterion               | Weight | How FairScan addresses it                                                                                         |
| ----------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| Technical Merit         | 40%    | Browser-side fairness engine, structured Gemini integration, TypeScript strict mode, Vercel deployment |
| Alignment with Cause    | 25%    | Directly targets "Unbiased AI Decision" — detects, quantifies, and explains algorithmic bias                      |
| Innovation & Creativity | 25%    | Privacy-first (no data upload), plain-English AI explanations, intersectional detection, composite scoring        |
| User Experience         | 10%    | Guided wizard, live progress, visual dashboard, one-click PDF export                                              |

---

## Contributing

This project was built solo for a hackathon. If you'd like to extend it:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add: your feature'`
4. Push and open a PR

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- [Google AI Studio](https://aistudio.google.com) — Gemini 2.5 Flash API
- [UCI Machine Learning Repository](https://archive.ics.uci.edu/ml/datasets/adult) — Adult Income dataset used for demos
- [fairlearn](https://fairlearn.org) — inspiration for metric definitions
- [Google Developers Solution Challenge 2026](https://developers.google.com/community/gdg-campus/solution-challenge) — the hackathon this was built for

---

<div align="center">

Built with ❤️ for Google Developers Solution Challenge 2026 India by Team Technoblade

**[fairscan.vercel.app](https://fairscan.vercel.app)**

</div>

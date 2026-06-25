# Veritas AI: Explainable Fake News Detection Platform

Veritas AI is an advanced, production-grade, portfolio-worthy web platform that detects news validity and explains the decision mechanics in simple, human-readable language. Built for college placements, hackathons, and software engineering portfolios.

---

## Key Features

1. **Multi-Input Scanning**: Analyze news via raw text entry, URL scraping, document uploads (TXT/PDF), or social media feeds.
2. **Deep NLP Pipeline**: Extracts sentiment, processes Part of Speech (POS) tags, and performs Named Entity Recognition (NER).
3. **Multi-Model Evaluator**: Trains and compares Logistic Regression, Naive Bayes, Random Forest, XGBoost, LSTM, and BERT classification scores.
4. **Explainable AI (XAI)**: Displays text highlighting for clickbait, propaganda, or extreme emotional sentiment, maps keyword feature weights, and explains the rationale in plain language.
5. **Source Credibility Index**: Rates websites based on SSL security, domain age, and verified history reputation scores.
6. **Disinformation Ticker**: Aggregates reported viral claims, social shares velocity, and verified fact-check debunk files.

---

## Directory Structure

```text
ai/
├── README.md               # Main instructions, GitHub & Resume descriptions
├── package.json            # Root configuration for concurrent services
├── database/               # Local JSON files storage (Users & Scan logs)
│   ├── users.json
│   ├── history.json
│   └── trending.json
├── docs/                   # Full system design docs
│   ├── architecture.md     # Pipeline Mermaid flows
│   ├── api.md              # REST API payloads & routes specifications
│   └── deployment.md       # Docker, Vercel, and cloud deploy checklists
├── backend/                # Express.js REST Core
│   ├── package.json
│   ├── server.js           # Express main server (helmet, rate limits, CORS)
│   ├── config/
│   │   └── db.js           # MongoDB client or file-store fallback controller
│   ├── middleware/
│   │   └── auth.js         # JWT validation route defender
│   └── routes/
│       ├── auth.js         # Registration & sign-in routines
│       ├── scan.js         # Text scanning, Python requests & fallback scanner
│       ├── analytics.js    # Statistics aggregator
│       └── trending.js     # Stories reporting portal
├── ai-service/             # Python ML Service
│   ├── requirements.txt
│   ├── app.py              # Flask server on port 8000
│   ├── model_trainer.py    # Training fits on balanced datasets
│   ├── nlp_processor.py    # Tokenization, sentiment analysis, NER & POS tags
│   └── explainable_ai.py   # Keyword contributions & XAI highlight indices
└── frontend/               # React + Vite Client
    ├── package.json
    ├── vite.config.js      # Dev server configurations & API proxy links
    ├── tailwind.config.js  # Dark glassmorphic theme colors
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx         # Routes, Auth contexts & app layout
        ├── index.css       # Tailwind directives & glass panels utility classes
        ├── components/
        │   ├── GlassCard.jsx # Generic styled card
        │   └── Navbar.jsx  # Nav items & responsive mobile drawers
        └── pages/
            ├── Dashboard.jsx # Input forms, results circles & XAI viewers
            ├── Analytics.jsx # Data distribution graphs
            ├── TrendingTracker.jsx # Flags reporter & verification index
            ├── ScanHistory.jsx # History logs & PDF report export triggers
            ├── Auth.jsx    # Sign in / Register cards
            └── Profile.jsx  # Model preference adjustments
```

---

## Setup & Execution

### Prerequisites
* **Node.js**: v18+
* **Python**: v3.9+

### Quickstart Execution

1. **Install Dependencies**:
   Open a terminal in the root project folder and execute:
   ```bash
   npm run install:all
   ```

2. **Boot up Services**:
   Run the following command to start both the Express backend and the React Vite client concurrently:
   ```bash
   npm run dev
   ```
   * *React Frontend*: runs on [http://localhost:3000](http://localhost:3000)
   * *Express Backend*: runs on [http://localhost:5000](http://localhost:5000)

3. **Start the Python AI Service (Optional)**:
   If you wish to run the machine learning classification pipelines locally:
   ```bash
   cd ai-service
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   
   pip install -r requirements.txt
   python app.py
   ```
   * *Flask AI Service*: runs on [http://localhost:8000](http://localhost:8000)
   * *Note*: If the Python service is offline, the backend automatically engages its integrated lexical classifier to keep the dashboard functional.

---

## GitHub Project Description

**Veritas AI** is a production-grade Fake News Detection platform utilizing Natural Language Processing (NLP) and Machine Learning to classify news authenticity into six categories. Features include:
* Full-stack architecture: React + Vite + Tailwind client & Express + JWT backend.
* Dual Database layout: MongoDB support with an auto-engaged local JSON database fallback.
* Dual Inference pipelines: Flask AI server (Scikit-Learn models, POS taggers, sentiment) with Node-based lexical parser fallbacks.
* Explainable AI (XAI): Interactive UI highlighting clickbait/propaganda phrases, keyword feature weight mappings, and natural language rationale.
* Comprehensive analytics dashboard displaying category frequencies and monthly metrics via Chart.js.

---

## Resume Project Write-Up

**Veritas AI – Explainable Fake News Detection Platform (Full-Stack / NLP / ML)**
* Developed a three-tier news classification engine (React, Node.js, Python Flask) categorizing articles into six labels (Real, Fake, Propaganda, Clickbait, Satire, Misleading) with sub-second response times.
* Implemented natural language preprocessing pipelines including custom rule-based POS taggers, Named Entity Recognition (NER), VADER-inspired sentiment lexicons, and TF-IDF representations mapped onto Random Forest estimators.
* Engineered Explainable AI (XAI) modules showing interactive sentence highlights (identifying clickbait hooks and emotional valence), keyword feature weights, and automated plain-English reasoning summaries.
* Built security protocols including rate limiting, Helmet-secured HTTP headers, and JSON Web Token (JWT) session management.
* Designed a dual-database storage system with Mongo Mongoose models and a transparent Node.js file-system fallback database for zero-config deployments.
* Formulated a beautiful dark-mode dashboard showcasing interactive credibility gauges, trending tickers, and scan logs exported locally as TXT reports.

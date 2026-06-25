# System Architecture - Veritas AI

Veritas AI utilizes a decoupled, three-tier service layout to guarantee sub-second prediction speeds, high security, and clean separation of concerns.

## Dataflow Pipeline

```mermaid
graph TD
    User([User Client]) -->|Interact / Submit Scan| Frontend["React Frontend (Vite)"]
    Frontend -->|API Requests| Backend["Express API Backend (Node.js)"]
    
    subgraph "Backend Tier"
        Backend -->|Query / Save Logs| LocalDB[(Local JSON DB / MongoDB)]
        Backend -->|Process JWT / Rate Limit| Security[Security Middlewares]
    end

    subgraph "Machine Learning Engine"
        Backend -->|REST Post Request| AIService["Flask AI Service (Python)"]
        AIService -->|Text Preprocessing| NLP[NLP Processor]
        AIService -->|Vectorize Text| TFIDF[TF-IDF Transformer]
        AIService -->|Model Inference| Models["Random Forest / Logistic Regression / Naive Bayes"]
        AIService -->|Feature Importances| XAI[Explainable AI Engine]
    end

    NLP --> TFIDF
    TFIDF --> Models
    Models --> XAI
    XAI -->|Structure JSON response| AIService
    AIService -->|Return Predictions & Highlighting| Backend
    Backend -->|Return Full Context Report| Frontend
```

## Architectural Decoupling

1. **Client Tier (React + Vite)**:
   * A modern, mobile-responsive glassmorphism user interface running in dark mode.
   * Compiles client-side using Vite on port 3000.
   * Integrates state charts via Chart.js for consistent rendering of model predictions.

2. **Core API Gateway (Express.js)**:
   * Operates on port 5000.
   * Manages rate limiting, Helmet header securities, and user authentication tokens (JWT).
   * Orchestrates the fallback database: uses local JSON file-system stores if MongoDB configurations are not provided.
   * Features a local Javascript lexical analyzer fallback: if the Python service fails, the API server executes a regex-based NLP evaluation, returning identical JSON structural payloads to keep the client interactive.

3. **AI Inference Service (Python + Flask)**:
   * Runs on port 8000.
   * Uses a custom rule-based `NLPProcessor` for POS tagging, Named Entity recognition, and sentiment classification.
   * Fits TF-IDF representations onto a Random Forest classifier.
   * Maps active features to explainable text indexes and returns classification statistics.

# Veritas AI API Specification

All API paths are prefixed with `/api`.

---

## Authentication Endpoints

### 1. Register User
* **Path**: `/api/auth/register`
* **Method**: `POST`
* **Access**: Public
* **Payload**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
* **Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1718701234567",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### 2. Login User
* **Path**: `/api/auth/login`
* **Method**: `POST`
* **Access**: Public
* **Payload**:
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
* **Response (200 OK)**: (Same as Register response)

---

## News Analysis Endpoints

### 3. Scan News Article
* **Path**: `/api/scan`
* **Method**: `POST`
* **Access**: Public / Private (If an `Authorization: Bearer <token>` header is present, the scan is logged to the user's history).
* **Payload**:
```json
{
  "text": "BREAKING: Scientists have verified that drinking a secret juice mixture provides complete immunity to all known viral infections...",
  "url": "https://viral-rumor-blog.com/secret-immunity-cure",
  "modelPreference": "Random Forest"
}
```
* **Response (200 OK)**:
```json
{
  "category": "Fake News",
  "authenticityScore": 14,
  "reasoning": "The article was classified as Fake News due to high frequencies of unverified sensational claims, emotional language patterns...",
  "nlpDetails": {
    "sentiment": "Negative/Sensational",
    "sentimentScore": -0.42,
    "posTags": [
      { "word": "BREAKING", "tag": "NN" }
    ],
    "entities": [
      { "name": "Scientists", "type": "PERSON" }
    ],
    "cleanTokens": ["scientist", "verifi", "drink", "secret", "juic"]
  },
  "explainableAi": {
    "highlightedPhrases": [
      { "text": "drinking a secret juice mixture provides complete immunity", "type": "clickbait" }
    ],
    "topKeywords": [
      { "word": "secret", "weight": 2.45, "impact": "Fake/Clickbait" }
    ]
  },
  "sourceCredibility": {
    "domain": "viral-rumor-blog.com",
    "trustScore": 35,
    "https": true,
    "ageYears": 4,
    "domainReputation": "Low Trust/Suspicious"
  },
  "modelComparisons": [
    { "name": "Logistic Regression", "accuracy": 89.2, "confidence": 11 },
    { "name": "Random Forest", "accuracy": 91.8, "confidence": 14 }
  ],
  "engine": "Python AI Service"
}
```

---

## Dashboard & Analytics Endpoints

### 4. Fetch History & Statistics
* **Path**: `/api/analytics`
* **Method**: `GET`
* **Access**: Private (Requires `Authorization` token header)
* **Response (200 OK)**:
```json
{
  "history": [
    {
      "id": "1718705678901",
      "textSnippet": "BREAKING: Scientists have verified that drinking a secret juice...",
      "url": "https://viral-rumor-blog.com/secret-immunity-cure",
      "category": "Fake News",
      "authenticityScore": 14,
      "engineUsed": "Python AI Service",
      "timestamp": "2026-06-18T14:10:00.000Z"
    }
  ],
  "summary": {
    "totalScans": 1,
    "realCount": 0,
    "fakeCount": 1,
    "realFakeRatio": [
      { "name": "Authentic", "value": 0 },
      { "name": "Manipulated/Fake", "value": 1 }
    ],
    "categoryDistribution": [
      { "name": "Real News", "value": 0 },
      { "name": "Fake News", "value": 1 }
    ],
    "monthlyTrends": [
      { "month": "Jun", "scans": 1, "averageAuthenticity": 14 }
    ]
  }
}
```

### 5. Report Viral News Story
* **Path**: `/api/trending/report`
* **Method**: `POST`
* **Access**: Public
* **Payload**:
```json
{
  "title": "New alignment of planets reverses global warming",
  "category": "Propaganda",
  "url": "http://planetary-agenda-blog.net"
}
```
* **Response (200 OK)**: Returns the updated list of all trending stories.

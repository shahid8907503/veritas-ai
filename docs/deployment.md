# Deployment Guide

This guide details steps for deploying the Veritas AI full-stack application to production.

---

## 1. Local Containerized Execution (Docker Compose)

Create a `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  ai-service:
    build: ./ai-service
    ports:
      - "8000:8000"
    environment:
      - PORT=8000

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - JWT_SECRET=production_secret_key_98765
      - MONGODB_URI=mongodb://mongodb:27017/veritas_ai
    depends_on:
      - mongodb
      - ai-service

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

---

## 2. Cloud Platform Deployments

### Frontend (Vercel / Netlify)
1. Navigate to the `frontend/` directory.
2. Initialize build settings:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
3. Configure environment variable routes. Create a `vercel.json` rewrite file to proxy `/api` calls to the Node.js production server:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-node-backend.render.com/api/:path*"
    }
  ]
}
```

### Core API Server (Render / Railway)
1. Link your GitHub repository to Render.
2. Create a new **Web Service**:
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Root Directory**: `backend`
3. Configure Environment Variables:
   * `JWT_SECRET`: A secure random cryptographic string.
   * `MONGODB_URI`: Connection string to MongoDB Atlas.
   * `NODE_ENV`: `production`

### Python AI Service (Render / Python Engine)
1. Link your GitHub repository.
2. Create a new **Web Service**:
   * **Runtime**: Python 3.x
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   * **Root Directory**: `ai-service`
3. Save service URL to the backend configurations (if updating the backend's `queryPythonService` host).

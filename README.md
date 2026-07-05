# ProntoCurriculum — Setup su Google Cloud

## Prerequisiti
- Node.js 20+ installato
- Account Google con un progetto Firebase
- Account Neon (https://neon.tech) per il database PostgreSQL
- Chiave API Google Gemini (https://aistudio.google.com/apikey)

---

## 1. Configura Firebase

### a) Crea un progetto Firebase
1. Vai su https://console.firebase.google.com
2. Crea un nuovo progetto (es. `prontocurriculum`)
3. Abilita **Authentication** → Sign-in method → **Google** (attiva)

### b) Ottieni le credenziali web
1. Console Firebase → ⚙️ Impostazioni progetto → Le tue app → Aggiungi app web
2. Copia i valori `firebaseConfig` — ti servono per le variabili `VITE_FIREBASE_*`

### c) Ottieni le credenziali Admin SDK
1. Console Firebase → ⚙️ Impostazioni progetto → Account di servizio
2. Clicca **"Genera nuova chiave privata"** → scarica il JSON
3. Questo JSON va nell'env var `FIREBASE_SERVICE_ACCOUNT_JSON` (come stringa su una riga)

---

## 2. Configura Neon PostgreSQL

1. Vai su https://neon.tech → crea un account gratuito
2. Crea un nuovo progetto (es. `prontocurriculum`)
3. Copia la **connection string** (formato: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. Mettila in `DATABASE_URL`

---

## 3. Ottieni la chiave Gemini

1. Vai su https://aistudio.google.com/apikey
2. Crea una nuova API key
3. Mettila in `GEMINI_API_KEY`

---

## 4. Configura le variabili d'ambiente

### Frontend — copia `.env.example` in `.env.local`:
```bash
cp .env.example artifacts/pronto-curriculum/.env.local
# poi edita con i tuoi valori VITE_FIREBASE_*
```

### Backend — copia `.env.example` in `artifacts/api-server/.env`:
```bash
cp .env.example artifacts/api-server/.env
# poi edita con DATABASE_URL, GEMINI_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON
```

---

## 5. Avvio locale (sviluppo)

```bash
# Installa le dipendenze
pnpm install

# Avvia backend (porta 5000)
pnpm --filter @workspace/api-server dev

# Avvia frontend (porta 5173) — in un altro terminale
pnpm --filter @workspace/pronto-curriculum dev
```

L'app sarà su http://localhost:5173 (il frontend fa proxy verso il backend automaticamente).

---

## 6. Deploy su Google Cloud

### Frontend — Firebase Hosting
```bash
# Installa Firebase CLI
npm install -g firebase-tools
firebase login

# Build frontend
pnpm --filter @workspace/pronto-curriculum build

# Deploy
firebase deploy --only hosting
```

### Backend — Cloud Run
```bash
# Build immagine Docker
docker build -f artifacts/api-server/Dockerfile -t prontocurriculum-api .

# Tag e push su Google Container Registry
docker tag prontocurriculum-api gcr.io/YOUR_PROJECT_ID/prontocurriculum-api
docker push gcr.io/YOUR_PROJECT_ID/prontocurriculum-api

# Deploy su Cloud Run
gcloud run deploy prontocurriculum-api \
  --image gcr.io/YOUR_PROJECT_ID/prontocurriculum-api \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="...",GEMINI_API_KEY="...",FIREBASE_PROJECT_ID="..."
```

---

## Architettura

```
Browser
  └── Firebase Hosting (frontend React + Vite)
        ├── /* → index.html (SPA)
        └── /api/* → Cloud Run (backend Express)
                ├── /api/auth/sync     ← Firebase token verification
                ├── /api/optimize-cv   ← Gemini AI
                ├── /api/tailor-cv     ← Gemini AI
                ├── /api/translate-cv  ← Gemini AI
                └── /api/parse-cv      ← Gemini AI
                        └── Neon PostgreSQL (users, sessions, CVs)
```

---

## Stack tecnologico

| Layer | Tecnologia | Note |
|---|---|---|
| Frontend | React + Vite + TailwindCSS | Hosted su Firebase Hosting |
| Backend | Express 5 + Node.js 22 | Deploy su Cloud Run |
| Database | PostgreSQL (Neon) | Serverless, free tier 0.5GB |
| Auth | Firebase Authentication | Google Sign-In |
| AI | Google Gemini 2.0 Flash | Free tier: 15 req/min, 1M token/giorno |
| PDF | jsPDF + html2pdf.js | Client-side, nessun costo server |

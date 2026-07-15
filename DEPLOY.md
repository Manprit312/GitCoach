# GitCoach — Deploy & GitHub OAuth Guide

Step-by-step setup for **Railway (API)** + **Vercel (frontend)** + **GitHub OAuth**.

Estimated time: **30–45 minutes**.

---

## Architecture

```text
User → https://gitcoach.vercel.app (Vercel)
         ├── /           → Angular app
         └── /api/*      → proxied to Railway Express API
```

Using Vercel as a proxy keeps cookies and OAuth on one domain.

---

## Part 1 — Deploy the API (Railway)

### 1. Push code to GitHub

Create a **public repo** for hackathon submission and push this project.

### 2. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select **Manprit312/GitCoach**
3. **Important:** open the service → **Settings** → **Root Directory** → set to `server` → **Save**
   - If you skip this, Railway builds the whole repo and fails with `ng: not found`
4. **Settings → Deploy** → confirm **Start Command** is `npm start`
5. **Variables** → add:

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI key |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `SESSION_SECRET` | Random 32+ char string |
| `NODE_ENV` | `production` |
| `GITHUB_TOKEN` | (optional) Personal access token |
| `CLIENT_URL` | `https://YOUR-APP.vercel.app` *(set after Vercel deploy)* |
| `GITHUB_CLIENT_ID` | *(after Part 3)* |
| `GITHUB_CLIENT_SECRET` | *(after Part 3)* |
| `GITHUB_CALLBACK_URL` | `https://YOUR-APP.vercel.app/api/auth/github/callback` |

5. **Settings → Networking** → **Generate Domain**
6. Copy your Railway URL, e.g. `https://gitcoach-api-production.up.railway.app`
7. Test: open `https://YOUR-RAILWAY-URL/api/health` — should return `{"ok":true,...}`

---

## Part 2 — Deploy the frontend (Vercel)

### 1. Link Vercel proxy to Railway

From your machine (replace with your Railway URL):

```bash
RAILWAY_PUBLIC_URL=https://gitcoach-api-production.up.railway.app node scripts/write-vercel-config.mjs
```

Commit the updated `web/vercel.json` (or re-run the script before each deploy).

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import **Manprit312/GitCoach**
2. **Root Directory** → `web`
3. Framework: **Other** (Vercel reads `vercel.json`)
4. Deploy

### 3. Update Railway `CLIENT_URL`

After Vercel gives you a URL (e.g. `https://gitcoach.vercel.app`):

1. Railway → Variables → set `CLIENT_URL=https://gitcoach.vercel.app`
2. Redeploy Railway (or wait for auto-redeploy)

### 4. Smoke test

1. Open `https://gitcoach.vercel.app`
2. Go to **Mission**
3. Enter `vercel/next.js` → pick an issue → wait for AI plan

If analysis fails, check Railway logs for missing `OPENAI_API_KEY`.

---

## Part 3 — GitHub OAuth setup

OAuth is **optional** — public repos work without login. Add it for a stronger demo.

### 1. Create a GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. **OAuth Apps** → **New OAuth App**
3. Fill in:

| Field | Value |
|---|---|
| Application name | `GitCoach` |
| Homepage URL | `https://YOUR-APP.vercel.app` |
| Authorization callback URL | `https://YOUR-APP.vercel.app/api/auth/github/callback` |

4. Click **Register application**
5. Copy **Client ID**
6. **Generate a new client secret** → copy it

### 2. Add to Railway variables

| Variable | Value |
|---|---|
| `GITHUB_CLIENT_ID` | From step 5 |
| `GITHUB_CLIENT_SECRET` | From step 6 |
| `GITHUB_CALLBACK_URL` | `https://YOUR-APP.vercel.app/api/auth/github/callback` |

Redeploy Railway.

### 3. Test OAuth

1. Open `https://YOUR-APP.vercel.app/coach`
2. Click **Connect GitHub**
3. Authorize → you should return with your avatar shown

---

## Part 4 — GitHub token (rate limits)

Without a token, GitHub allows ~60 requests/hour per IP. With a token, ~5000/hour.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
3. Scope: `public_repo` (read public repos)
4. Add to Railway as `GITHUB_TOKEN`

---

## Part 5 — Hackathon submission

Submit by **July 19, 11:59 PM IST**:

| Item | Your link |
|---|---|
| Hosted URL | `https://YOUR-APP.vercel.app` |
| Public repo | `https://github.com/Manprit312/GitCoach` |
| Demo video | 3 min — problem → pick issue → plan → PR draft |
| Pitch deck | Optional, 5–7 slides |

### Demo script (3 minutes)

1. **0:00–0:30** — Problem: juniors want OSS contributions but get lost in codebases
2. **0:30–1:00** — Paste repo, pick issue
3. **1:00–2:00** — Show AI explanation, file map, step-by-step plan
4. **2:00–2:30** — Show PR draft + coach chat
5. **2:30–3:00** — "Built with OpenAI Codex, powered by OpenAI API"

---

## Troubleshooting

| Problem | Fix |
|---|---|
| CORS error | `CLIENT_URL` on Railway must exactly match your Vercel URL (no trailing slash) |
| OAuth redirect fails | Callback URL in GitHub app must match `GITHUB_CALLBACK_URL` exactly |
| `Analysis failed` | Check `OPENAI_API_KEY` on Railway |
| GitHub rate limit | Add `GITHUB_TOKEN` |
| `/api` 404 on Vercel | Re-run `write-vercel-config.mjs` with correct Railway URL |
| Cookie/login not sticking | Use Vercel proxy (same domain) — don't split API to a different domain without `sameSite: none` |

---

## Local development (reference)

```bash
# Terminal 1
cd server && cp .env.example .env  # add OPENAI_API_KEY
npm run dev

# Terminal 2
cd web && npm start
```

Open http://localhost:4200

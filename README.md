# GitCoach

**AI mentor for your first open source pull request.**

Built for the [OpenAI × NamasteDev Codex Hackathon](https://namastedev.com/hackathon) (July 15–19, 2026).

GitCoach helps developers go from *"I found a GitHub issue"* to *"I understand the codebase and I'm ready to open a PR"* — without getting lost in hundreds of files.

## What it does

1. **Pick a repo & issue** — paste any public GitHub URL or connect GitHub OAuth
2. **Understand the code** — AI reads the repo and explains only files relevant to your issue
3. **Follow a plan** — step-by-step checklist with difficulty estimate
4. **Ship a PR** — copy a professional PR title & description
5. **Ask your coach** — chat while you implement

## Built with

- **OpenAI Codex** — used to scaffold and build this project
- **OpenAI API** — powers repo analysis, mission plans, and coaching chat
- **Angular 20** — standalone components, signals, native control flow
- **Node.js + Express** — GitHub API integration, OAuth, AI orchestration

## Quick start

### 1. Install dependencies

```bash
npm run install:all
```

From the repo root (`GitCoach/`).

### 2. Configure environment

Copy `server/.env.example` to `server/.env` and add your keys:

```bash
cp server/.env.example server/.env
```

**Required:**
- `OPENAI_API_KEY` — your OpenAI API key

**Optional (recommended):**
- `GITHUB_TOKEN` — increases GitHub API rate limits for public repos
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — enables "Connect GitHub" login

### 3. Run locally

Terminal 1 — API server:

```bash
npm run dev:server
```

Terminal 2 — Angular app:

```bash
npm run dev:web
```

Open [http://localhost:4200](http://localhost:4200)

## Demo flow (for judges)

1. Go to **Mission**
2. Enter a public repo (e.g. `vercel/next.js`)
3. Pick an open issue
4. Wait for AI analysis → see plan + PR draft
5. Ask a follow-up question in the coach chat

## Deploy for hackathon

See **[DEPLOY.md](./DEPLOY.md)** for:

- Railway API deployment
- Vercel frontend deployment
- GitHub OAuth app setup
- Submission checklist

## Project structure

```
gitcoach/
├── server/     # Express API — GitHub + OpenAI
└── web/        # Angular frontend
```

## License

MIT — hackathon submission

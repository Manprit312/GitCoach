import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config, isClientOriginAllowed } from './config.js';
import { createAuthRouter } from './routes/auth.js';
import { createCoachRouter } from './routes/coach.js';
import { createReposRouter } from './routes/repos.js';
import type { SessionData } from './types.js';

const sessions = new Map<string, SessionData>();
const app = express();

app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (isClientOriginAllowed(origin)) {
        callback(null, origin);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser(config.sessionSecret));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'gitcoach',
    openaiConfigured: Boolean(config.openai.apiKey),
    githubOAuthConfigured: Boolean(config.github.clientId && config.github.clientSecret),
  });
});

app.get('/', (_req, res) => {
  res.json({ service: 'gitcoach-api', health: '/api/health' });
});

app.use('/api/auth', createAuthRouter(sessions));
app.use('/api/repos', createReposRouter(sessions));
app.use('/api/coach', createCoachRouter(sessions));

app.listen(config.port, () => {
  console.log(`GitCoach API running on port ${config.port}`);
  console.log(`Allowed client origins: ${config.clientUrls.join(', ')}`);
});

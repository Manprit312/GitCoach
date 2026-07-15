import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { config, isGitHubOAuthConfigured } from '../config.js';
import {
  buildGitHubAuthorizeUrl,
  exchangeGitHubCode,
  getGitHubUser,
} from '../services/github.js';
import type { SessionData } from '../types.js';

const oauthStates = new Set<string>();

export function createAuthRouter(sessions: Map<string, SessionData>): Router {
  const router = Router();

  router.get('/status', (_req, res) => {
    res.json({ oauthConfigured: isGitHubOAuthConfigured() });
  });

  router.get('/me', (req, res) => {
    const sessionId = req.cookies?.gitcoach_session as string | undefined;
    const session = sessionId ? sessions.get(sessionId) : undefined;
    res.json({ user: session?.user ?? null });
  });

  router.get('/github', (_req, res) => {
    if (!isGitHubOAuthConfigured()) {
      res.status(503).json({ error: 'GitHub OAuth is not configured on the server.' });
      return;
    }

    const state = uuid();
    oauthStates.add(state);
    res.redirect(buildGitHubAuthorizeUrl(state));
  });

  router.get('/github/callback', async (req, res) => {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;

    if (!code || !state || !oauthStates.has(state)) {
      res.redirect(`${config.clientUrl}/coach?auth=failed`);
      return;
    }

    oauthStates.delete(state);

    try {
      const accessToken = await exchangeGitHubCode(code);
      const user = await getGitHubUser(accessToken);
      const sessionId = uuid();
      sessions.set(sessionId, { accessToken, user });

      res.cookie('gitcoach_session', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(`${config.clientUrl}/coach?auth=success`);
    } catch {
      res.redirect(`${config.clientUrl}/coach?auth=failed`);
    }
  });

  router.post('/logout', (req, res) => {
    const sessionId = req.cookies?.gitcoach_session as string | undefined;
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.clearCookie('gitcoach_session');
    res.json({ ok: true });
  });

  return router;
}

export function getSessionToken(
  sessions: Map<string, SessionData>,
  sessionId: string | undefined,
): string | undefined {
  if (!sessionId) return undefined;
  return sessions.get(sessionId)?.accessToken;
}

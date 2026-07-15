import { Router } from 'express';
import { analyzeContribution, chatWithCoach } from '../services/openai.js';
import { getSessionToken } from './auth.js';
import type { SessionData } from '../types.js';

export function createCoachRouter(sessions: Map<string, SessionData>): Router {
  const router = Router();

  router.post('/analyze', async (req, res) => {
    const owner = String(req.body?.owner ?? '');
    const repo = String(req.body?.repo ?? '');
    const issueNumber = Number(req.body?.issueNumber);

    if (!owner || !repo || !Number.isFinite(issueNumber)) {
      res.status(400).json({ error: 'owner, repo, and issueNumber are required.' });
      return;
    }

    try {
      const token = getSessionToken(
        sessions,
        req.cookies?.gitcoach_session as string | undefined,
      );
      const analysis = await analyzeContribution(owner, repo, issueNumber, token);
      res.json(analysis);
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
    }
  });

  router.post('/chat', async (req, res) => {
    const owner = String(req.body?.owner ?? '');
    const repo = String(req.body?.repo ?? '');
    const issueNumber = Number(req.body?.issueNumber);
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const analysisSummary =
      typeof req.body?.analysisSummary === 'string' ? req.body.analysisSummary : undefined;

    if (!owner || !repo || !Number.isFinite(issueNumber) || messages.length === 0) {
      res.status(400).json({ error: 'Invalid chat request.' });
      return;
    }

    try {
      const token = getSessionToken(
        sessions,
        req.cookies?.gitcoach_session as string | undefined,
      );
      const reply = await chatWithCoach(
        owner,
        repo,
        issueNumber,
        messages,
        analysisSummary,
        token,
      );
      res.json({ reply });
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Chat failed',
      });
    }
  });

  return router;
}

import { Router } from 'express';
import {
  getIssue,
  listIssues,
  parseRepoInput,
} from '../services/github.js';
import { getSessionToken } from './auth.js';
import type { SessionData } from '../types.js';

export function createReposRouter(sessions: Map<string, SessionData>): Router {
  const router = Router();

  router.post('/parse', (req, res) => {
    try {
      const repo = parseRepoInput(String(req.body?.input ?? ''));
      res.json(repo);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Invalid repository',
      });
    }
  });

  router.get('/:owner/:repo/issues', async (req, res) => {
    try {
      const token = getSessionToken(
        sessions,
        req.cookies?.gitcoach_session as string | undefined,
      );
      const label = typeof req.query.label === 'string' ? req.query.label : undefined;
      const issues = await listIssues(
        req.params.owner,
        req.params.repo,
        token,
        label,
      );
      res.json(
        issues.filter((issue) => !issue.labels.some((l) => l.name === 'pull_request')),
      );
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Failed to load issues',
      });
    }
  });

  router.get('/:owner/:repo/issues/:number', async (req, res) => {
    try {
      const token = getSessionToken(
        sessions,
        req.cookies?.gitcoach_session as string | undefined,
      );
      const issue = await getIssue(
        req.params.owner,
        req.params.repo,
        Number(req.params.number),
        token,
      );
      res.json(issue);
    } catch (error) {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'Failed to load issue',
      });
    }
  });

  return router;
}

import { config } from '../config.js';
import type { GitHubIssue, GitHubUser, RepoRef } from '../types.js';

const GITHUB_API = 'https://api.github.com';

function authHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GitCoach-Hackathon',
  };

  const resolved = token || config.github.token;
  if (resolved) {
    headers.Authorization = `Bearer ${resolved}`;
  }

  return headers;
}

async function githubFetch<T>(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json() as Promise<T>;
}

export function parseRepoInput(input: string): RepoRef {
  const trimmed = input.trim().replace(/\.git$/, '');

  const sshMatch = trimmed.match(/git@github\.com:([^/]+)\/([^/]+)/i);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && url.hostname.includes('github.com')) {
      return { owner: parts[0], repo: parts[1] };
    }
  } catch {
    // fall through
  }

  const slashMatch = trimmed.match(/^([^/]+)\/([^/]+)$/);
  if (slashMatch) {
    return { owner: slashMatch[1], repo: slashMatch[2] };
  }

  throw new Error('Invalid repository URL. Use owner/repo or a GitHub URL.');
}

export async function getGitHubUser(token: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>('/user', token);
}

export async function listIssues(
  owner: string,
  repo: string,
  token?: string,
  label?: string,
): Promise<GitHubIssue[]> {
  const params = new URLSearchParams({
    state: 'open',
    per_page: '20',
    sort: 'created',
    direction: 'desc',
  });
  if (label) {
    params.set('labels', label);
  }

  return githubFetch<GitHubIssue[]>(
    `/repos/${owner}/${repo}/issues?${params}`,
    token,
  );
}

export async function getIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  token?: string,
): Promise<GitHubIssue> {
  return githubFetch<GitHubIssue>(
    `/repos/${owner}/${repo}/issues/${issueNumber}`,
    token,
  );
}

export async function getReadme(
  owner: string,
  repo: string,
  token?: string,
): Promise<string> {
  try {
    const data = await githubFetch<{ content: string; encoding: string }>(
      `/repos/${owner}/${repo}/readme`,
      token,
    );
    return Buffer.from(data.content, 'base64').toString('utf8').slice(0, 4000);
  } catch {
    return '';
  }
}

interface TreeItem {
  path: string;
  type: string;
  size?: number;
}

export async function getRepoTree(
  owner: string,
  repo: string,
  token?: string,
): Promise<TreeItem[]> {
  const repoMeta = await githubFetch<{ default_branch: string }>(
    `/repos/${owner}/${repo}`,
    token,
  );

  const tree = await githubFetch<{ tree: TreeItem[] }>(
    `/repos/${owner}/${repo}/git/trees/${repoMeta.default_branch}?recursive=1`,
    token,
  );

  return tree.tree.filter(
    (item) =>
      item.type === 'blob' &&
      (item.size ?? 0) < 80_000 &&
      !item.path.includes('node_modules/') &&
      !item.path.includes('dist/') &&
      !item.path.includes('.lock') &&
      !item.path.endsWith('.png') &&
      !item.path.endsWith('.jpg') &&
      !item.path.endsWith('.svg'),
  );
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string,
): Promise<string> {
  const data = await githubFetch<{ content: string; encoding: string }>(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
    token,
  );
  return Buffer.from(data.content, 'base64').toString('utf8').slice(0, 8000);
}

function scoreFile(path: string, issueText: string): number {
  const lowerPath = path.toLowerCase();
  const lowerIssue = issueText.toLowerCase();
  let score = 0;

  const segments = lowerPath.split(/[/._-]/);
  for (const segment of segments) {
    if (segment.length > 3 && lowerIssue.includes(segment)) {
      score += 4;
    }
  }

  if (lowerPath.includes('test')) score += 1;
  if (lowerPath.includes('readme')) score += 1;
  if (/\.(ts|tsx|js|jsx|py|go|rs|java|md)$/.test(lowerPath)) score += 2;

  return score;
}

export async function collectContextFiles(
  owner: string,
  repo: string,
  issue: GitHubIssue,
  token?: string,
): Promise<Array<{ path: string; content: string }>> {
  const issueText = `${issue.title}\n${issue.body ?? ''}`;
  const tree = await getRepoTree(owner, repo, token);

  const ranked = tree
    .map((item) => ({ path: item.path, score: scoreFile(item.path, issueText) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const fallback = tree
    .filter((item) =>
      /^(README|src\/|lib\/|app\/|packages\/)/i.test(item.path),
    )
    .slice(0, 5)
    .map((item) => ({ path: item.path, score: 0 }));

  const selectedPaths = [...new Map(
    [...ranked, ...fallback].map((item) => [item.path, item]),
  ).values()].slice(0, 8);

  const files: Array<{ path: string; content: string }> = [];
  for (const item of selectedPaths) {
    try {
      const content = await getFileContent(owner, repo, item.path, token);
      files.push({ path: item.path, content });
    } catch {
      // skip unreadable files
    }
  }

  return files;
}

export function buildGitHubAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: 'read:user repo',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeGitHubCode(code: string): Promise<string> {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.github.clientId,
      client_secret: config.github.clientSecret,
      code,
      redirect_uri: config.github.callbackUrl,
    }),
  });

  const data = (await response.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    throw new Error(data.error ?? 'Failed to exchange GitHub OAuth code');
  }

  return data.access_token;
}

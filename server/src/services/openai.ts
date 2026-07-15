import OpenAI from 'openai';
import { assertOpenAiConfigured, config } from '../config.js';
import { collectContextFiles, getIssue, getReadme } from './github.js';
import type { ChatMessage, CoachAnalysis } from '../types.js';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  assertOpenAiConfigured();
  if (!client) {
    client = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return client;
}

const analysisSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    issueContext: { type: 'string' },
    relevantFiles: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          path: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['path', 'explanation'],
      },
    },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          order: { type: 'number' },
          title: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['order', 'title', 'description'],
      },
    },
    prDraft: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['title', 'body'],
    },
    difficulty: {
      type: 'string',
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    estimatedMinutes: { type: 'number' },
    tips: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: [
    'summary',
    'issueContext',
    'relevantFiles',
    'steps',
    'prDraft',
    'difficulty',
    'estimatedMinutes',
    'tips',
  ],
} as const;

export async function analyzeContribution(
  owner: string,
  repo: string,
  issueNumber: number,
  token?: string,
): Promise<CoachAnalysis> {
  const issue = await getIssue(owner, repo, issueNumber, token);
  const readme = await getReadme(owner, repo, token);
  const files = await collectContextFiles(owner, repo, issue, token);

  const fileContext = files
    .map((file) => `### ${file.path}\n\`\`\`\n${file.content}\n\`\`\``)
    .join('\n\n');

  const prompt = `You are GitCoach, an AI mentor helping developers make their first meaningful open-source contribution.

Repository: ${owner}/${repo}
Issue #${issue.number}: ${issue.title}
Issue URL: ${issue.html_url}

Issue description:
${issue.body ?? '(no description)'}

README excerpt:
${readme || '(no readme)'}

Relevant source files:
${fileContext || '(no files fetched)'}

Create a beginner-friendly contribution guide. Do NOT dump full solution code. Focus on understanding, a clear plan, and a professional PR draft.
Explain only files that matter for this issue. Steps should be actionable and ordered. PR body should follow open-source best practices (what/why/how to test).`;

  const response = await getClient().chat.completions.create({
    model: config.openai.model,
    temperature: 0.3,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'coach_analysis',
        strict: true,
        schema: analysisSchema,
      },
    },
    messages: [
      {
        role: 'system',
        content:
          'You help developers contribute to open source with clarity and confidence. Be concise, practical, and encouraging.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty analysis');
  }

  return JSON.parse(content) as CoachAnalysis;
}

export async function chatWithCoach(
  owner: string,
  repo: string,
  issueNumber: number,
  messages: ChatMessage[],
  analysisSummary: string | undefined,
  token?: string,
): Promise<string> {
  const issue = await getIssue(owner, repo, issueNumber, token);
  const files = await collectContextFiles(owner, repo, issue, token).then((items) =>
    items.slice(0, 4),
  );

  const fileContext = files
    .map((file) => `### ${file.path}\n\`\`\`\n${file.content.slice(0, 3000)}\n\`\`\``)
    .join('\n\n');

  const system = `You are GitCoach, a patient open-source mentor for ${owner}/${repo}, issue #${issue.number}.
Guide the developer with hints and explanations. Avoid dumping complete copy-paste solutions unless they explicitly ask for a small snippet.
Context summary: ${analysisSummary ?? 'No prior analysis'}
Issue: ${issue.title}
Files:
${fileContext}`;

  const response = await getClient().chat.completions.create({
    model: config.openai.model,
    temperature: 0.4,
    messages: [{ role: 'system', content: system }, ...messages],
  });

  return response.choices[0]?.message?.content ?? 'I could not generate a response.';
}

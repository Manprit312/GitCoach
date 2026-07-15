import 'dotenv/config';

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseClientUrls(raw: string | undefined): string[] {
  const value = raw ?? 'http://localhost:4200';
  return value.split(',').map((url) => url.trim()).filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  clientUrls: parseClientUrls(process.env.CLIENT_URL),
  clientUrl: parseClientUrls(process.env.CLIENT_URL)[0] ?? 'http://localhost:4200',
  sessionSecret: process.env.SESSION_SECRET ?? 'gitcoach-dev-secret',
  isProduction: process.env.NODE_ENV === 'production',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GITHUB_CALLBACK_URL ??
      'http://localhost:3001/api/auth/github/callback',
    token: process.env.GITHUB_TOKEN ?? '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },
};

export function assertOpenAiConfigured(): void {
  required('OPENAI_API_KEY', config.openai.apiKey || undefined);
}

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(config.github.clientId && config.github.clientSecret);
}

export function isClientOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  return config.clientUrls.includes(origin);
}

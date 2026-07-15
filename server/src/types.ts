export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  labels: Array<{ name: string; color?: string }>;
  created_at: string;
  user: { login: string; avatar_url: string } | null;
}

export interface RepoRef {
  owner: string;
  repo: string;
}

export interface CoachStep {
  order: number;
  title: string;
  description: string;
}

export interface RelevantFile {
  path: string;
  explanation: string;
}

export interface PrDraft {
  title: string;
  body: string;
}

export interface CoachAnalysis {
  summary: string;
  issueContext: string;
  relevantFiles: RelevantFile[];
  steps: CoachStep[];
  prDraft: PrDraft;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  tips: string[];
}

export interface SessionData {
  accessToken: string;
  user: GitHubUser;
}

export interface AnalyzeRequest {
  owner: string;
  repo: string;
  issueNumber: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  owner: string;
  repo: string;
  issueNumber: number;
  messages: ChatMessage[];
  analysisSummary?: string;
}

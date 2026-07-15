import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { CoachAnalysis, GitHubIssue, GitHubUser, RepoRef } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getStatus(): Observable<{ oauthConfigured: boolean }> {
    return this.http.get<{ oauthConfigured: boolean }>(`${this.base}/auth/status`);
  }

  getMe(): Observable<{ user: GitHubUser | null }> {
    return this.http.get<{ user: GitHubUser | null }>(`${this.base}/auth/me`, {
      withCredentials: true,
    });
  }

  loginWithGitHub(): void {
    window.location.href = `${this.base}/auth/github`;
  }

  logout(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      `${this.base}/auth/logout`,
      {},
      { withCredentials: true },
    );
  }
}

@Injectable({ providedIn: 'root' })
export class GitCoachApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  parseRepo(input: string): Observable<RepoRef> {
    return this.http.post<RepoRef>(`${this.base}/repos/parse`, { input });
  }

  listIssues(owner: string, repo: string, label?: string): Observable<GitHubIssue[]> {
    const params = label ? { label } : undefined;
    return this.http.get<GitHubIssue[]>(`${this.base}/repos/${owner}/${repo}/issues`, {
      params,
      withCredentials: true,
    });
  }

  analyze(owner: string, repo: string, issueNumber: number): Observable<CoachAnalysis> {
    return this.http.post<CoachAnalysis>(
      `${this.base}/coach/analyze`,
      { owner, repo, issueNumber },
      { withCredentials: true },
    );
  }

  chat(
    owner: string,
    repo: string,
    issueNumber: number,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    analysisSummary?: string,
  ): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(
      `${this.base}/coach/chat`,
      { owner, repo, issueNumber, messages, analysisSummary },
      { withCredentials: true },
    );
  }
}

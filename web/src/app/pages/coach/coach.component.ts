import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import type {
  ChatMessage,
  CoachAnalysis,
  GitHubIssue,
  RepoRef,
} from '../../models';
import {
  AuthService,
  GitCoachApiService,
} from '../../services/gitcoach-api.service';

type WizardStep = 'repo' | 'issues' | 'analysis';

@Component({
  selector: 'app-coach',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './coach.component.html',
  styleUrl: './coach.component.scss',
})
export class CoachComponent {
  private readonly api = inject(GitCoachApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly wizardStep = signal<WizardStep>('repo');
  protected readonly repoInput = signal('facebook/react');
  protected readonly repo = signal<RepoRef | null>(null);
  protected readonly issues = signal<GitHubIssue[]>([]);
  protected readonly selectedIssue = signal<GitHubIssue | null>(null);
  protected readonly analysis = signal<CoachAnalysis | null>(null);
  protected readonly chatMessages = signal<ChatMessage[]>([]);
  protected readonly chatInput = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly oauthConfigured = signal(false);
  protected readonly user = signal<{ login: string; avatar_url: string; name: string | null } | null>(null);
  protected readonly filterGoodFirst = signal(false);

  protected readonly repoLabel = computed(() => {
    const current = this.repo();
    return current ? `${current.owner}/${current.repo}` : '';
  });

  constructor() {
    this.auth.getStatus().subscribe({
      next: (status) => this.oauthConfigured.set(status.oauthConfigured),
    });
    this.auth.getMe().subscribe({
      next: ({ user }) => this.user.set(user),
    });

    const authResult = this.route.snapshot.queryParamMap.get('auth');
    if (authResult === 'success' || authResult === 'failed') {
      this.error.set(
        authResult === 'failed'
          ? 'GitHub login failed. You can still use public repos without signing in.'
          : null,
      );
    }
  }

  protected login(): void {
    this.auth.loginWithGitHub();
  }

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => this.user.set(null),
    });
  }

  protected loadRepo(): void {
    this.loading.set(true);
    this.error.set(null);
    this.analysis.set(null);
    this.selectedIssue.set(null);
    this.chatMessages.set([]);

    this.api.parseRepo(this.repoInput()).subscribe({
      next: (parsed) => {
        this.repo.set(parsed);
        this.wizardStep.set('issues');
        this.loadIssues(parsed);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error ?? 'Could not parse repository URL.');
      },
    });
  }

  protected loadIssues(current = this.repo()): void {
    if (!current) return;

    this.loading.set(true);
    this.error.set(null);

    const label = this.filterGoodFirst() ? 'good first issue' : undefined;
    this.api.listIssues(current.owner, current.repo, label).subscribe({
      next: (items) => {
        this.issues.set(items);
        this.loading.set(false);
        if (items.length === 0) {
          this.error.set(
            'No open issues found. Try turning off the good-first filter or pick another repo.',
          );
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error ?? 'Failed to load issues.');
      },
    });
  }

  protected selectIssue(issue: GitHubIssue): void {
    this.selectedIssue.set(issue);
    this.analyzeIssue(issue);
  }

  protected analyzeIssue(issue: GitHubIssue): void {
    const current = this.repo();
    if (!current) return;

    this.loading.set(true);
    this.error.set(null);
    this.wizardStep.set('analysis');
    this.chatMessages.set([]);

    this.api.analyze(current.owner, current.repo, issue.number).subscribe({
      next: (result) => {
        this.analysis.set(result);
        this.loading.set(false);
        this.chatMessages.set([
          {
            role: 'assistant',
            content:
              'Mission plan ready. Ask me anything while you implement — e.g. “Why is this function async?” or “What should my test cover?”',
          },
        ]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.error?.error ??
            'Analysis failed. Make sure OPENAI_API_KEY is set on the server.',
        );
      },
    });
  }

  protected sendChat(): void {
    const text = this.chatInput().trim();
    const current = this.repo();
    const issue = this.selectedIssue();
    if (!text || !current || !issue) return;

    const history = [...this.chatMessages(), { role: 'user' as const, content: text }];
    this.chatMessages.set(history);
    this.chatInput.set('');
    this.loading.set(true);

    this.api
      .chat(
        current.owner,
        current.repo,
        issue.number,
        history,
        this.analysis()?.summary,
      )
      .subscribe({
        next: ({ reply }) => {
          this.chatMessages.update((msgs) => [...msgs, { role: 'assistant', content: reply }]);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.error ?? 'Chat failed.');
        },
      });
  }

  protected goToStep(step: WizardStep): void {
    this.wizardStep.set(step);
    this.error.set(null);
  }

  protected copyPr(): void {
    const draft = this.analysis()?.prDraft;
    if (!draft) return;
    const text = `# ${draft.title}\n\n${draft.body}`;
    void navigator.clipboard.writeText(text);
  }

  protected onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendChat();
    }
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="hero" aria-labelledby="hero-title">
      <p class="eyebrow">OpenAI × NamasteDev Hackathon</p>
      <h1 id="hero-title">GitCoach</h1>
      <p class="lead">
        Your AI mentor for open source. Pick a GitHub issue, understand the codebase,
        follow a step-by-step plan, and ship a merge-ready pull request.
      </p>
      <div class="actions">
        <a routerLink="/coach" class="btn primary">Start your first PR mission</a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          class="btn ghost"
        >
          Browse GitHub issues
        </a>
      </div>
    </section>

    <section class="grid" aria-label="How GitCoach works">
      @for (step of steps; track step.title) {
        <article class="card">
          <span class="step-num" aria-hidden="true">{{ step.num }}</span>
          <h2>{{ step.title }}</h2>
          <p>{{ step.body }}</p>
        </article>
      }
    </section>
  `,
  styles: `
    .hero {
      max-width: 720px;
      margin: 0 auto 3rem;
      text-align: center;
    }

    .eyebrow {
      color: var(--accent);
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 0.75rem;
    }

    h1 {
      font-size: clamp(2.5rem, 6vw, 3.75rem);
      margin: 0 0 1rem;
      letter-spacing: -0.03em;
    }

    .lead {
      color: var(--muted);
      font-size: 1.125rem;
      line-height: 1.7;
      margin: 0 0 2rem;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem;
    }

    .step-num {
      display: inline-flex;
      width: 2rem;
      height: 2rem;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: color-mix(in srgb, var(--accent) 18%, transparent);
      color: var(--accent);
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .card h2 {
      font-size: 1.1rem;
      margin: 0 0 0.5rem;
    }

    .card p {
      margin: 0;
      color: var(--muted);
      line-height: 1.6;
      font-size: 0.95rem;
    }
  `,
})
export class HomeComponent {
  protected readonly steps = [
    {
      num: '1',
      title: 'Pick a repo & issue',
      body: 'Paste any public GitHub repo or connect GitHub to browse open issues.',
    },
    {
      num: '2',
      title: 'Understand the code',
      body: 'AI reads the repo and explains only the files relevant to your issue.',
    },
    {
      num: '3',
      title: 'Follow the plan',
      body: 'Get an ordered checklist — what to change, where, and how to test.',
    },
    {
      num: '4',
      title: 'Open your PR',
      body: 'Copy a professional PR title and description when you are ready to ship.',
    },
  ];
}

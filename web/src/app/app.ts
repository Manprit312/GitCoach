import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <header class="topbar">
        <a routerLink="/" class="brand" aria-label="GitCoach home">
          <span class="logo" aria-hidden="true">GC</span>
          <span>GitCoach</span>
        </a>
        <nav aria-label="Main">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            Home
          </a>
          <a routerLink="/coach" routerLinkActive="active">Mission</a>
        </nav>
      </header>
      <main id="main-content">
        <router-outlet />
      </main>
      <footer class="footer">
        Built with OpenAI Codex · OpenAI × NamasteDev Hackathon 2026
      </footer>
    </div>
  `,
  styles: `
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--surface) 80%, transparent);
      backdrop-filter: blur(8px);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      color: var(--text);
      text-decoration: none;
      font-weight: 700;
    }

    .logo {
      width: 2rem;
      height: 2rem;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--accent), #6366f1);
      color: white;
      font-size: 0.75rem;
    }

    nav {
      display: flex;
      gap: 1rem;

      a {
        color: var(--muted);
        text-decoration: none;
        font-weight: 500;

        &.active,
        &:hover {
          color: var(--text);
        }
      }
    }

    main {
      flex: 1;
      width: min(1100px, 100%);
      margin: 0 auto;
      padding: 2rem 1.25rem 3rem;
    }

    .footer {
      text-align: center;
      padding: 1rem;
      color: var(--muted);
      font-size: 0.85rem;
      border-top: 1px solid var(--border);
    }
  `,
})
export class App {}

import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import { Brandmark } from '@/components/Brandmark';
import './landing.css';

/**
 * Product shots for the photo band, kept in public/screens.
 *
 * The file may not exist yet — a missing screenshot falls back to the halftone
 * placeholder rather than a broken image, so the page is never worse than it
 * was. Existence is checked when the page renders, which for a production
 * build means at build time: add a screenshot, rebuild, and it appears.
 */
function hasScreen(file: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', 'screens', file));
}

function Screen({
  file,
  alt,
  placeholderLabel,
}: {
  file: string;
  alt: string;
  placeholderLabel: string;
}) {
  if (!hasScreen(file)) return <div className="halftone-ph" role="img" aria-label={placeholderLabel} />;
  // eslint-disable-next-line @next/next/no-img-element -- static asset, fixed slot, no optimizer needed
  return <img className="halftone-ph shot" src={`/screens/${file}`} alt={alt} />;
}

/* ---- inline icons (Phosphor CDN replaced to satisfy the strict CSP) ---- */
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
    <path d="m5 8 2 2 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconMinus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const IconImport = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3v11m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconBoard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="5" height="16" rx="1" stroke="currentColor" strokeWidth="1.6" />
    <rect x="10" y="4" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.6" />
    <rect x="17" y="4" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const IconChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 20V4M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="m7 15 3.5-4 3 2.5L20 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  return (
    <div className="landing">
      <nav className="nav">
        <span className="nav-brand brandmark">
          <Brandmark height={24} />
        </span>
        <span className="spacer" />
        <a href="#features">Features</a>
        <a href="#how">How it works</a>
        <a href="#pricing">Pricing</a>
        <Link href="/login">Log in</Link>
        <Link className="btn btn-primary" href="/signup">
          Start free
        </Link>
      </nav>

      <div className="wrap">
        {/* hero */}
        <section className="hero">
          <h1 className="display">
            <span className="line">Every project, tracked.</span>{' '}
            <span className="line">Nothing shouting.</span>
          </h1>
          <p className="sub">
            Trackly is project tracking for teams of five to fifty who left Jira out of
            self-respect. Boards that stay fast, analytics your team actually reads, and a tool
            that gets out of your way by design.
          </p>
          <div className="row">
            <Link className="btn btn-primary" href="/signup">
              Start free
            </Link>
            <Link className="btn btn-ghost" href="/login">
              See the board
            </Link>
            <span className="fine">Free for 10 people. No card, no demo call.</span>
          </div>

          <div className="press">
            <div
              className="browser"
              role="img"
              aria-label="The Trackly app: a kanban board beside a compact analytics rail"
            >
              <div className="browser-bar">
                <span className="lamp" />
                <span className="lamp" />
                <span className="lamp" />
                <span className="url">app.trackly.com/launch-q3</span>
              </div>
              <div className="hero-side">
                <div className="ui">
                  <div className="ui-head">
                    <span className="ui-title">Launch Q3</span>
                    <span className="ui-meta">14 open · updated 2m ago</span>
                  </div>
                  <div className="board">
                    <div className="lane">
                      <p className="lane-name">
                        <span className="dot dot-off" />
                        Backlog <span className="lane-count">6</span>
                      </p>
                      <div className="kcard p-med">
                        <p className="kt">Pricing page rewrite</p>
                        <div className="krow">
                          <span className="kid">TRK-231</span>
                          <span className="avatars">
                            <span className="avatar av-a">MB</span>
                          </span>
                        </div>
                      </div>
                      <div className="kcard">
                        <p className="kt">Import from CSV</p>
                        <div className="krow">
                          <span className="kid">TRK-228</span>
                          <span className="avatars">
                            <span className="avatar av-b">JT</span>
                          </span>
                        </div>
                      </div>
                      <div className="kcard">
                        <p className="kt">Empty-state copy</p>
                        <div className="krow">
                          <span className="kid">TRK-224</span>
                          <span className="avatars">
                            <span className="avatar av-c">RS</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="lane">
                      <p className="lane-name">
                        <span className="dot dot-on" />
                        In progress <span className="lane-count">3</span>
                      </p>
                      <div className="kcard p-high drag">
                        <p className="kt">Checkout error on Safari</p>
                        <div className="krow">
                          <span className="kid">TRK-240</span>
                          <span className="avatars">
                            <span className="avatar av-b">JT</span>
                            <span className="avatar av-a">MB</span>
                          </span>
                        </div>
                      </div>
                      <div className="kcard p-med">
                        <p className="kt">Onboarding email pass</p>
                        <div className="krow">
                          <span className="kid">TRK-236</span>
                          <span className="avatars">
                            <span className="avatar av-c">RS</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="lane">
                      <p className="lane-name">
                        <span className="dot dot-off" />
                        Done <span className="lane-count">21</span>
                      </p>
                      <div className="kcard">
                        <p className="kt">Team roles &amp; limits</p>
                        <div className="krow">
                          <span className="kid">TRK-219</span>
                          <span className="avatars">
                            <span className="avatar av-a">MB</span>
                          </span>
                        </div>
                      </div>
                      <div className="kcard">
                        <p className="kt">Board keyboard nav</p>
                        <div className="krow">
                          <span className="kid">TRK-215</span>
                          <span className="avatars">
                            <span className="avatar av-b">JT</span>
                            <span className="avatar av-c">RS</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="hero-analytics ui">
                  <div className="mini-stat">
                    <span className="ms-label">Cycle time</span>
                    <div className="ms-num">2.4d</div>
                    <svg className="spark" width="120" height="26" viewBox="0 0 120 26" aria-hidden="true">
                      <polyline points="0,20 15,17 30,19 45,12 60,14 75,9 90,11 105,6 120,7" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="mini-stat">
                    <span className="ms-label">Shipped this week</span>
                    <div className="ms-num">12</div>
                    <svg className="spark" width="120" height="26" viewBox="0 0 120 26" aria-hidden="true">
                      <polyline points="0,18 15,19 30,15 45,16 60,11 75,13 90,8 105,9 120,5" fill="none" stroke="var(--color-neutral-400)" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <div className="mini-stat">
                    <span className="ms-label">On track</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
                        <circle cx="17" cy="17" r="14" fill="none" stroke="var(--color-neutral-200)" strokeWidth="4" />
                        <circle cx="17" cy="17" r="14" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeDasharray="70.4 87.9" transform="rotate(-90 17 17)" />
                      </svg>
                      <span className="ms-num">80%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* proof strip */}
        <section className="proof" aria-label="Teams on Trackly">
          <p className="lede">Small teams keeping score with Trackly</p>
          <div className="row">
            <span className="mark">Fieldnote</span>
            <span className="mark">
              arcline<small>CO</small>
            </span>
            <span className="mark">MOTORIK</span>
            <span className="mark">Pallet&amp;Sons</span>
            <span className="mark">Northbeam</span>
          </div>
        </section>

        {/* features */}
        <section id="features">
          <div className="feature">
            <div className="f-copy">
              <span className="kicker">The board</span>
              <h2 className="f-title">Kanban that stays fast</h2>
              <p>
                Every keystroke lands in under sixteen milliseconds, whether the board holds twelve
                cards or twelve hundred. Priority is a stripe of ink on the card&apos;s edge, not a
                modal. Drag a card and it lifts off the paper; drop it and the column has already
                re-counted itself.
              </p>
              <div className="spark-note">
                <span className="dot dot-warn" />
                High priority is the only thing printed in the second color.
              </div>
            </div>
            <div className="crop">
              <span className="crop-tag">Detail · one column, mid-drag</span>
              <div className="ui" style={{ padding: 'var(--space-4)', maxWidth: 340 }}>
                <p className="lane-name">
                  <span className="dot dot-on" />
                  In progress <span className="lane-count">4</span>
                </p>
                <div className="lane">
                  <div className="kcard p-high drag">
                    <p className="kt">Checkout error on Safari</p>
                    <div className="krow">
                      <span className="kid">TRK-240</span>
                      <span className="avatars">
                        <span className="avatar av-b">JT</span>
                        <span className="avatar av-a">MB</span>
                      </span>
                    </div>
                  </div>
                  <div className="kcard p-med">
                    <p className="kt">Onboarding email pass</p>
                    <div className="krow">
                      <span className="kid">TRK-236</span>
                      <span className="avatars">
                        <span className="avatar av-c">RS</span>
                      </span>
                    </div>
                  </div>
                  <div className="kcard">
                    <p className="kt">Docs: webhooks</p>
                    <div className="krow">
                      <span className="kid">TRK-233</span>
                      <span className="avatars">
                        <span className="avatar av-a">MB</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="feature flip">
            <div className="f-copy">
              <span className="kicker">The numbers</span>
              <h2 className="f-title">Analytics your team actually reads</h2>
              <p>
                Four numbers and two charts: cycle time, throughput, what&apos;s stuck, what
                shipped. Set in the same two inks as the rest of the product, sized to be read
                across a standup, and never more than one click from the board they describe.
              </p>
              <div className="spark-note">
                <svg className="spark" width="72" height="20" viewBox="0 0 72 20" aria-hidden="true">
                  <polyline points="0,15 12,13 24,14 36,9 48,11 60,6 72,7" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" />
                </svg>
                A sparkline is a sentence, not a dashboard.
              </div>
            </div>
            <div className="crop">
              <span className="crop-tag">Detail · throughput, last eight weeks</span>
              <div className="ui">
                <div className="bars" aria-hidden="true">
                  <div className="bar" style={{ height: '38%' }} />
                  <div className="bar" style={{ height: '52%' }} />
                  <div className="bar" style={{ height: '44%' }} />
                  <div className="bar" style={{ height: '60%' }} />
                  <div className="bar" style={{ height: '55%' }} />
                  <div className="bar" style={{ height: '72%' }} />
                  <div className="bar" style={{ height: '64%' }} />
                  <div className="bar hot" style={{ height: '88%' }} />
                </div>
                <div className="bars-x">
                  <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
                  <span>W5</span><span>W6</span><span>W7</span><span>W8</span>
                </div>
              </div>
            </div>
          </div>

          <div className="feature">
            <div className="f-copy">
              <span className="kicker">The team</span>
              <h2 className="f-title">Roles and limits that scale</h2>
              <p>
                Admins, members, guests. Three roles, plainly named. Work-in-progress limits live
                on the column, so the board itself says no before a manager has to. When you grow
                past fifty, Trackly will tell you; until then it stays out of your way.
              </p>
              <div className="spark-note">
                <span className="dot dot-on" />
                Guests see boards, never billing.
              </div>
            </div>
            <div className="crop">
              <span className="crop-tag">Detail · members &amp; roles</span>
              <div className="ui" style={{ padding: 'var(--space-4)' }}>
                <table className="roles">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role</th>
                      <th>WIP limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <span className="avatar av-a" style={{ display: 'inline-grid', marginRight: 8 }}>MB</span>
                        Mara Boyd
                      </td>
                      <td><span className="pill pill-admin">Admin</span></td>
                      <td>None</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="avatar av-b" style={{ display: 'inline-grid', marginRight: 8 }}>JT</span>
                        Jonah Trace
                      </td>
                      <td><span className="pill pill-member">Member</span></td>
                      <td>3 cards</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="avatar av-c" style={{ display: 'inline-grid', marginRight: 8 }}>RS</span>
                        Rio Sandoval
                      </td>
                      <td><span className="pill pill-member">Member</span></td>
                      <td>3 cards</td>
                    </tr>
                    <tr>
                      <td>
                        <span className="avatar av-b" style={{ display: 'inline-grid', marginRight: 8, filter: 'grayscale(1)' }}>KL</span>
                        Kit Lang
                      </td>
                      <td><span className="pill pill-guest">Guest</span></td>
                      <td>read only</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* how it works */}
        <section className="how" id="how">
          <span className="kicker">How it works</span>
          <div className="steps">
            <div className="step">
              <div className="step-num" aria-hidden="true">1</div>
              <h3>
                <IconImport />
                Bring your work
              </h3>
              <p>
                Import from CSV, Trello or Jira in one pass. Cards, people and history arrive
                intact; the ceremony does not.
              </p>
            </div>
            <div className="step">
              <div className="step-num" aria-hidden="true">2</div>
              <h3>
                <IconBoard />
                Shape the board
              </h3>
              <p>
                Name your columns, set WIP limits, mark priorities. Five minutes, and there is
                nothing else to configure.
              </p>
            </div>
            <div className="step">
              <div className="step-num" aria-hidden="true">3</div>
              <h3>
                <IconChart />
                Read the week
              </h3>
              <p>
                Analytics fill themselves in as the team works. Monday&apos;s numbers are ready
                before Monday&apos;s coffee.
              </p>
            </div>
          </div>
        </section>

        {/* photo band */}
        <section className="photo-band">
          <span className="kicker">The room where it runs</span>
          {/* Two screenshots of the same proportions want equal columns; the
              7fr/5fr split is for the placeholder pair. */}
          <div className={hasScreen('board.png') && hasScreen('analytics.png') ? 'duo shots' : 'duo'}>
            <figure className="wide">
              <Screen
                file="board.png"
                alt="The Launch Q3 board: to do, in progress and done side by side, with one card marked overdue"
                placeholderLabel="A small team working around a desk, printed as a newsprint halftone"
              />
              <figcaption>
                Northbeam&apos;s Tuesday: eleven people, one board, the whole week visible without
                scrolling.
              </figcaption>
            </figure>
            <figure className="tall">
              <Screen
                file="analytics.png"
                alt="The analytics screen: throughput per week, median cycle time, and what is overdue"
                placeholderLabel="A clear desk with a notebook and coffee, printed as a newsprint halftone"
              />
              <figcaption>
                The same week read back: throughput, cycle time, and what slipped.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* quote */}
        <section className="quote">
          <figure className="portrait logo-slot">
            {/* eslint-disable-next-line @next/next/no-img-element -- static asset, fixed slot */}
            <img src="/logo-mark.png" alt="Trackly" />
          </figure>
          <figure>
            <blockquote>
              “Every tracker I tried wanted a ceremony before it would show me the work. Trackly is
              the one that just shows you the work.”
            </blockquote>
            <figcaption>Mohamed Louhabi, founder</figcaption>
          </figure>
        </section>

        {/* pricing */}
        <section className="pricing" id="pricing">
          <span className="kicker">Pricing</span>
          <h2 className="f-title" style={{ maxWidth: '20ch' }}>
            Two plans. No toggle, no asterisks.
          </h2>
          <div className="plans">
            <div className="plan">
              <p className="p-name">Free</p>
              <p className="p-price">
                $0 <small>forever</small>
              </p>
              <ul>
                <li><IconCheck />Up to 10 people</li>
                <li><IconCheck />3 boards, unlimited cards</li>
                <li><IconCheck />Core analytics (4 numbers)</li>
                <li><IconCheck />CSV &amp; Trello import</li>
                <li className="na"><IconMinus />Roles &amp; WIP limits</li>
                <li className="na"><IconMinus />History beyond 90 days</li>
              </ul>
              <Link className="btn btn-secondary" href="/signup">
                Start free
              </Link>
            </div>
            <div className="plan pro">
              <p className="p-name">Pro</p>
              <p className="p-price">
                $8 <small>per person / month</small>
              </p>
              <ul>
                <li><IconCheck />Up to 50 people</li>
                <li><IconCheck />Unlimited boards</li>
                <li><IconCheck />Full analytics &amp; exports</li>
                <li><IconCheck />Roles, guests &amp; WIP limits</li>
                <li><IconCheck />Jira import, unlimited history</li>
                <li><IconCheck />Priority support, from humans</li>
              </ul>
              <Link className="btn btn-primary" href="/signup">
                Try Pro free for 30 days
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* close CTA */}
      <section className="close">
        <div className="inner">
          <h2>
            Clear desk. Clear board.
            <br />
            Clear week.
          </h2>
          <p>
            Set up takes an afternoon coffee, not a consulting engagement. Bring one project and see
            whether Trackly earns the rest.
          </p>
          <div className="row">
            <Link className="btn btn-primary" href="/signup">
              Start free
            </Link>
            <span className="fine">10 people free forever · cancel in one click</span>
          </div>
        </div>
      </section>

      {/* footer */}
      <div className="wrap">
        <footer>
          <div className="sitemap">
            <div>
              <span className="brandmark">
                <Brandmark height={24} />
              </span>
              <p style={{ fontSize: 13.5, maxWidth: '26ch', marginTop: 'var(--half)', color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' }}>
                Project tracking for teams who&apos;d rather be working.
              </p>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><Link href="/login">Board</Link></li>
                <li><Link href="/login">Analytics</Link></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="#">About</a></li>
                <li><a href="#">Changelog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>
            <div>
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Docs</a></li>
                <li><a href="#">Status</a></li>
                <li><a href="#">Security</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="smallprint">
            <span>© 2026 Trackly, Inc.</span>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Made with a clear desk.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

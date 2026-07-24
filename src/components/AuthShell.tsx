import { Brandmark } from './Brandmark';

/**
 * Auth chrome: minimal centered card (layout from the reference mockup),
 * rendered in the Trackly identity of paper ground, ink serif and process cyan.
 */
export function AuthShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-6 flex justify-center">
          <a href="/" aria-label="Trackly" className="no-underline">
            <Brandmark height={26} />
          </a>
        </p>
        <div className="rounded-xl bg-card p-8 shadow-card-md">
          <div className="mb-6 text-center">
            {icon && (
              <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-accent-100 text-accent-700">
                {icon}
              </span>
            )}
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

/* Underline field — auth forms only (mockup grammar). */
export const fieldLabelClass = 'block text-[13px] text-neutral-600';
export const underlineInputClass =
  'w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-2 text-[15px] outline-none transition-colors placeholder:text-neutral-400 focus:border-accent-500';

/* Boxed field — app forms (settings, modals, onboarding). */
export const inputClass =
  'w-full rounded-md border border-divider bg-card px-3 py-2 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200';

/* Buttons — cyan is the one working accent; hover lifts 1px, press settles. */
export const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-md bg-accent-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-accent-600 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0';

export const buttonSecondaryClass =
  'inline-flex items-center justify-center gap-2 rounded-md border border-divider bg-card px-6 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-px hover:bg-neutral-200 active:translate-y-0 disabled:opacity-50';

export const buttonGhostClass =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-200 hover:text-ink';

export function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

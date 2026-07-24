'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* Section icons — inline so settings carries no icon-font request. */
const IconBuilding = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 17.5V4.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v13" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M11 8.5h5a1 1 0 0 1 1 1v8M1.5 17.5h17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.5 7h3M5.5 10.5h3M14 12h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const IconUsers = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="8" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2.5 16.5c.8-2.6 3-3.9 5.5-3.9s4.7 1.3 5.5 3.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M14 5.6a2.6 2.6 0 0 1 0 5M16 16.5c-.3-1-.7-1.9-1.3-2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const IconReceipt = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 2.5h12v15l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2v-15Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M7 7h6M7 10.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const IconUser = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.4" />
    <path d="M3.8 16.5c.9-2.8 3.3-4.2 6.2-4.2s5.3 1.4 6.2 4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const SECTIONS = [
  { href: '/settings/workspace', label: 'Workspace', Icon: IconBuilding },
  { href: '/settings/members', label: 'Members', Icon: IconUsers },
  { href: '/settings/billing', label: 'Billing', Icon: IconReceipt },
  { href: '/settings/account', label: 'Account', Icon: IconUser },
];

export function SettingsNav() {
  const active = usePathname();
  return (
    <nav className="snav" aria-label="Settings sections">
      {SECTIONS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} aria-current={active.startsWith(href) ? 'page' : undefined}>
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  );
}

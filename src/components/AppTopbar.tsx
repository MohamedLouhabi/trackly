'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Member, OrgSummary } from '@/lib/types';
import { Brandmark } from './Brandmark';
import { OrgSwitcher } from './OrgSwitcher';

/* Avatar ink pairs cycle through the identity's four combinations. */
const AV = ['av-a', 'av-b', 'av-c', 'av-d'];

export function initialsOf(name: string | null): string {
  if (!name) return '·';
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AppTopbar({
  orgId,
  orgs,
  members,
}: {
  orgId: string;
  orgs: OrgSummary[];
  members: Member[];
}) {
  const pathname = usePathname();

  const nav = [
    {
      label: 'Board',
      href: `/dashboard/${orgId}`,
      active: pathname === `/dashboard/${orgId}` || pathname.includes('/projects/'),
    },
    {
      label: 'Analytics',
      href: `/dashboard/${orgId}/analytics`,
      active: pathname.endsWith('/analytics'),
    },
    { label: 'Settings', href: '/settings/billing', active: pathname.startsWith('/settings') },
  ];

  const shown = members.slice(0, 3);
  const extra = members.length - shown.length;

  return (
    <header className="topbar">
      <Link href="/dashboard" className="brandmark" aria-label="Trackly">
        <Brandmark height={22} />
      </Link>

      <nav>
        {nav.map((item) => (
          <Link key={item.label} href={item.href} aria-current={item.active ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <span className="spacer" />

      <span className="avatars">
        {shown.map((m, i) => (
          <span key={m.user_id} title={m.display_name ?? undefined} className={`avatar ${AV[i % AV.length]}`}>
            {initialsOf(m.display_name)}
          </span>
        ))}
        {extra > 0 && <span className="avatar av-d">+{extra}</span>}
      </span>

      <OrgSwitcher orgs={orgs} currentOrgId={orgId} />

      <form action="/api/auth/logout" method="post">
        <button type="submit" className="btn btn-ghost">
          Log out
        </button>
      </form>
    </header>
  );
}

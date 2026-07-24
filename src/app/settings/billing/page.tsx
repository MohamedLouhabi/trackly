import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBillingOverview, PLAN_LIMITS, PLAN_PRICE_USD } from '@/lib/billing';
import { BillingActions } from '@/components/BillingActions';

function Meter({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div className="meter">
      <i className={pct >= 100 ? 'full' : ''} style={{ width: `${pct}%` }} />
    </div>
  );
}

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
    <path d="m5 8 2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconCard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--color-neutral-700)' }}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2.5 9.5h19" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6 14.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const money = (n: number) => `$${n.toFixed(2)}`;
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Read with the caller's RLS-bound client (least privilege — see billing.ts).
  const overview = await getBillingOverview(supabase, user.id);
  const free = PLAN_LIMITS.free;

  // Simulated billing has no invoice history — the only real money-shaped fact
  // is the open period on each Pro org. Anything else here would be invented.
  const periods = overview.filter((o) => o.plan === 'pro' && o.currentPeriodEnd);

  return (
    <>
      {overview.length === 0 && (
        <p className="empty">You don’t own or administer any organization yet.</p>
      )}

      {overview.map((org) => {
        const pro = org.plan === 'pro';
        return (
          <div key={org.orgId} className={`plan-card ${pro ? 'pro' : ''}`}>
            <div className="row">
              <h2>{org.orgName}</h2>
              <span className={`paid ${pro ? '' : 'free'}`}>
                {pro && <IconCheck />}
                {pro ? 'Pro · Active' : 'Free'}
              </span>
              <span className="price">
                ${PLAN_PRICE_USD[org.plan]} <small>/ month</small>
              </span>
            </div>

            {pro ? (
              <>
                <p style={{ marginTop: 'var(--space-4)', fontSize: 13, color: 'var(--color-neutral-700)' }}>
                  Unlimited organizations, projects and members.
                </p>
                <div className="seats">
                  <div className="s-row">
                    <span>Projects in use</span>
                    <span>{org.projectCount}</span>
                  </div>
                  <div className="s-row">
                    <span>Members in use</span>
                    <span>{org.memberCount}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="seats">
                  <div className="s-row">
                    <span>Projects</span>
                    <span>
                      {org.projectCount} of {free.projects}
                    </span>
                  </div>
                  <Meter used={org.projectCount} limit={free.projects!} />
                </div>
                <div className="seats">
                  <div className="s-row">
                    <span>Members</span>
                    <span>
                      {org.memberCount} of {free.members}
                    </span>
                  </div>
                  <Meter used={org.memberCount} limit={free.members!} />
                </div>
              </>
            )}

            <div className="actions">
              <BillingActions orgId={org.orgId} plan={org.plan} isOwner={org.role === 'owner'} />
              <span className="fine">
                {pro && org.currentPeriodEnd
                  ? `Renews ${longDate(org.currentPeriodEnd)}`
                  : 'Simulated billing. No card is charged.'}
              </span>
            </div>
          </div>
        );
      })}

      <div className="block">
        <h3>Payment method</h3>
        <p className="b-sub">
          Billing is simulated for now. Stripe drops in behind one module, so no card is stored and
          nothing is charged.
        </p>
        <div className="payrow">
          <IconCard />
          <span>No card on file</span>
          <span className="muted">nothing to charge, nothing to leak</span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled
            title="Available once a payment provider is connected"
          >
            Add card
          </button>
        </div>
      </div>

      <div className="block">
        <h3>Billing periods</h3>
        <p className="b-sub">
          {periods.length > 0
            ? 'Each Pro upgrade opens a simulated 30-day period. No invoice is issued and no card is charged.'
            : 'Nothing has been billed yet.'}
        </p>
        {periods.length > 0 ? (
          <table className="invoices">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Period ends</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((org) => (
                <tr key={org.orgId}>
                  <td>{org.orgName}</td>
                  <td>{longDate(org.currentPeriodEnd!)}</td>
                  <td>{money(PLAN_PRICE_USD.pro)}</td>
                  <td>
                    <span className="paid free">Simulated</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty" style={{ fontSize: 13.5 }}>
            Upgrade an organization to Pro and its open period shows up here.
          </p>
        )}
      </div>
    </>
  );
}

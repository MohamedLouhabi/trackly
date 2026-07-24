import { redirect } from 'next/navigation';

/** Account settings moved into the settings shell — keep the old link working. */
export default function AccountRedirect() {
  redirect('/settings/account');
}

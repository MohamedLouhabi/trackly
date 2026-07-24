import { NextRequest, NextResponse } from 'next/server';

/**
 * Best-effort client IP for rate-limit keys. On Vercel, x-forwarded-for is
 * set by the platform; the left-most entry is the real client.
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

// Generic client-facing responses. Detailed reasons stay in server logs only.
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export const GENERIC_ERROR = 'Something went wrong. Please try again.';
export const RATE_LIMITED = 'Too many attempts. Please try again later.';
export const INVALID_CREDENTIALS = 'Invalid email or password.';

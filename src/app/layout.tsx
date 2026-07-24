import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import './globals.css';

// Source Serif 4, everywhere — self-hosted by next/font, so the strict
// font-src 'self' CSP holds (no external font requests at runtime).
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: 'variable',
});

export const metadata: Metadata = {
  title: 'Trackly',
  description: 'Track projects and tasks with your team.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sourceSerif.variable}>
      <body className="font-serif">{children}</body>
    </html>
  );
}

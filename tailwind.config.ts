import type { Config } from 'tailwindcss';

/**
 * Trackly visual identity — "Broadsheet": ink on paper, process cyan as the
 * one working accent, process magenta as the rare second ink (high priority,
 * alerts, overdue). Ramps mirror trackly_visuel_identity/styleguide.html.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f3f2f2', // ground — everywhere
        ink: '#201e1d', // text, wordmark
        card: '#ffffff', // cards on the paper ground
        divider: '#e3e1df',
        accent: {
          // process cyan — CTAs, links, active states, primary series
          100: '#e0f1f7',
          200: '#b8e0ed',
          300: '#85c8dd',
          400: '#4aabc9',
          500: '#0088b0',
          600: '#007598',
          700: '#005f7d',
          800: '#004a62',
          900: '#003647',
        },
        accent2: {
          // process magenta — spent only on high priority and alerts
          100: '#fbe3ef',
          200: '#f5bcd8',
          300: '#ec8ab9',
          400: '#e05496',
          500: '#d6006c',
          600: '#b3005b',
          700: '#91004a',
          800: '#6e0039',
          900: '#4d0028',
        },
        neutral: {
          // warm grays
          100: '#ffffff',
          200: '#e9e7e6',
          300: '#d8d5d3',
          400: '#b5b1ae',
          500: '#928e8b',
          600: '#6f6b68',
          700: '#565350',
          800: '#3d3b39',
          900: '#2a2827',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(32,30,29,0.05), 0 1px 1px rgba(32,30,29,0.04)',
        'card-md': '0 2px 6px rgba(32,30,29,0.07), 0 8px 20px rgba(32,30,29,0.07)',
        'card-lg': '0 4px 10px rgba(32,30,29,0.08), 0 18px 40px rgba(32,30,29,0.12)',
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    borderRadius: {
      none: '0px',
      DEFAULT: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      full: '0px',
    },
    extend: {
      colors: {
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        line: 'var(--line)',
        'line-soft': 'var(--line-soft)',
        olive: 'var(--olive)',
        'olive-dark': 'var(--olive-dark)',
        steel: 'var(--steel)',
        amber: 'var(--amber)',
        red: 'var(--red)',
        green: 'var(--green)',
      },
      fontFamily: {
        mono: ['var(--font-mono)'],
        sans: ['var(--font-sans)'],
      },
      spacing: {
        grid: 'var(--grid)',
      },
    },
  },
  plugins: [],
} satisfies Config;

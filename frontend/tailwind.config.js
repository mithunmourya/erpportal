/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-raised': 'var(--paper-raised)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-dim': 'var(--accent-dim)',
        alert: 'var(--alert)',
        'alert-bg': 'var(--alert-bg)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

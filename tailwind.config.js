/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media', // Uses system preference for dark mode
  theme: {
    extend: {
      colors: {
        'ih-accent': '#C67A52',
        'ih-accent-soft': 'rgba(198, 122, 82, 0.19)',
        'ih-accent-text': '#7A3F1E',
        'ih-bg': '#FAF8F4',
        'ih-bg-dark': '#1A1918',
        'ih-border': '#E5E2DC',
        'ih-border-dark': '#3D3A37',
        'ih-border-strong': '#D0CCC4',
        'ih-border-strong-dark': '#4A4744',
        'ih-negative': '#C4574C',
        'ih-positive': '#5A9E6F',
        'ih-surface': '#FFFFFF',
        'ih-surface-dark': '#2A2826',
        'ih-surface-warm': '#F5F2EC',
        'ih-surface-warm-dark': '#322F2D',
        'ih-text': '#2C2C2C',
        'ih-text-dark': '#F5F2EC',
        'ih-text-muted': '#9A9A9A',
        'ih-text-muted-dark': '#706D68',
        'ih-text-secondary': '#6B6B6B',
        'ih-text-secondary-dark': '#A8A5A0',
      },
      fontFamily: {
        'display': ['"Dawning of a New Day"', 'cursive'],
        'sans': ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

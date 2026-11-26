/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          forest: 'rgb(var(--rgb-brand-forest) / <alpha-value>)',
          primary: 'rgb(var(--rgb-brand-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--rgb-brand-primary-hover) / <alpha-value>)',
          secondary: 'rgb(var(--rgb-brand-secondary) / <alpha-value>)',
          blush: 'rgb(var(--rgb-brand-blush) / <alpha-value>)',
          sage: 'rgb(var(--rgb-brand-sage) / <alpha-value>)',
          'sage-soft': 'rgb(var(--rgb-brand-sage-soft) / <alpha-value>)',
        },
        surface: {
          base: 'rgb(var(--rgb-bg-base) / <alpha-value>)',
          card: 'rgb(var(--rgb-bg-surface) / <alpha-value>)',
          muted: 'rgb(var(--rgb-bg-muted) / <alpha-value>)',
        },
        ink: {
          primary: 'rgb(var(--rgb-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--rgb-text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--rgb-text-muted) / <alpha-value>)',
        },
        line: {
          subtle: 'rgb(var(--rgb-border) / <alpha-value>)',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(43, 32, 36, 0.08)',
        card: '0 2px 14px -4px rgba(43, 32, 36, 0.06)',
        elevated: '0 18px 45px -18px rgba(43, 32, 36, 0.14)',
      },
      borderRadius: {
        editorial: '1.25rem',
      },
    },
  },
  plugins: [],
};

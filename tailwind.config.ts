import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef6f0',
          100: '#fdebe0',
          200: '#fad4bd',
          300: '#f6b48c',
          400: '#f18a58',
          500: '#ea6a35',
          600: '#d6511f',
          700: '#b13e19',
          800: '#8d331b',
          900: '#722c19',
        },
        pain: {
          low: '#4caf7d',
          mid: '#f0a93a',
          high: '#e5533d',
        },
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
} satisfies Config;

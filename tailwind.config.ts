import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#f7f5f2',
          raised: '#ffffff',
          sidebar: '#f0ede8',
          inset: '#ebe7e1',
          hover: '#e8e4de',
        },
        ink: {
          DEFAULT: '#1c1917',
          secondary: '#57534e',
          muted: '#a8a29e',
          faint: '#d6d3d1',
        },
        accent: {
          50: '#fdf4ef',
          100: '#f9e8de',
          200: '#f2d0bd',
          300: '#e8ad8a',
          400: '#d98a62',
          500: '#c96442',
          600: '#b55638',
          700: '#96452d',
          800: '#7a3a28',
          900: '#653224',
        },
        brand: {
          50: '#fdf4ef',
          100: '#f9e8de',
          300: '#e8ad8a',
          400: '#d98a62',
          500: '#c96442',
          600: '#b55638',
          700: '#96452d',
          800: '#7a3a28',
          900: '#653224',
          950: '#3d1e14',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.04), 0 4px 16px rgba(28, 25, 23, 0.06)',
        'card-hover': '0 2px 4px rgba(28, 25, 23, 0.06), 0 8px 24px rgba(28, 25, 23, 0.08)',
        sidebar: '1px 0 0 #e8e4df',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      minHeight: {
        dvh: '100dvh',
      },
      height: {
        dvh: '100dvh',
      },
      padding: {
        safe: 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}

export default config

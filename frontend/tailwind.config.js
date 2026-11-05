/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        background: {
          dark: '#0a0a0b',
          darkSecondary: '#111113',
          darkTertiary: '#18181b',
        },
        surface: {
          dark: '#1c1c1f',
          darkSecondary: '#27272a',
        },
        border: {
          dark: '#27272a',
          darkSecondary: '#3f3f46',
        },
        text: {
          darkPrimary: '#fafafa',
          darkSecondary: '#a1a1aa',
          darkTertiary: '#71717a',
        },
        accent: {
          primary: '#6366f1',
          primaryHover: '#4f46e5',
          secondary: '#8b5cf6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

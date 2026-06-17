/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffaf0',
          100: '#f9f0d2',
          200: '#f1df9a',
          300: '#e5c76b',
          400: '#d4af37',
          500: '#b98f25',
          600: '#98701f',
          700: '#78571e',
          800: '#5f461d',
          900: '#1e1e1e',
        },
        pink: {
          50: '#fffaf0',
          100: '#f9f0d2',
          200: '#f1df9a',
          300: '#e5c76b',
          400: '#d4af37',
          500: '#b98f25',
          600: '#98701f',
          700: '#78571e',
          800: '#5f461d',
          900: '#1e1e1e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        premium: '0 18px 45px rgba(30, 30, 30, 0.10)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#fce4ec',
          lavender: '#f3e8ff',
          blue: '#e0f2fe',
          cream: '#fef3c7',
          gray: '#f3f4f6',
          darkPink: '#f472b6',
          darkLavender: '#a855f7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        navy: {
          700: '#1b2a4a',
          800: '#14213d',
          900: '#0b1329',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        }
      }
    },
  },
  plugins: [],
}

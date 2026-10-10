/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lake: { 50: '#e8f7f7', 100: '#c6ecec', 200: '#93dada', 300: '#57c2c3', 400: '#24a5a8', 500: '#0e8a8f', 600: '#0e7c86', 700: '#0f5f68', 800: '#124d55', 900: '#123f47' },
        terra: { 400: '#e0784f', 500: '#d0603a', 600: '#b14a2a' },
        sun: { 400: '#f2b84b', 500: '#e5a12b' },
        ink: { 50: '#f6f7f5', 100: '#eceee9', 200: '#d9ddd5', 300: '#b5bcb0', 400: '#8a9385', 500: '#646d60', 600: '#4b5348', 700: '#353b33', 800: '#22271f', 900: '#161a14', 950: '#0d100b' },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          900: '#1B4332',
          800: '#2D6A4F',
          600: '#40916C',
          400: '#52B788',
          100: '#D8F3DC',
        },
      },
    },
  },
  plugins: [],
}

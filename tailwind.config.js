/** @type {import('tailwindcss').Config} */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#5C5BF0',
        'secondary': '#F5F5FA',
        'tint': '#E6E5FF',
        'dark-gray': '#8D8D8F',
        'light-gray': '#ECECF3',
        'black50': '#C7C7C7'
      },
    },
  },
  plugins: [],
}
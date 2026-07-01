/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EEF6FF",
          100: "#DAE9FF",
          200: "#B5D6FF",
          300: "#7BB8FF",
          400: "#479CFC",
          500: "#0A63E0",
          600: "#084FC0",
          700: "#063D9F",
          800: "#04317F",
          900: "#02255F",
          950: "#01133F",
        },
      },
    },
  },
  plugins: [],
};

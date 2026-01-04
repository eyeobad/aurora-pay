/** @type {import('tailwindcss').Config} */
const nativewindPreset = require("nativewind/preset");

module.exports = {
  presets: [nativewindPreset],
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}

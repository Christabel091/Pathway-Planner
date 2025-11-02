/** @type {import('tailwindcss').Config} */

export default {
  prefix: "tw-",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // keep your sand/blush/cocoa/accent if you want, but we'll use these new warms
        parchment: { 50: "#f9f6f1", 100: "#f5ece5" }, // aliases if you like
        clay: {
          // beige ↔ terracotta family for headers/buttons/text
          200: "#ebc3b2",
          300: "#e7b19d", // you already use this
          400: "#d8a48f",
          600: "#a96c56",
          700: "#8a5645",
        },
        amberwarm: {
          // golden progress tones (reads as “progress” but stays warm)
          300: "#f4c191",
          500: "#e0a872",
          600: "#c98d57",
          700: "#b57445",
        },
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

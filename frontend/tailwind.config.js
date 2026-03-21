/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#04080F",
          900: "#080E1A",
          800: "#0C1426",
          700: "#111D33",
          600: "#162440",
        },
        gold: {
          300: "#E8D5A3",
          400: "#D4B87A",
          500: "#C9A96E",
          600: "#B8934A",
          700: "#9A7A38",
        },
        cream: {
          50: "#FDFAF4",
          100: "#FAF5E9",
          200: "#F5EDDA",
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'DM Serif Display'", "Georgia", "serif"],
      },
      letterSpacing: {
        widest: "0.2em",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

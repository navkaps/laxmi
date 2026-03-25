/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Light backgrounds
        navy: {
          950: "#FFFFFF",
          900: "#F6F8FA",
          800: "#EEF1F5",
          700: "#E4E8EF",
          600: "#D1D9E0",
        },
        // Indigo accent
        gold: {
          300: "#9D98FF",
          400: "#7C75FF",
          500: "#635BFF",
          600: "#4B44CC",
          700: "#3830A3",
        },
        // Text — dark navy
        cream: {
          50:  "#0A2540",
          100: "#1a3a5c",
          200: "#536178",
        },
        // Keep these for error states only
        violet: {
          400: "#A78BFA",
          500: "#8B5CF6",
        },
        rose: {
          400: "#FB7185",
          500: "#F43F5E",
        },
        amber: {
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.2em",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        shimmer: "shimmer 2s infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
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
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
  plugins: [],
};

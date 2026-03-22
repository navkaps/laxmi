/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep purple-black backgrounds
        navy: {
          950: "#07071A",
          900: "#0B0B24",
          800: "#10102E",
          700: "#15153A",
          600: "#1A1A4A",
        },
        // Electric indigo — primary UI accent
        gold: {
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        // Text / cream → clean white-grey
        cream: {
          50: "#FFFFFF",
          100: "#F1F5F9",
          200: "#CBD5E1",
        },
        // Violet for gradient mid
        violet: {
          400: "#A78BFA",
          500: "#8B5CF6",
        },
        // Rose for gradient end + danger
        rose: {
          400: "#FB7185",
          500: "#F43F5E",
        },
        // Warm amber — used ONLY for financial numbers/data
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

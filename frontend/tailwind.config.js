/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // True black backgrounds
        navy: {
          950: "#080808",
          900: "#0F0F0F",
          800: "#171717",
          700: "#1F1F1F",
          600: "#272727",
        },
        // Warm gold — primary accent
        gold: {
          300: "#EDD28A",
          400: "#D4A843",
          500: "#C9A96E",
          600: "#A07A35",
          700: "#7A5A22",
        },
        // Text
        cream: {
          50: "#FFFFFF",
          100: "#F5F0E8",
          200: "#C8BEA8",
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

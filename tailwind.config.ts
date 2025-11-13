import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Sora'", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          orange: "#ff6b1a",
          electric: "#ff8a3d",
          focus: "#ffba66"
        },
        slate: {
          950: "#090b16"
        }
      },
      boxShadow: {
        glow: "0 0 45px rgba(255, 122, 41, 0.35)"
      },
      backgroundImage: {
        "grid-dark":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)"
      },
      animation: {
        "pulse-slow": "pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-soft": "float-soft 8s ease-in-out infinite"
      },
      keyframes: {
        "float-soft": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" }
        }
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};

export default config;


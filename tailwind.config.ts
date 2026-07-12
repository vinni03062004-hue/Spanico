import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#070b12",
        surface: "#0d1420",
        surface2: "#131c2b",
        line: "#1e2a3d",
        primary: "#38e1ff",
        primary2: "#00b3ff",
        accent: "#7c5cff",
        good: "#3ddc97",
        warn: "#ffcf5c",
        bad: "#ff5c7c",
        muted: "#7d8aa0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(56,225,255,0.45)",
        glowAccent: "0 0 40px -8px rgba(124,92,255,0.5)",
      },
      keyframes: {
        pulseCore: {
          "0%,100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.06)", opacity: "1" },
        },
        spinSlow: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        pulseCore: "pulseCore 2.6s ease-in-out infinite",
        spinSlow: "spinSlow 18s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

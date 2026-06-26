import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        barrel: "#2A1810",
        oak: "#3B2417",
        amber: "#C47A2C",
        gold: "#D8A24A",
        caramel: "#B86B2B",
        parchment: "#F7EFE2",
        tan: "#E8D2B0",
        copper: "#A85D32",
        smoke: "#6F6258"
      },
      fontFamily: {
        sans: ["Inter", "Avenir Next", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Georgia", "Cambria", "serif"]
      },
      boxShadow: {
        vault: "0 20px 60px rgba(42, 24, 16, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#1F2A33",
        amber: "#D8871C",
        lightAmber: "#F2B24A",
        cream: "#F7F3EE",
        slate: "#69727A",
        border: "#E6E1D6",
        barrel: "#1F2A33",
        oak: "#1F2A33",
        gold: "#F2B24A",
        caramel: "#D8871C",
        parchment: "#F7F3EE",
        tan: "#E6E1D6",
        copper: "#D8871C",
        smoke: "#69727A"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Manrope", "Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        vault: "0 2px 8px rgba(31, 42, 51, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;

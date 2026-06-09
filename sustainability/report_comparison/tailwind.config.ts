import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0faf4",
          100: "#d8f3e3",
          200: "#b3e6ca",
          300: "#7dd0a8",
          400: "#45b282",
          500: "#259466",
          600: "#187550",
          700: "#145e41",
          800: "#124b35",
          900: "#103e2d",
          950: "#082318",
        },
        slate: {
          850: "#1a2332",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

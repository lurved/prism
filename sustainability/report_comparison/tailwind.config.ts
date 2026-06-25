import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Editorial paper theme (design handoff) ──
        paper: "#F6F3EC",
        card: "#FCFAF5",
        ink: "#232019",
        ink2: "#3C382F",
        ink3: "#4A463E",
        body: "#5A554B",
        muted: "#6B665C",
        muted2: "#9A9489",
        muted3: "#A8A294",
        nd: "#BBB5A8",
        hairline: "#E4DECF",
        hairline2: "#EFEADD",
        hairline3: "#E7E1D3",
        chip: "#EFEADD",
        track: "#EAE4D6",
        good: "#3F7A52",
        // Company accents
        sc: "#B4722E",   // Sembcorp — ochre
        sm: "#B0473D",   // SMRT — clay red (also section kicker red)
        st: "#2D6E87",   // Singtel — teal
        // Light header tints (on ink)
        "sc-tint": "#D69A60",
        "sm-tint": "#D98276",
        "st-tint": "#6FAFC6",
      },
      fontFamily: {
        serif: ["Spectral", "Georgia", "serif"],
        sans: ["Archivo", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;

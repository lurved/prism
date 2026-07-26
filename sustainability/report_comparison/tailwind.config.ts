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
        // ── pris.la navy design system (mapped from tokens/colors.css) ──
        // Names kept from the original editorial theme; values re-pointed at
        // the navy tokens so every existing utility class inherits the system.
        // Polarity flips: paper/card are now dark surfaces, ink is light text.
        paper: "#262a4f",       // --bg — page background
        card: "#2e3360",        // --surface-card — raised surfaces
        ink: "#ecebf3",         // --ink — primary text / headlines
        ink2: "#dcdbe8",        // stepped-down heading
        ink3: "#cbcadd",
        body: "#b9b8cd",        // long-form body text
        muted: "#9897b7",       // --soft — secondary text
        muted2: "#807f9f",
        muted3: "#6f6e8f",
        nd: "#5b5a7a",          // faintest text (n/d)
        hairline: "#393d63",    // --line — borders, dividers
        hairline2: "#313457",
        hairline3: "#444876",
        chip: "#2e3360",
        track: "#393d63",       // chart track / bar background
        good: "#2faa5c",        // --ok
        // The single brand accent (pink) for primary UI affordances.
        accent: "#f0a8b8",      // --accent
        onaccent: "#262a4f",    // --on-accent — text/icons on an accent fill
        // Company accents — functional data-viz identity, from the design
        // system's categorical viz palette (tuned for ≥4.5:1 on navy so they
        // also work as text: sc/sm double as caution / section-kicker colours).
        sc: "#E39A4D",   // Sembcorp — amber (viz-amber)
        sm: "#EA7267",   // SMRT — red (viz-red, also section kicker)
        st: "#52A8C4",   // Singtel — teal (viz-teal)
        "sc-tint": "#E39A4D",
        "sm-tint": "#EA7267",
        "st-tint": "#52A8C4",
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["'Hanken Grotesk'", "system-ui", "sans-serif"],
        mono: ["'Space Mono'", "ui-monospace", "monospace"],
      },
      maxWidth: {
        page: "1180px",
      },
    },
  },
  plugins: [],
};

export default config;

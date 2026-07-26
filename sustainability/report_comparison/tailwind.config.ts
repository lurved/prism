import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Colours reference the CSS custom properties declared once in
      // globals.css (:root), which mirror the pris.la design system.
      // No hex lives here — re-theme in globals.css and every utility follows.
      colors: {
        paper: "var(--bg)",
        card: "var(--surface-card)",
        ink: "var(--ink)",
        ink2: "var(--ink-2)",
        ink3: "var(--ink-3)",
        body: "var(--body)",
        muted: "var(--soft)",
        muted2: "var(--muted-2)",
        muted3: "var(--muted-3)",
        nd: "var(--nd)",
        hairline: "var(--line)",
        hairline2: "var(--line-2)",
        hairline3: "var(--line-3)",
        chip: "var(--chip)",
        track: "var(--track)",
        good: "var(--ok)",
        accent: "var(--accent)",
        onaccent: "var(--on-accent)",
        // Company accents — the design system's categorical viz palette.
        sc: "var(--viz-amber)",   // Sembcorp
        sm: "var(--viz-red)",     // SMRT (also section kicker)
        st: "var(--viz-teal)",    // Singtel
        "sc-tint": "var(--viz-amber)",
        "sm-tint": "var(--viz-red)",
        "st-tint": "var(--viz-teal)",
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

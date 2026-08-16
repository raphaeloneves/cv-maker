/** Tailwind theme extension mapping directly onto the CSS custom properties
 * in src/styles/tokens.css — that file is the single source of truth for
 * brand values; this config just exposes them as Tailwind utilities
 * (bg-surface-page, text-heading, font-display, etc). Do not hardcode hex
 * values here — reference the CSS variable instead. */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        "navy-deep": "var(--navy-deep)",
        "navy-mid": "var(--navy-mid)",
        "navy-light": "var(--navy-light)",
        orange: "var(--orange)",
        "orange-warm": "var(--orange-warm)",
        ice: "var(--ice)",
        muted: "var(--muted)",
        "surface-page": "var(--surface-page)",
        "surface-card": "var(--surface-card)",
        "surface-sunken": "var(--surface-sunken)",
        heading: "var(--text-heading)",
        body: "var(--text-body)",
        "text-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        danger: "var(--danger)",
        success: "var(--success)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
      },
      letterSpacing: {
        tight: "var(--tracking-tight)",
        tighter: "var(--tracking-tighter)",
        wide: "var(--tracking-wide)",
        widest: "var(--tracking-widest)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      transitionDuration: {
        fast: "150ms",
        standard: "250ms",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
      },
    },
  },
  plugins: [],
};

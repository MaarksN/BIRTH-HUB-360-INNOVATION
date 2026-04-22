const config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      backgroundImage: {
        "glass-grow":
          "linear-gradient(140deg, var(--gradient-start) 0%, var(--gradient-mid) 42%, var(--gradient-end) 100%)"
      },
      boxShadow: {
        glass: "var(--shadow-glass)",
        grow: "var(--shadow-grow)"
      },
      colors: {
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        border: "var(--border)",
        muted: "var(--muted)",
        panel: "var(--surface-panel)",
        surface: "var(--surface)",
        text: "var(--text)"
      },
      fontFamily: {
        display: ["var(--font-outfit)", "Outfit", "var(--font-sans)"],
        sans: ["var(--font-inter)", "Inter", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"]
      }
    }
  }
};

export default config;

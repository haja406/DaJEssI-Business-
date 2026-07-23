import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1.5rem" },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        brand: { DEFAULT: "#1F4E3D", dark: "#153629", light: "#2E7D5B", pale: "hsl(var(--brand-pale))" },
        gold: { DEFAULT: "#C9A227", light: "#E6C558", pale: "hsl(var(--gold-pale))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
      },
      borderRadius: { lg: "0.75rem", md: "0.5rem", sm: "0.375rem" },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: { card: "0 1px 2px 0 rgba(15,45,34,0.06), 0 1px 3px 0 rgba(15,45,34,0.08)" },
    },
  },
  plugins: [],
};
export default config;

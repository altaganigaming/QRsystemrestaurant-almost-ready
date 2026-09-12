import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "rgb(var(--c-primary) / <alpha-value>)",
        brand2: "rgb(var(--c-secondary) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        ink: "rgb(var(--c-text) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
export default config;

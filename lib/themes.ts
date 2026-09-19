import { hexToRgbVar } from "./utils";

export interface ThemeColors { primary: string; secondary: string; accent: string; surface: string; text: string; }

export const THEMES: { id: string; name: string; colors: ThemeColors }[] = [
  { id: "classic",   name: "Classic Ember",  colors: { primary: "#c2410c", secondary: "#431407", accent: "#f59e0b", surface: "#fff7ed", text: "#1c1917" } },
  { id: "forest",    name: "Forest Green",   colors: { primary: "#15803d", secondary: "#052e16", accent: "#84cc16", surface: "#f0fdf4", text: "#0c0a09" } },
  { id: "ocean",     name: "Ocean Blue",     colors: { primary: "#0369a1", secondary: "#082f49", accent: "#22d3ee", surface: "#f0f9ff", text: "#0f172a" } },
  { id: "royal",     name: "Royal Indigo",   colors: { primary: "#4f46e5", secondary: "#1e1b4b", accent: "#f472b6", surface: "#eef2ff", text: "#111827" } },
  { id: "rose",      name: "Rose Wine",      colors: { primary: "#be123c", secondary: "#4c0519", accent: "#fb923c", surface: "#fff1f2", text: "#1c1917" } },
  { id: "charcoal",  name: "Charcoal Gold",  colors: { primary: "#b45309", secondary: "#0a0a0a", accent: "#eab308", surface: "#fafaf9", text: "#18181b" } },
];

export function resolveTheme(themeId: string, custom: ThemeColors | null): ThemeColors {
  const fallback = THEMES.find((t) => t.id === themeId)?.colors ?? THEMES[0].colors;
  if (!custom || typeof custom !== "object") return fallback;
  return {
    primary: safeColor(custom.primary, fallback.primary),
    secondary: safeColor(custom.secondary, fallback.secondary),
    accent: safeColor(custom.accent, fallback.accent),
    surface: safeColor(custom.surface, fallback.surface),
    text: safeColor(custom.text, fallback.text),
  };
}

function safeColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function themeStyleVars(c: ThemeColors): Record<string, string> {
  return {
    "--c-primary": hexToRgbVar(c.primary),
    "--c-secondary": hexToRgbVar(c.secondary),
    "--c-accent": hexToRgbVar(c.accent),
    "--c-surface": hexToRgbVar(c.surface),
    "--c-text": hexToRgbVar(c.text),
  };
}

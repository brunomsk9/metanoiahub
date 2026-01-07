// Harmonized chart palette - lime/dark theme aligned
// Use these colors consistently across all charts and reports

export const CHART_COLORS = {
  lime: "hsl(78 80% 48%)",        // Primary lime (matches theme)
  teal: "hsl(168 65% 45%)",       // Complementary teal
  cyan: "hsl(188 75% 48%)",       // Fresh cyan
  violet: "hsl(265 55% 55%)",     // Soft violet
  rose: "hsl(340 65% 55%)",       // Muted rose
  emerald: "hsl(152 60% 42%)",    // Deep emerald
  sky: "hsl(200 70% 50%)",        // Cool sky
  mint: "hsl(160 50% 50%)",       // Soft mint
} as const;

export const CHART_COLORS_ARRAY = Object.values(CHART_COLORS);

// Semantic color mappings for common chart use cases
export const CHART_SEMANTIC = {
  primary: CHART_COLORS.lime,
  secondary: CHART_COLORS.teal,
  tertiary: CHART_COLORS.cyan,
  success: CHART_COLORS.emerald,
  info: CHART_COLORS.sky,
  warning: CHART_COLORS.mint,
  accent: CHART_COLORS.violet,
  highlight: CHART_COLORS.rose,
} as const;

// Gradient stops for chart fills
export const CHART_GRADIENTS = {
  lime: { start: CHART_COLORS.lime, end: "hsl(78 80% 35%)" },
  teal: { start: CHART_COLORS.teal, end: "hsl(168 65% 32%)" },
  cyan: { start: CHART_COLORS.cyan, end: "hsl(188 75% 35%)" },
  violet: { start: CHART_COLORS.violet, end: "hsl(265 55% 40%)" },
  rose: { start: CHART_COLORS.rose, end: "hsl(340 65% 40%)" },
  emerald: { start: CHART_COLORS.emerald, end: "hsl(152 60% 30%)" },
  sky: { start: CHART_COLORS.sky, end: "hsl(200 70% 38%)" },
  mint: { start: CHART_COLORS.mint, end: "hsl(160 50% 38%)" },
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;

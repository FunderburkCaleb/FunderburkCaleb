/**
 * Visual tokens — the console design system, executable.
 * Source of truth: github-profile-spec.md §2.2 (palette) + §4 (domain accent map).
 * Every generated SVG is themed exclusively from these values.
 */

export type ThemeName = "dark" | "light";
export type Domain =
  | "copilot-studio"
  | "mcp"
  | "foundry"
  | "cowork"
  | "architecture"
  | "field-notes";

export interface Theme {
  /** Panel background — one shade off GitHub's canvas so panels read as inset "screens". */
  panel: string;
  /** Page/console background (matches calebfunderburk.com theme in dark). */
  bg: string;
  /** Primary readable text. */
  text: string;
  /** De-emphasized text (metadata, forks, planned). */
  muted: string;
  /** 1px hairline border on panels. */
  border: string;
  /** Status: active. */
  green: string;
  /** Status: building / in-progress. */
  amber: string;
  /** Default console accent. */
  accent: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    bg: "#0A0F1C", // exactly calebfunderburk.com's theme color
    panel: "#0E1424",
    text: "#E6EDF3",
    muted: "#7D8590",
    border: "#1E2637",
    green: "#3FB950",
    amber: "#D29922",
    accent: "#58A6FF",
  },
  light: {
    bg: "#FFFFFF",
    panel: "#F6F8FA",
    text: "#1F2328",
    muted: "#59636E",
    border: "#D1D9E0",
    green: "#1A7F37",
    amber: "#9A6700",
    accent: "#0969DA",
  },
};

/** Per-domain accent tint on the status rail (§4). Encodes the content taxonomy. */
export const DOMAIN_ACCENT: Record<Domain, string> = {
  "copilot-studio": "#58A6FF", // accent blue
  mcp: "#39C5CF", // teal
  foundry: "#BC8CFF", // violet
  cowork: "#3FB950", // green
  architecture: "#D29922", // amber
  "field-notes": "#7D8590", // muted
};

/** Two type roles only — console chrome (mono) + human-readable capability lines. */
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
export const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Total README image-weight budget (§5 P0). */
export const IMAGE_BUDGET_BYTES = 400 * 1024;

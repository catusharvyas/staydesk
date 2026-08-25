/**
 * The eight accent presets a property can choose from.
 *
 * The actual colour values live in globals.css, one `[data-theme="key"]`
 * block each — this module carries only the key, the label, and a swatch
 * hex for the picker UI (which has to show every option at once, so it
 * can't read the single active `--primary`).
 *
 * Why eight, and why these: `--primary-foreground` is near-white in both
 * light and dark mode, so every accent has to stay dark enough for white
 * button text to clear WCAG AA (4.5:1). At that lightness sRGB can't
 * produce a vivid teal, cyan or yellow — they come out muddy or khaki.
 * Green, amber and red *are* attainable but are deliberately left out:
 * they already mean available / reserved / maintenance on the room board,
 * and red is also `--destructive`. See 0011_property_theme.sql.
 *
 * Keys here must stay in sync with the CHECK constraint on
 * `properties.theme` and the CSS blocks in globals.css.
 */

export const THEME_PRESETS = [
  { key: "blue", label: "Blue", swatch: "#155dfc", note: "Default" },
  { key: "sky", label: "Sky", swatch: "#007aaa", note: "Calmer" },
  { key: "indigo", label: "Indigo", swatch: "#6c45f5", note: "Deep" },
  { key: "violet", label: "Violet", swatch: "#8a35e6", note: "Warm purple" },
  { key: "purple", label: "Purple", swatch: "#aa1dc6", note: "Bold" },
  { key: "magenta", label: "Magenta", swatch: "#c0009a", note: "Vivid" },
  { key: "rose", label: "Rose", swatch: "#c90077", note: "Boutique" },
  { key: "neutral", label: "Neutral", swatch: "#2c2c2a", note: "No accent" },
] as const;

export type ThemeKey = (typeof THEME_PRESETS)[number]["key"];

export const DEFAULT_THEME: ThemeKey = "blue";

const KEYS = new Set<string>(THEME_PRESETS.map((t) => t.key));

/**
 * Narrows an arbitrary string (a DB value, a form field) to a known preset,
 * falling back to the default. Nothing unvalidated should ever reach the
 * `data-theme` attribute — that attribute selects a CSS block, and an
 * unknown value would silently render the app unthemed.
 */
export function resolveTheme(value: string | null | undefined): ThemeKey {
  return value && KEYS.has(value) ? (value as ThemeKey) : DEFAULT_THEME;
}

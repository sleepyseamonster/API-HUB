export const palette = {
  appBg: "#121212",
  panel: "#1A1A1A",
  accent: "#25A9BF",
  text: "#EDEDED",
} as const;

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const safeAlpha = Math.max(0, Math.min(1, alpha));

  if (normalized.length !== 6) {
    return hex;
  }

  const alphaHex = Math.round(safeAlpha * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${normalized}${alphaHex}`;
}

import type { Grade } from "@/types/scanner";

export type BadgeStyle = "flat" | "flat-square";

interface BadgeOptions {
  readonly grade: Grade;
  readonly label?: string;
  readonly style?: BadgeStyle;
}

const GRADE_COLORS: Record<Grade, string> = {
  A: "#047857",
  B: "#4d7c0f",
  C: "#a16207",
  D: "#c2410c",
  F: "#b91c1c",
};

const LABEL_BG = "#555";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function measureText(text: string): number {
  return text.length * 6.5 + 10;
}

export function generateBadgeSvg({
  grade,
  label = "SupaScanner",
  style = "flat",
}: BadgeOptions): string {
  const valueText = `Grade ${grade}`;
  const labelWidth = measureText(label);
  const valueWidth = measureText(valueText);
  const totalWidth = labelWidth + valueWidth;
  const height = 20;
  const valueColor = GRADE_COLORS[grade];
  const borderRadius = style === "flat-square" ? 0 : 3;

  const escapedLabel = escapeXml(label);
  const escapedValue = escapeXml(valueText);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">`,
    style === "flat"
      ? `  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`
      : "",
    `  <clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="${borderRadius}" fill="#fff"/></clipPath>`,
    `  <g clip-path="url(#r)">`,
    `    <rect width="${labelWidth}" height="${height}" fill="${LABEL_BG}"/>`,
    `    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${valueColor}"/>`,
    style === "flat"
      ? `    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>`
      : "",
    `  </g>`,
    `  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">`,
    `    <text x="${labelWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${escapedLabel}</text>`,
    `    <text x="${labelWidth / 2}" y="13">${escapedLabel}</text>`,
    `    <text x="${labelWidth + valueWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${escapedValue}</text>`,
    `    <text x="${labelWidth + valueWidth / 2}" y="13">${escapedValue}</text>`,
    `  </g>`,
    `</svg>`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function generateFallbackBadgeSvg(
  label: string = "SupaScanner",
  style: BadgeStyle = "flat",
): string {
  const valueText = "unknown";
  const labelWidth = measureText(label);
  const valueWidth = measureText(valueText);
  const totalWidth = labelWidth + valueWidth;
  const height = 20;
  const borderRadius = style === "flat-square" ? 0 : 3;

  const escapedLabel = escapeXml(label);
  const escapedValue = escapeXml(valueText);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">`,
    style === "flat"
      ? `  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`
      : "",
    `  <clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="${borderRadius}" fill="#fff"/></clipPath>`,
    `  <g clip-path="url(#r)">`,
    `    <rect width="${labelWidth}" height="${height}" fill="${LABEL_BG}"/>`,
    `    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="#9e9e9e"/>`,
    style === "flat"
      ? `    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>`
      : "",
    `  </g>`,
    `  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">`,
    `    <text x="${labelWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${escapedLabel}</text>`,
    `    <text x="${labelWidth / 2}" y="13">${escapedLabel}</text>`,
    `    <text x="${labelWidth + valueWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${escapedValue}</text>`,
    `    <text x="${labelWidth + valueWidth / 2}" y="13">${escapedValue}</text>`,
    `  </g>`,
    `</svg>`,
  ]
    .filter(Boolean)
    .join("\n");
}

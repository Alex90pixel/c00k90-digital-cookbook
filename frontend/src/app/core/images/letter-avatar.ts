/** A round green badge with the first letter of a name, as an SVG data URL. */
export function letterAvatar(name: string): string {
  const letter = (name.trim().charAt(0) || '?').toUpperCase().replace(/[<>&"']/g, '');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#2E8F72"/>` +
    `<text x="32" y="41" font-family="sans-serif" font-size="28" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const loaded = new Set<string>();

export function familyFor(fontId: string): string {
  return `picpic-${fontId}`;
}

export function ensureFontFace(fontId: string, url: string): string {
  const family = familyFor(fontId);
  if (typeof document === "undefined") return family;
  if (loaded.has(family)) return family;
  loaded.add(family);

  const style = document.createElement("style");
  style.setAttribute("data-picpic-font", fontId);
  style.textContent = `@font-face {
  font-family: "${family}";
  src: url("${url}");
  font-display: swap;
}`;
  document.head.appendChild(style);

  return family;
}

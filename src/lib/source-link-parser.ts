function decodeAmpEntities(value: string) {
  let output = value;
  for (let pass = 0; pass < 5; pass += 1) {
    const decoded = output.replace(/&amp;/gi, "&");
    if (decoded === output) break;
    output = decoded;
  }
  return output;
}

export function parseSourceLinks(value: unknown, maximum = 8) {
  const joined = Array.isArray(value) ? value.map(String).join("\n") : String(value || "");
  const normalized = decodeAmpEntities(joined)
    .replace(/\s*&\s*(?=https?:\/\/)/gi, "\n")
    .replace(/[|،]+(?=\s*https?:\/\/)/gi, "\n");
  const matches = normalized.match(/https?:\/\/[^\s<>"'()[\]]+/gi) || [];
  const links: string[] = [];
  for (const match of matches) {
    const cleaned = match.replace(/[.,;،]+$/g, "");
    try {
      const url = new URL(cleaned);
      if ((url.protocol === "http:" || url.protocol === "https:") && !links.includes(url.toString())) {
        links.push(url.toString());
      }
    } catch {
      // Ignore malformed fragments around links copied from rich text or Markdown.
    }
    if (links.length >= maximum) break;
  }
  return links;
}

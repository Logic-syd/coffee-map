export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0x60),
    )
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}ー]/gu, "");
}
export function matchesText(value: string | undefined, query: string): boolean {
  const normalized = normalizeSearchText(query);
  return Boolean(
    normalized && value && normalizeSearchText(value).includes(normalized),
  );
}

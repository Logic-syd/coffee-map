export function isImageSource(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//") && !src.includes("\\"))
    return true;
  try {
    const url = new URL(src);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

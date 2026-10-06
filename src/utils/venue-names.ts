import { VENUE_NAME_LOCALIZATIONS } from "../data/venue-name-localizations.ts";
type Names = { zh?: string; en?: string; ja?: string; ko?: string };
export function isLatinOriginal(name?: string): boolean {
  return Boolean(
    name &&
      /[a-z]/i.test(name) &&
      !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(
        name,
      ),
  );
}
export function localizeVenueNames(id: string, source: Names): Names {
  if (isLatinOriginal(source.zh))
    return { ...source, en: source.zh, ja: source.zh, ko: source.zh };
  const patch = VENUE_NAME_LOCALIZATIONS.find(
    (item) => item.id === id && item.original === source.zh,
  );
  if (!patch) return { ...source };
  const result = { ...source };
  for (const language of ["en", "ja", "ko"] as const) {
    const display = patch.display as Partial<Record<typeof language, string>>;
    if (source[language] === patch.source[language] && display[language])
      result[language] = display[language];
  }
  return result;
}

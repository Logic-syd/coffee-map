import { localizeVenueNames } from "./venue-names.ts";
import type { Venue } from "../types/venue";
import { isCoordinates } from "./location.ts";
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : undefined;
export function parseVenues(rows: unknown): Venue[] {
  if (!Array.isArray(rows)) throw new Error("Invalid venue response");
  const venues: Venue[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object" || !text(row.id) || !isCoordinates(row))
      continue;
    const v = row as Record<string, unknown> & { lat: number; lng: number };
    const sourceNames = {
      zh: text(v.name_zh),
      en: text(v.name_eng),
      ja: text(v.name_ja),
      ko: text(v.name_ko),
    };
    venues.push({
      id: text(v.id)!,
      address: text(v.address) || "",
      lat: v.lat,
      lng: v.lng,
      image_url: text(v.image_url),
      contacts: text(v.tel) ? { tel: text(v.tel) } : undefined,
      hours: v.hours_json as Venue["hours"],
      serving: strings(v.serving),
      services: strings(v.services),
      tags: strings(v.tags),
      created_at: text(v.created_at),
      updated_at: text(v.updated_at),
      name: localizeVenueNames(text(v.id)!, sourceNames),
      searchNames: Object.values(sourceNames).filter((name): name is string =>
        Boolean(name),
      ),
    });
  }
  if (rows.length && !venues.length) throw new Error("No usable venue records");
  return venues;
}

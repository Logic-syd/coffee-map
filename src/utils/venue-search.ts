import type { Venue } from "../types/venue";
import { VENUE_FEATURES, matchesFeatureSearch } from "../lib/venue-features.ts";
import type { VenueFeature } from "../lib/venue-features";
import { matchesText } from "./search-text.ts";
export function matchesVenueSearch(
  venue: Venue,
  query: string,
  catalog: VenueFeature[] = VENUE_FEATURES,
): boolean {
  if (!query.trim()) return true;
  return (
    [
      ...Object.values(venue.name),
      ...(venue.searchNames || []),
      venue.address,
    ].some((value) => matchesText(value, query)) ||
    matchesFeatureSearch(venue, query, catalog)
  );
}

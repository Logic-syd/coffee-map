"use client";
import { useEffect, useState, useMemo } from "react";
import CafeCard from "@/components/CafeCard";
import BottomSheet from "@/components/BottomSheet";
import TopBar from "@/components/TopBar";
import FilterSheet from "@/components/FilterSheet";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useLocale } from "@/hooks/useLocale";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import { isOpenNow } from "@/utils/opening-hours";
import {
  withDistances,
  isWithinShanghaiCoverage,
  NEARBY_RADIUS_KM,
} from "@/utils/nearby";
import MapView from "@/components/MapView";
import { useFavoritesStore } from "@/store/favorites";
import VenueDetail from "@/components/VenueDetail";
import FilterBar from "@/components/FilterBar";
import { VENUE_FEATURES, matchesFeatureFilters } from "@/lib/venue-features";
import { loadVenueFeatureCatalog } from "@/lib/venue-feature-catalog";
import { matchesVenueSearch } from "@/utils/venue-search";
import { useVenues } from "@/lib/useVenues";
import { t, venueName } from "@/lib/i18n";
export type { Venue } from "@/types/venue";
const buttonClass =
  "min-h-11 rounded-full bg-white px-4 py-2 text-sm font-medium text-inkblack shadow-sm";
export default function HomePage() {
  const locale = useLocale();
  const now = useMinuteClock();
  const { venues, loading, error, retry } = useVenues();
  const [catalog, setCatalog] = useState(VENUE_FEATURES);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    void loadVenueFeatureCatalog(controller.signal)
      .then(({ features }) => {
        if (live) setCatalog(features);
      })
      .catch(() => {
        /* Bundled catalog works while the optional cloud catalog is unavailable. */
      })
      .finally(() => clearTimeout(timer));
    return () => {
      live = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mapMode, setMapMode] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, boolean>
  >({});
  const {
    status: locStatus,
    coords: userCoords,
    request: requestLocation,
  } = useUserLocation();
  const [browseAll, setBrowseAll] = useState(false);
  const inShanghai = Boolean(
    userCoords && isWithinShanghaiCoverage(userCoords),
  );
  const nearby = inShanghai && !browseAll;
  const favorites = useFavoritesStore((state) => state.favorites);
  const withDistance = useMemo(
    () => withDistances(venues, userCoords),
    [venues, userCoords],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const features = Object.keys(selectedFilters).filter(
      (key) => selectedFilters[key] && key !== "open" && key !== "favourites",
    );
    return withDistance.filter((venue) => {
      if (nearby && (venue.distanceKm ?? Infinity) > NEARBY_RADIUS_KM)
        return false;
      if (!matchesVenueSearch(venue, query, catalog)) return false;
      if (selectedFilters.favourites && !favorites.includes(venue.id))
        return false;
      if (selectedFilters.open && !isOpenNow(venue.hours, now)) return false;
      return matchesFeatureFilters(venue, features, catalog);
    });
  }, [withDistance, search, selectedFilters, nearby, catalog, favorites, now]);
  const selectedVenue = withDistance.find((venue) => venue.id === selectedId);
  const toggleFavorite = (id: string) => {
    const store = useFavoritesStore.getState();
    if (store.isFavorite(id)) store.removeFavorite(id);
    else store.addFavorite(id);
  };
  const locationKey =
    locStatus === "granted"
      ? !inShanghai
        ? "location.outside"
        : nearby
          ? "location.nearby"
          : "location.shanghai"
      : (`location.${locStatus}` as const);
  const reset = () => {
    setSearch("");
    setSelectedFilters({});
  };
  const hasFilters =
    Boolean(search.trim()) || Object.values(selectedFilters).some(Boolean);
  const stateMessage = error
    ? t("data.error", locale)
    : loading
      ? t("loading", locale)
      : !venues.length
        ? t("data.empty", locale)
        : nearby
          ? t("data.noNearby", locale)
          : t("data.noMatches", locale);
  const showState = loading || error || !filtered.length;
  return (
    <div
      className={
        mapMode ? "flex h-[100dvh] flex-col overflow-hidden" : "min-h-screen"
      }
    >
      <TopBar
        search={search}
        setSearch={setSearch}
        onMapClick={() => setMapMode((value) => !value)}
        isMapMode={mapMode}
      />
      <FilterBar
        catalog={catalog}
        selected={Object.keys(selectedFilters).filter(
          (key) => selectedFilters[key],
        )}
        setSelected={(values) =>
          setSelectedFilters(
            Object.fromEntries(values.map((key) => [key, true])),
          )
        }
        onHeartClick={() =>
          setSelectedFilters((current) => ({
            ...current,
            favourites: !current.favourites,
          }))
        }
        isFavoriteActive={Boolean(selectedFilters.favourites)}
        onFilterClick={() => setFilterOpen(true)}
      />
      <div className="shrink-0 border-b border-black/5 px-4 py-2 text-sm text-gray-700">
        <p role="status">{t(locationKey, locale)}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <button
            className={buttonClass}
            onClick={() => {
              setBrowseAll(false);
              requestLocation();
            }}
            disabled={locStatus === "loading"}
          >
            {t("action.locate", locale)}
          </button>
          {nearby && (
            <button className={buttonClass} onClick={() => setBrowseAll(true)}>
              {t("action.browseShanghai", locale)}
            </button>
          )}
          {inShanghai && browseAll && (
            <button className={buttonClass} onClick={() => setBrowseAll(false)}>
              {t("action.nearby", locale)}
            </button>
          )}
        </div>
      </div>
      {showState ? (
        <main
          className="p-6 text-center text-gray-700"
          role={error ? "alert" : "status"}
          aria-busy={loading}
        >
          <p className="mb-4">{stateMessage}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {error && (
              <button className={buttonClass} onClick={retry}>
                {t("action.retry", locale)}
              </button>
            )}
            {!error && !loading && nearby && (
              <button
                className={buttonClass}
                onClick={() => setBrowseAll(true)}
              >
                {t("action.browseShanghai", locale)}
              </button>
            )}
            {!error && !loading && hasFilters && (
              <button className={buttonClass} onClick={reset}>
                {t("action.reset", locale)}
              </button>
            )}
          </div>
        </main>
      ) : mapMode ? (
        <div className="relative min-h-0 flex-1">
          <MapView
            catalog={catalog}
            venues={filtered}
            userCoords={inShanghai ? userCoords : undefined}
            nearby={nearby}
            onShowList={() => setMapMode(false)}
          />
        </div>
      ) : (
        <main className="space-y-4 p-4 pb-24">
          {filtered.map((venue) => (
            <div
              key={venue.id}
              role="button"
              tabIndex={0}
              aria-label={venueName(venue.name, locale)}
              onClick={() => setSelectedId(venue.id)}
              onKeyDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  setSelectedId(venue.id);
                }
              }}
            >
              <CafeCard
                v={venue}
                now={now}
                isFav={favorites.includes(venue.id)}
                onToggleFav={toggleFavorite}
              />
            </div>
          ))}
        </main>
      )}
      <BottomSheet
        open={Boolean(selectedVenue)}
        onClose={() => setSelectedId(null)}
      >
        {selectedVenue && (
          <VenueDetail
            catalog={catalog}
            v={selectedVenue}
            onClose={() => setSelectedId(null)}
            distanceKm={selectedVenue.distanceKm}
          />
        )}
      </BottomSheet>
      <FilterSheet
        catalog={catalog}
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        selected={selectedFilters}
        onChange={setSelectedFilters}
      />
    </div>
  );
}

import { supabase } from "@/lib/supabase";
import { VENUE_FEATURES } from "@/lib/venue-features";
import type {
  FeatureField,
  FeatureGroup,
  VenueFeature,
} from "@/lib/venue-features";

export type CatalogRow = {
  id: string;
  group_key: FeatureGroup;
  field_key: FeatureField;
  name_zh: string;
  name_en: string;
  name_ja: string;
  name_ko: string;
  in_filters: boolean;
  in_details: boolean;
  active: boolean;
  aliases: string[];
  sort_order: number;
  revision: number;
};

export function catalogFromRows(rows: CatalogRow[]): VenueFeature[] {
  return rows.map((row) => ({
    id: row.id,
    group: row.group_key,
    field: row.field_key,
    labels: {
      "zh-CN": row.name_zh,
      en: row.name_en || row.name_zh,
      ja: row.name_ja || row.name_zh,
      ko: row.name_ko || row.name_zh,
    },
    inFilters: row.in_filters,
    inDetails: row.in_details,
    active: row.active,
    aliases: row.aliases || [],
    sortOrder: row.sort_order,
    revision: row.revision,
  }));
}

export async function loadVenueFeatureCatalog(signal?: AbortSignal) {
  const query = supabase
    .from("venue_feature_catalog")
    .select(
      "id,group_key,field_key,name_zh,name_en,name_ja,name_ko,in_filters,in_details,active,aliases,sort_order,revision",
    )
    .order("sort_order")
    .order("id");
  const { data, error } = await (signal ? query.abortSignal(signal) : query);
  if (error) throw error;
  return {
    rows: data as CatalogRow[],
    features: catalogFromRows(data as CatalogRow[]),
  };
}

export const fallbackCatalog = VENUE_FEATURES;

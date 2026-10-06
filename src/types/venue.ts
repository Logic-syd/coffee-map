import type { OpeningHours } from "@/utils/opening-hours";
export interface Venue {
  id: string;
  name: { zh?: string; en?: string; ja?: string; ko?: string };
  searchNames?: string[];
  address: string;
  lat: number;
  lng: number;
  image_url?: string;
  contacts?: {
    tel?: string;
    site?: string;
    fb?: string;
    ig?: string;
    twitter?: string;
  };
  hours?: OpeningHours;
  serving?: string[];
  services?: string[];
  tags?: string[];
  distanceKm?: number;
  created_at?: string;
  updated_at?: string;
}

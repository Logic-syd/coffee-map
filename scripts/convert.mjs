import fs from "node:fs";
import { parse } from "csv-parse/sync";
import { gzipSync } from "zlib";

const rows = parse(fs.readFileSync("data/raw.csv"), {
  columns: true,
  skip_empty_lines: true,
});

const features = rows.map((r) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [+r.lng, +r.lat] },
  properties: {
    id: r.id,
    name: {
      zh: r.name_zh || "",
      ja: r.name_ja || "",
      ko: r.name_ko || "",
      eng: r.name_eng || "",
    },
    address: r.address,
    tel: r.tel,
    categories: (r.categories || "").split(",").filter(Boolean),
    serving: (r.serving || "").split("|").filter(Boolean),
    services: (r.services || "").split("|").filter(Boolean),
    tags: (r.tags || "").split("|").filter(Boolean),
    contacts: {
      tel: r.tel || null,
      site: r.site || null,
      ig: r.ig || null,
      fb: r.fb || null,
      tel: r.tel || null,
    },
    lat: r.lat,
    lng: r.lng,
    hours: JSON.parse(r.hours_json || '{"default":[]}'),
    city: r.city,
    image_url: r.image_url || "",
  },
}));

fs.mkdirSync("public/data", { recursive: true });
// fs.writeFileSync(
//   "public/data/venues.min.json.gz",
//   gzipSync(
//     Buffer.from(JSON.stringify({ type: "FeatureCollection", features })),
//   ),
// );

fs.writeFileSync(
  "public/data/venues.min.json",
  JSON.stringify({ type: "FeatureCollection", features }),
);
console.log(`✅  ${features.length} venues exported`);

import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SB_URL, process.env.SERVICE_KEY);

await sb.from("venues").upsert(
  json.features.map((f) => ({
    id: f.properties.id,
    ...f.properties,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  })),
);

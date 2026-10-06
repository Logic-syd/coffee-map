import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local") });

async function main() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error("Missing Supabase URL or public client key in .env.local");
  const url = new URL(base);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || url.username || url.password) {
    throw new Error("Expected an HTTPS Supabase project URL without credentials");
  }
  if (!key.startsWith("sb_publishable_")) {
    let payload;
    try { payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()); }
    catch { throw new Error("Expected a publishable key or legacy anon key"); }
    if (payload.role !== "anon") throw new Error("Only public client keys are accepted; elevated keys are not used");
    if (payload.ref && payload.ref !== url.hostname.split(".")[0]) throw new Error("Key project does not match URL");
  }
  const expected = process.env.EXPECTED_VENUE_COUNT;
  if (expected !== undefined && !/^\d+$/.test(expected)) throw new Error("EXPECTED_VENUE_COUNT must be a nonnegative integer");
  const headers = { apikey: key, Prefer: "count=exact", Accept: "application/json" };
  if (!key.startsWith("sb_publishable_")) headers.Authorization = `Bearer ${key}`;
  const rows = [];
  let total;
  while (total === undefined || rows.length < total) {
    const endpoint = new URL("/rest/v1/venues", url);
    endpoint.search = new URLSearchParams({ select: "*", order: "id.asc", limit: "1000", offset: String(rows.length) }).toString();
    const response = await fetch(endpoint, { method: "GET", headers, redirect: "error", signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Read failed with HTTP ${response.status}; no database changes made`);
    const contentRange = response.headers.get("content-range") || "";
    const match = contentRange.match(/\/(\d+)$/);
    if (!match) throw new Error("Server did not return an exact row count; backup completeness cannot be checked");
    const pageTotal = Number(match[1]);
    if (total !== undefined && total !== pageTotal) throw new Error("Row count changed during export; retry against a stable dataset");
    total = pageTotal;
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error("Unexpected database response");
    if (page.length === 0 && rows.length < total) throw new Error("Export ended before all rows were received");
    rows.push(...page);
  }
  if (rows.length !== total || new Set(rows.map(row => row.id)).size !== total) throw new Error("Row count or unique IDs do not match");
  if (expected !== undefined && rows.length !== Number(expected)) {
    throw new Error(`Client can read ${rows.length} rows, but Dashboard expectation is ${expected}; verify read policies before treating this as a full backup`);
  }
  const fields = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const present = value => value !== null && value !== undefined && value !== "" &&
    (!Array.isArray(value) || value.length > 0) &&
    (typeof value !== "object" || Array.isArray(value) || Object.keys(value).length > 0);
  const coverage = Object.fromEntries(fields.map(field => [field, rows.filter(row => present(row[field])).length]));
  const data = JSON.stringify(rows, null, 2) + "\n";
  const csvCell = value => '"' + String(value == null ? "" : typeof value === "object" ? JSON.stringify(value) : value).replaceAll('"', '""') + '"';
  const csv = [fields.map(csvCell).join(","), ...rows.map(row => fields.map(field => csvCell(row[field])).join(","))].join("\r\n") + "\r\n";
  const exportedAt = new Date().toISOString();
  const directory = path.join(root, "backups", "supabase", url.hostname.split(".")[0], exportedAt.replace(/[:.]/g, "-"));
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const metadata = {
    project: url.hostname.split(".")[0], exportedAt, table: "public.venues",
    rowCount: rows.length, serverVisibleRowCount: total,
    expectedDashboardRowCount: expected === undefined ? null : Number(expected),
    sha256: createHash("sha256").update(data).digest("hex"), fields, populatedFieldCounts: coverage,
    nonemptyWeeklyHours: rows.filter(row => Array.isArray(row.hours_json?.default) && row.hours_json.default.length > 0).length,
    scope: "Rows visible to the public client key. No database schema, policies, users, or Storage files are included. No database writes were made."
  };
  await fs.writeFile(path.join(directory, "venues.json"), data, { flag: "wx", mode: 0o600 });
  await fs.writeFile(path.join(directory, "venues.csv"), "\uFEFF" + csv, { flag: "wx", mode: 0o600 });
  await fs.writeFile(path.join(directory, "metadata.json"), JSON.stringify(metadata, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  const saved = JSON.parse(await fs.readFile(path.join(directory, "venues.json"), "utf8"));
  if (saved.length !== total) throw new Error("Saved backup verification failed");
  console.log(JSON.stringify({ directory, ...metadata }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

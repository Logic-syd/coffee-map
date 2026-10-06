import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const migration = await readFile(new URL("../supabase/migrations/202610040001_photo_admin.sql", import.meta.url), "utf8");
const featureMigration = await readFile(new URL("../supabase/migrations/202610040002_venue_features.sql", import.meta.url), "utf8");
const admin = "00000000-0000-4000-8000-000000000001";
const ordinary = "00000000-0000-4000-8000-000000000002";
const venue = "00000000-0000-4000-8000-000000000010";
const secondVenue = "00000000-0000-4000-8000-000000000020";
const path = `${venue}/00000000-0000-4000-8000-000000000030.jpg`;

test("photo administration permissions and concurrency in PostgreSQL", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, storage, public to anon, authenticated;
      create table public.venues(id uuid primary key, name_zh text, image_url text, updated_at timestamptz);
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(bucket_id text, name text, primary key(bucket_id, name));
      create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1, '/') $$;
      alter table public.venues enable row level security;
      alter table storage.objects enable row level security;
      grant all on public.venues, storage.objects to anon, authenticated;
      -- Deliberately permissive legacy policies must not bypass the new restrictions.
      create policy legacy_allow_all on public.venues for all using (true) with check (true);
      create policy legacy_allow_all on storage.objects for all using (true) with check (true);
      insert into auth.users values ('${admin}'), ('${ordinary}');
      insert into public.venues values ('${venue}', 'Test cafe', null, now()), ('${secondVenue}', 'Second cafe', '', now());
    `);
    await db.exec("alter table public.venues add column serving text[], add column services text[], add column tags text[]");
    await db.exec(migration);
    const beforeInstall = (await db.query("select * from public.venues order by id")).rows;
    await db.exec(featureMigration);
    await db.exec(featureMigration);
    assert.deepEqual((await db.query("select * from public.venues order by id")).rows, beforeInstall);
    await db.exec(migration); // Installation can be repeated without removing rows or covers.
    await db.exec(`insert into coffee_private.admins(user_id) values ('${admin}')`);
    async function as(role, id, fn) {
      await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${id || ""}', false);`);
      try { return await fn(); } finally { await db.exec("reset role"); }
    }
    async function cover(previous = null, objectPath = path, id = venue) {
      return db.query("select public.set_venue_cover($1, $2, $3) as result", [id, objectPath, previous]);
    }
    await t.test("anonymous users still read venues but cannot mutate or invoke cover writes", () => as("anon", "", async () => {
      assert.equal((await db.query("select * from public.venues")).rows.length, 2);
      assert.equal((await db.query("select public.is_coffee_admin() as allowed")).rows[0].allowed, false);
      assert.equal((await db.query("update public.venues set image_url = 'bad' returning id")).rows.length, 0);
      assert.equal((await db.query("delete from public.venues returning id")).rows.length, 0);
      await assert.rejects(cover(), /permission denied/);
      await assert.rejects(db.exec(`insert into storage.objects values ('venue-photos', '${path}')`), /row-level security/);
    }));
    await t.test("ordinary authenticated users cannot self-authorize or upload", () => as("authenticated", ordinary, async () => {
      await assert.rejects(db.exec(`insert into coffee_private.admins(user_id) values ('${ordinary}')`), /permission denied/);
      await assert.rejects(cover(), /ADMIN_REQUIRED/);
      await assert.rejects(db.exec(`insert into storage.objects values ('venue-photos', '${path}')`), /row-level security/);
      assert.equal((await db.query("update public.venues set name_zh = 'bad' returning id")).rows.length, 0);
    }));
    await t.test("admin can upload only a valid venue path and cannot overwrite objects", () => as("authenticated", admin, async () => {
      assert.equal((await db.query("select public.is_coffee_admin() as allowed")).rows[0].allowed, true);
      await assert.rejects(db.exec("insert into storage.objects values ('venue-photos', 'arbitrary.html')"), /row-level security/);
      await assert.rejects(db.exec(`insert into storage.objects values ('venue-photos', '${ordinary}/00000000-0000-4000-8000-000000000030.jpg')`), /row-level security/);
      await db.exec(`insert into storage.objects values ('venue-photos', '${path}')`);
      assert.equal((await db.query("delete from storage.objects where bucket_id = 'venue-photos' returning name")).rows.length, 0);
      assert.equal((await db.query("update storage.objects set name = 'overwrite' where bucket_id = 'venue-photos' returning name")).rows.length, 0);
    }));
    await t.test("admin cover RPC validates upload and venue association", () => as("authenticated", admin, async () => {
      await assert.rejects(cover(null, "../bad.jpg"), /INVALID_PHOTO_PATH/);
      await assert.rejects(cover(null, path, secondVenue), /INVALID_PHOTO_PATH/);
      await assert.rejects(cover(null, `${venue}/00000000-0000-4000-8000-000000000099.jpg`), /PHOTO_NOT_UPLOADED/);
      const { result } = (await cover()).rows[0];
      assert.equal(result.id, venue);
      assert.equal(result.image_url, `https://xkkkyfzrafpauwfijjtn.supabase.co/storage/v1/object/public/venue-photos/${path}`);
      assert.equal((await db.query("select name_zh from public.venues where id = $1", [venue])).rows[0].name_zh, "Test cafe");
    }));
    await t.test("retry is idempotent, stale cover cannot replace a more recent edit", () => as("authenticated", admin, async () => {
      await cover(); // Same uploaded object and original null snapshot: succeeds.
      const other = `${venue}/00000000-0000-4000-8000-000000000040.jpg`;
      await db.exec(`insert into storage.objects values ('venue-photos', '${other}')`);
      await assert.rejects(cover(null, other), /COVER_CONFLICT/);
      const current = (await db.query("select image_url from public.venues where id = $1", [venue])).rows[0].image_url;
      await cover(current, other);
      assert.equal((await db.query("select image_url from public.venues where id = $1", [venue])).rows[0].image_url.endsWith(other), true);
    }));
    async function features(values, previous = { serving: null, services: null, tags: null }, id = venue) {
      return db.query("select public.set_venue_features($1, $2::jsonb, $3::jsonb) as result", [id, JSON.stringify(values), JSON.stringify(previous)]);
    }
    const chosen = { serving: ["hand_drip", "draft_beer"], services: ["pet_friendly"], tags: ["instagram_worthy"] };
    await t.test("only allowlisted admins can save features", async () => {
      await as("anon", "", () => assert.rejects(features(chosen), /permission denied/));
      await as("authenticated", ordinary, () => assert.rejects(features(chosen), /ADMIN_REQUIRED/));
    });
    await t.test("feature payloads reject extra fields, arbitrary labels and wrong fields", () => as("authenticated", admin, async () => {
      for (const invalid of [null, [], {}, {...chosen, image_url: "bad"}, {...chosen, serving: null}, {...chosen, serving: [null]}, {...chosen, serving: [""]}]) {
        await assert.rejects(features(invalid), /INVALID_FEATURES/);
      }
      await assert.rejects(features({...chosen, serving: ["invented"]}), /UNKNOWN_FEATURE/);
      await assert.rejects(features({...chosen, services: ["espresso"]}), /INVALID_FEATURE_FIELD/);
      await assert.rejects(features(chosen, null, ordinary), /VENUE_NOT_FOUND/);
    }));
    await t.test("feature writes are isolated from covers, idempotent and reject stale editors", () => as("authenticated", admin, async () => {
      const before = (await db.query("select image_url, name_zh from public.venues where id = $1", [venue])).rows[0];
      assert.deepEqual((await features(chosen)).rows[0].result, { id: venue, ...chosen });
      await features(chosen); // Retrying a lost response succeeds with the original snapshot.
      await assert.rejects(features({...chosen, services: []}), /FEATURE_CONFLICT/);
      assert.deepEqual((await db.query("select image_url, name_zh from public.venues where id = $1", [venue])).rows[0], before);
      await features({...chosen, services: []}, chosen);
    }));
    await t.test("legacy values can be retained only in their existing field", async () => {
      await db.query("update public.venues set serving = array['special_coffee','glass'], services = null, tags = null where id = $1", [secondVenue]);
      const previous = {serving:['special_coffee','glass'], services:null, tags:null};
      await as("authenticated", admin, async () => {
        await assert.rejects(features({serving:[], services:['glass'], tags:[]}, previous, secondVenue), /UNKNOWN_FEATURE/);
        const result = await features({serving:['special_coffee','glass','espresso'], services:[], tags:[]}, previous, secondVenue);
        assert.deepEqual(result.rows[0].result.serving, ['special_coffee','glass','espresso']);
      });
    });
    await t.test("feature RPC also supports existing JSONB array columns", async () => {
      await db.exec("alter table public.venues alter column serving type jsonb using to_jsonb(serving), alter column services type jsonb using to_jsonb(services), alter column tags type jsonb using to_jsonb(tags)");
      await db.exec(featureMigration); // Compile against this schema, as on a JSONB-backed project.
      const previous = {serving:['special_coffee','glass','espresso'], services:[], tags:[]};
      await as("authenticated", admin, async () => {
        const result = await features({...previous, services:['free_wifi']}, previous, secondVenue);
        assert.deepEqual(result.rows[0].result.services, ['free_wifi']);
      });
    });
    await t.test("other storage buckets retain their existing permissions", () => as("authenticated", ordinary, async () => {
      await db.exec("insert into storage.objects values ('unrelated-bucket', 'existing-workflow.txt')");
      assert.equal((await db.query("delete from storage.objects where bucket_id = 'unrelated-bucket' returning name")).rows.length, 1);
    }));
  } finally { await db.close(); }
});

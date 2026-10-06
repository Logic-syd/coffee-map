import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const first = await readFile(new URL('../supabase/migrations/202610040001_photo_admin.sql', import.meta.url), 'utf8');
const second = await readFile(new URL('../supabase/migrations/202610040002_venue_features.sql', import.meta.url), 'utf8');
const third = await readFile(new URL('../supabase/migrations/202610040003_feature_catalog.sql', import.meta.url), 'utf8');
const admin = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const venue = '00000000-0000-4000-8000-000000000003';

const definition = (overrides = {}) => ({
  id: 'custom_test', group_key: 'amenities', field_key: 'services', name_zh: '可带猫',
  name_en: 'Cats welcome', name_ja: '', name_ko: '', in_filters: false,
  in_details: true, active: true, sort_order: 500, ...overrides,
});

test('admins maintain a public catalog without broad write access', async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, storage, public to anon, authenticated;
      create table public.venues(id uuid primary key, name_zh text, image_url text, updated_at timestamptz, serving text[], services text[], tags text[]);
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(bucket_id text, name text, primary key(bucket_id, name));
      create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1, '/') $$;
      alter table public.venues enable row level security;
      alter table storage.objects enable row level security;
      grant all on public.venues, storage.objects to anon, authenticated;
      create policy legacy_allow_all on public.venues for all using (true) with check (true);
      create policy legacy_allow_all on storage.objects for all using (true) with check (true);
      insert into auth.users values ('${admin}'), ('${other}');
      insert into public.venues(id,name_zh,updated_at) values ('${venue}','Test cafe',now());
    `);
    await db.exec(first);
    await db.exec(second);
    await db.exec(third);
    await db.exec(`insert into coffee_private.admins(user_id) values ('${admin}')`);
    async function as(role, id, fn) {
      await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${id}', false);`);
      try { return await fn(); } finally { await db.exec('reset role'); }
    }
    const set = (row, revision = null) => db.query('select public.set_venue_feature_definition($1::jsonb,$2) as result', [JSON.stringify(row), revision]);
    const setVenue = (values, previous = { serving:null, services:null, tags:null }) => db.query('select public.set_venue_features($1,$2::jsonb,$3::jsonb) as result', [venue, JSON.stringify(values), JSON.stringify(previous)]);

    await t.test('seed is repeatable and leaves 34 definitions', async () => {
      assert.equal((await db.query('select count(*)::int as n from public.venue_feature_catalog')).rows[0].n, 34);
      await db.exec(third);
      assert.equal((await db.query('select count(*)::int as n from public.venue_feature_catalog')).rows[0].n, 34);
    });
    await t.test('public reads definitions but cannot write or call editor', () => as('anon', '', async () => {
      assert.equal((await db.query('select count(*)::int as n from public.venue_feature_catalog')).rows[0].n, 34);
      await assert.rejects(db.exec("update public.venue_feature_catalog set name_zh='bad'"), /permission denied/);
      await assert.rejects(set(definition()), /permission denied/);
    }));
    await t.test('ordinary authenticated user cannot change definitions or venue tags', () => as('authenticated', other, async () => {
      await assert.rejects(set(definition()), /ADMIN_REQUIRED/);
      await assert.rejects(setVenue({serving:[],services:['custom_test'],tags:[]}), /ADMIN_REQUIRED/);
    }));
    await t.test('admin adds a detail-only tag, changes its purpose and uses it on a venue', () => as('authenticated', admin, async () => {
      const created = (await set(definition())).rows[0].result;
      assert.equal(created.revision, 1);
      await assert.rejects(set(definition()), /FEATURE_CONFLICT/);
      const changed = (await set(definition({name_zh:'猫咪友好',in_filters:true}), 1)).rows[0].result;
      assert.equal(changed.revision, 2);
      assert.equal(changed.in_filters, true);
      await assert.rejects(set(definition({name_zh:'stale'}), 1), /FEATURE_CONFLICT/);
      const values = { serving:[], services:['custom_test'], tags:[] };
      assert.deepEqual((await setVenue(values)).rows[0].result.services, ['custom_test']);
      assert.equal((await db.query('select name_zh from public.venues where id=$1',[venue])).rows[0].name_zh, 'Test cafe');
    }));
    await t.test('archiving hides a tag but preserves existing venue values', () => as('authenticated', admin, async () => {
      const saved = (await set(definition({name_zh:'猫咪友好',in_filters:true,active:false}), 2)).rows[0].result;
      assert.equal(saved.active, false);
      const old = {serving:[],services:['custom_test'],tags:[]};
      await setVenue(old, {serving:null,services:null,tags:null});
      await assert.rejects(setVenue({serving:[],services:['custom_test','unknown'],tags:[]}, old), /UNKNOWN_FEATURE/);
      await set(definition({name_zh:'猫咪友好',in_filters:true}), 3);
    }));
    await t.test('invalid definitions and immutable storage placement are rejected', () => as('authenticated', admin, async () => {
      await assert.rejects(set(definition({field_key:'serving'}),4), /IMMUTABLE_FEATURE_FIELD/);
      await assert.rejects(set(definition({id:'bad-id'})), /INVALID_DEFINITION/);
      await assert.rejects(set(definition({id:'custom_copy',name_zh:'猫咪友好'})), /DUPLICATE_FEATURE_NAME/);
      await assert.rejects(set(definition({name_zh:''}),4), /INVALID_DEFINITION/);
      await assert.rejects(set(definition({in_details:false,in_filters:false}),4), /FEATURE_NOT_VISIBLE/);
      await assert.rejects(set({...definition(),image_url:'bad'},4), /INVALID_DEFINITION/);
    }));
  } finally { await db.close(); }
});

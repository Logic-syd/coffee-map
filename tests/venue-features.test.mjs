import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { VENUE_FEATURES, resolveFeature, getVenueFeatures, getUnknownFeatures, serializeFeatures, matchesFeatureFilters, matchesFeatureSearch } from '../src/lib/venue-features.ts';

test('catalog has unique IDs and keeps filter and detail placement separate', () => {
  assert.equal(new Set(VENUE_FEATURES.map(f => f.id)).size, VENUE_FEATURES.length);
  assert.equal(VENUE_FEATURES.filter(f => f.inFilters).length, 17);
  for (const id of ['draft_beer', 'breakfast', 'english_service']) {
    assert.equal(resolveFeature(id).inFilters, false);
    assert.equal(resolveFeature(id).inDetails, true);
  }
});
test('legacy spellings normalize and deduplicate across all three fields', () => {
  const venue = {serving:['hand brew','coldbrew','plantbasic_milk','espresso'], services:['pet friendly','free wifi','outside seating','vagan options'], tags:['handdrip']};
  assert.deepEqual(getVenueFeatures(venue).map(f => f.id).sort(), ['hand_drip','cold_brew','plant_milk','espresso','pet_friendly','free_wifi','outdoor_seating','vegan_options'].sort());
  assert.equal(matchesFeatureFilters(venue, ['hand_drip','pet_friendly']), true);
  assert.equal(matchesFeatureFilters(venue, ['hand_drip','dessert']), false);
});
test('ambiguous legacy labels do not invent stronger claims', () => {
  const venue = {serving:['filter','special_coffee','glass'], services:['english service','dog friendly']};
  assert.equal(matchesFeatureFilters(venue, ['hand_drip']), false);
  assert.equal(matchesFeatureFilters(venue, ['signature_coffee']), false);
  assert.equal(matchesFeatureFilters(venue, ['english_menu']), false);
  assert.equal(matchesFeatureFilters(venue, ['pet_friendly']), false);
  assert.deepEqual(getUnknownFeatures(venue), [{field:'serving', value:'special_coffee'}, {field:'serving', value:'glass'}]);
});
test('saving uses canonical fields and preserves unknown values without mutating original', () => {
  const venue = {serving:['special_coffee','hand brew'], services:['breakfast','vagan options'], tags:null};
  const before = structuredClone(venue);
  assert.deepEqual(serializeFeatures(['hand_drip','breakfast','vegan_options','instagram_worthy'], venue), {serving:['special_coffee','hand_drip','breakfast','vegan_options'], services:[], tags:['instagram_worthy']});
  assert.deepEqual(venue, before);
});
test('detail-only features are searchable in all languages but cannot become filter criteria', () => {
  const venue = {serving:['draft_beer']};
  for (const query of ['生啤','Draft beer','生ビール','생맥주']) assert.equal(matchesFeatureSearch(venue, query), true);
  assert.equal(matchesFeatureFilters(venue, ['draft_beer']), false);
  assert.equal(matchesFeatureFilters({}, []), true);
  assert.equal(matchesFeatureFilters({}, ['espresso']), false);
  assert.deepEqual(getVenueFeatures({serving:null}), []);
});
test('database allowlist exactly matches feature IDs and storage fields', async () => {
  const sql = await readFile(new URL('../supabase/migrations/202610040002_venue_features.sql', import.meta.url), 'utf8');
  const catalog = JSON.parse(sql.match(/catalog constant jsonb := '([^']+)'/)[1]);
  for (const field of ['serving','services','tags']) assert.deepEqual(catalog[field].sort(), VENUE_FEATURES.filter(f => f.field === field).map(f => f.id).sort());
});

test('an owner-created definition joins filtering and details without changing venue data', () => {
  const catalog = [...VENUE_FEATURES, {id:'custom_cat_friendly', group:'amenities', field:'services', labels:{'zh-CN':'可带猫',en:'Cats welcome',ja:'',ko:''}, inFilters:false, inDetails:true, aliases:[], active:true}];
  const venue = {services:['custom_cat_friendly']};
  assert.equal(getVenueFeatures(venue,catalog).at(-1).labels['zh-CN'],'可带猫');
  assert.equal(matchesFeatureFilters(venue,['custom_cat_friendly'],catalog),false);
  catalog.at(-1).inFilters = true;
  assert.equal(matchesFeatureFilters(venue,['custom_cat_friendly'],catalog),true);
  catalog.at(-1).active = false;
  assert.equal(matchesFeatureFilters(venue,['custom_cat_friendly'],catalog),false);
  assert.deepEqual(getUnknownFeatures(venue,catalog),[{field:'services',value:'custom_cat_friendly'}]);
  assert.deepEqual(serializeFeatures([],venue,catalog).services,['custom_cat_friendly']);
});

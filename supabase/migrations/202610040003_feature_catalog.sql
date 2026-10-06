-- Editable feature dictionary. Apply after 202610040002_venue_features.sql.
-- Existing venue rows are untouched; their known labels become editable definitions.
begin;
create table if not exists public.venue_feature_catalog (
  id text primary key check (id ~ '^[a-z][a-z0-9_]{2,63}$'),
  group_key text not null check (group_key in ('coffee','drinks','food','amenities')),
  field_key text not null check (field_key in ('serving','services','tags')),
  name_zh text not null check (length(btrim(name_zh)) between 1 and 80),
  name_en text not null default '' check (length(name_en) <= 80),
  name_ja text not null default '' check (length(name_ja) <= 80),
  name_ko text not null default '' check (length(name_ko) <= 80),
  in_filters boolean not null default false,
  in_details boolean not null default true,
  active boolean not null default true,
  aliases text[] not null default '{}',
  sort_order integer not null default 0 check (sort_order between 0 and 10000),
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.venue_feature_catalog enable row level security;
revoke all on public.venue_feature_catalog from public, anon, authenticated;
grant select on public.venue_feature_catalog to anon, authenticated;
drop policy if exists coffee_catalog_public_read on public.venue_feature_catalog;
create policy coffee_catalog_public_read on public.venue_feature_catalog for select to anon, authenticated using (true);
-- Direct writes stay closed even if a broad policy is added later.
drop policy if exists coffee_catalog_no_insert on public.venue_feature_catalog;
create policy coffee_catalog_no_insert on public.venue_feature_catalog as restrictive for insert to anon, authenticated with check (false);
drop policy if exists coffee_catalog_no_update on public.venue_feature_catalog;
create policy coffee_catalog_no_update on public.venue_feature_catalog as restrictive for update to anon, authenticated using (false) with check (false);
drop policy if exists coffee_catalog_no_delete on public.venue_feature_catalog;
create policy coffee_catalog_no_delete on public.venue_feature_catalog as restrictive for delete to anon, authenticated using (false);

-- Seed the 34 existing definitions. Existing edits win on repeated installation.
insert into public.venue_feature_catalog
  (id, group_key, field_key, name_zh, name_en, name_ja, name_ko, in_filters, in_details, active, aliases, sort_order)
select item->>'id', item->>'group', item->>'field', item->'labels'->>'zh-CN',
       item->'labels'->>'en', item->'labels'->>'ja', item->'labels'->>'ko',
       (item->>'inFilters')::boolean, (item->>'inDetails')::boolean, true,
       array(select jsonb_array_elements_text(item->'aliases')), (item->>'sortOrder')::integer
from jsonb_array_elements('[{"id":"signature_coffee","group":"coffee","field":"serving","labels":{"zh-CN":"特调咖啡","en":"Signature coffee","ja":"シグネチャーコーヒー","ko":"시그니처 커피"},"inFilters":true,"inDetails":true,"aliases":[],"sortOrder":10},{"id":"espresso","group":"coffee","field":"serving","labels":{"zh-CN":"意式咖啡","en":"Espresso","ja":"エスプレッソ","ko":"에스프레소"},"inFilters":true,"inDetails":true,"aliases":["italian coffee"],"sortOrder":20},{"id":"hand_drip","group":"coffee","field":"serving","labels":{"zh-CN":"手冲咖啡","en":"Hand drip","ja":"ハンドドリップ","ko":"핸드드립"},"inFilters":true,"inDetails":true,"aliases":["handdrip","hand_brew","hand drip coffee","pour_over"],"sortOrder":30},{"id":"cold_brew","group":"coffee","field":"serving","labels":{"zh-CN":"冷萃咖啡","en":"Cold brew","ja":"コールドブリュー","ko":"콜드브루"},"inFilters":true,"inDetails":true,"aliases":["coldbrew","cold brew/drip"],"sortOrder":40},{"id":"non_coffee","group":"drinks","field":"serving","labels":{"zh-CN":"非咖啡饮品","en":"Non-coffee drinks","ja":"コーヒー以外の飲み物","ko":"논커피 음료"},"inFilters":true,"inDetails":true,"aliases":[],"sortOrder":50},{"id":"alcoholic_drinks","group":"drinks","field":"serving","labels":{"zh-CN":"含酒精饮品","en":"Alcoholic drinks","ja":"アルコール飲料","ko":"알코올 음료"},"inFilters":true,"inDetails":true,"aliases":["alcoholic coffee/drinks"],"sortOrder":60},{"id":"plant_milk","group":"drinks","field":"serving","labels":{"zh-CN":"植物奶","en":"Plant-based milk","ja":"植物性ミルク","ko":"식물성 우유"},"inFilters":true,"inDetails":true,"aliases":["plantbasic_milk","plant-based milk"],"sortOrder":70},{"id":"brunch","group":"food","field":"serving","labels":{"zh-CN":"早午餐","en":"Brunch","ja":"ブランチ","ko":"브런치"},"inFilters":true,"inDetails":true,"aliases":[],"sortOrder":80},{"id":"dessert","group":"food","field":"serving","labels":{"zh-CN":"甜点","en":"Dessert","ja":"デザート","ko":"디저트"},"inFilters":true,"inDetails":true,"aliases":[],"sortOrder":90},{"id":"free_wifi","group":"amenities","field":"services","labels":{"zh-CN":"免费 Wi-Fi","en":"Free Wi-Fi","ja":"無料 Wi-Fi","ko":"무료 와이파이"},"inFilters":true,"inDetails":true,"aliases":["wifi"],"sortOrder":100},{"id":"english_menu","group":"amenities","field":"services","labels":{"zh-CN":"英文菜单","en":"English menu","ja":"英語メニュー","ko":"영어 메뉴"},"inFilters":true,"inDetails":true,"aliases":[],"sortOrder":110},{"id":"credit_cards","group":"amenities","field":"services","labels":{"zh-CN":"支持刷卡","en":"Card payment","ja":"カード決済","ko":"카드 결제"},"inFilters":true,"inDetails":true,"aliases":["credit"],"sortOrder":120},{"id":"restroom","group":"amenities","field":"services","labels":{"zh-CN":"卫生间","en":"Restroom","ja":"トイレ","ko":"화장실"},"inFilters":true,"inDetails":true,"aliases":[],"sortOrder":130},{"id":"instagram_worthy","group":"amenities","field":"tags","labels":{"zh-CN":"适合拍照","en":"Photogenic space","ja":"映えスポット","ko":"사진 찍기 좋은 공간"},"inFilters":true,"inDetails":true,"aliases":[],"sortOrder":140},{"id":"pet_friendly","group":"amenities","field":"services","labels":{"zh-CN":"宠物友好","en":"Pet friendly","ja":"ペット同伴可","ko":"반려동물 동반"},"inFilters":true,"inDetails":true,"aliases":[],"sortOrder":150},{"id":"outdoor_seating","group":"amenities","field":"services","labels":{"zh-CN":"户外座位","en":"Outdoor seating","ja":"屋外席","ko":"야외 좌석"},"inFilters":true,"inDetails":true,"aliases":["outside seating"],"sortOrder":160},{"id":"non_smoking","group":"amenities","field":"services","labels":{"zh-CN":"禁烟","en":"Non-smoking","ja":"禁煙","ko":"금연"},"inFilters":true,"inDetails":true,"aliases":[],"sortOrder":170},{"id":"draft_beer","group":"drinks","field":"serving","labels":{"zh-CN":"生啤","en":"Draft beer","ja":"生ビール","ko":"생맥주"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":180},{"id":"bottle_shop","group":"drinks","field":"serving","labels":{"zh-CN":"瓶装精酿","en":"Bottle shop","ja":"ボトルショップ","ko":"병맥주 판매"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":190},{"id":"filter_coffee","group":"coffee","field":"serving","labels":{"zh-CN":"滤泡咖啡","en":"Filter coffee","ja":"フィルターコーヒー","ko":"필터 커피"},"inFilters":false,"inDetails":true,"aliases":["filter"],"sortOrder":200},{"id":"batch_brew","group":"coffee","field":"serving","labels":{"zh-CN":"批量滤泡","en":"Batch brew","ja":"バッチブリュー","ko":"배치 브루"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":210},{"id":"nitro_coffee","group":"coffee","field":"serving","labels":{"zh-CN":"氮气咖啡","en":"Nitro coffee","ja":"ナイトロコーヒー","ko":"니트로 커피"},"inFilters":false,"inDetails":true,"aliases":["nitro"],"sortOrder":220},{"id":"decaf_coffee","group":"coffee","field":"serving","labels":{"zh-CN":"低因咖啡","en":"Decaf coffee","ja":"デカフェ","ko":"디카페인 커피"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":230},{"id":"breakfast","group":"food","field":"serving","labels":{"zh-CN":"早餐","en":"Breakfast","ja":"朝食","ko":"아침 식사"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":240},{"id":"lunch","group":"food","field":"serving","labels":{"zh-CN":"午餐","en":"Lunch","ja":"ランチ","ko":"점심 식사"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":250},{"id":"vegan_options","group":"food","field":"serving","labels":{"zh-CN":"纯素选项","en":"Vegan options","ja":"ヴィーガン対応","ko":"비건 메뉴"},"inFilters":false,"inDetails":true,"aliases":["vegan","vagan options"],"sortOrder":260},{"id":"laptop_friendly","group":"amenities","field":"services","labels":{"zh-CN":"适合带电脑","en":"Laptop friendly","ja":"パソコン利用可","ko":"노트북 이용 가능"},"inFilters":false,"inDetails":true,"aliases":["laptop"],"sortOrder":270},{"id":"english_service","group":"amenities","field":"services","labels":{"zh-CN":"可用英语沟通","en":"English-speaking service","ja":"英語対応","ko":"영어 응대 가능"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":280},{"id":"cash_only","group":"amenities","field":"services","labels":{"zh-CN":"仅限现金","en":"Cash only","ja":"現金のみ","ko":"현금만 가능"},"inFilters":false,"inDetails":true,"aliases":["cashonly"],"sortOrder":290},{"id":"takeaway","group":"amenities","field":"services","labels":{"zh-CN":"可外带","en":"Takeaway","ja":"テイクアウト可","ko":"포장 가능"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":300},{"id":"late_night","group":"amenities","field":"services","labels":{"zh-CN":"营业至深夜","en":"Late-night service","ja":"深夜営業","ko":"심야 영업"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":310},{"id":"kids_friendly","group":"amenities","field":"services","labels":{"zh-CN":"儿童友好","en":"Kid friendly","ja":"子ども連れ歓迎","ko":"어린이 동반 환영"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":320},{"id":"dog_friendly","group":"amenities","field":"services","labels":{"zh-CN":"允许带狗","en":"Dogs welcome","ja":"犬同伴可","ko":"반려견 동반 가능"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":330},{"id":"wheelchair","group":"amenities","field":"services","labels":{"zh-CN":"轮椅可达","en":"Wheelchair accessible","ja":"車椅子対応","ko":"휠체어 접근 가능"},"inFilters":false,"inDetails":true,"aliases":[],"sortOrder":340}]'::jsonb) as item
on conflict (id) do nothing;

create or replace function public.set_venue_feature_definition(p_definition jsonb, p_expected_revision integer)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  current_row public.venue_feature_catalog%rowtype;
  saved_row public.venue_feature_catalog%rowtype;
  feature_id text;
  feature_field text;
  zh text;
  en text;
  ja text;
  ko text;
  group_name text;
  sort_value integer;
begin
  if not public.is_coffee_admin() then raise exception 'ADMIN_REQUIRED' using errcode = '42501'; end if;
  if p_definition is null or jsonb_typeof(p_definition) <> 'object'
    or not (p_definition ?& array['id','group_key','field_key','name_zh','name_en','name_ja','name_ko','in_filters','in_details','active','sort_order'])
    or p_definition - array['id','group_key','field_key','name_zh','name_en','name_ja','name_ko','in_filters','in_details','active','sort_order'] <> '{}'::jsonb
    then raise exception 'INVALID_DEFINITION'; end if;
  if jsonb_typeof(p_definition->'id') <> 'string' or jsonb_typeof(p_definition->'group_key') <> 'string'
    or jsonb_typeof(p_definition->'field_key') <> 'string' or jsonb_typeof(p_definition->'name_zh') <> 'string'
    or jsonb_typeof(p_definition->'name_en') <> 'string' or jsonb_typeof(p_definition->'name_ja') <> 'string'
    or jsonb_typeof(p_definition->'name_ko') <> 'string' or jsonb_typeof(p_definition->'in_filters') <> 'boolean'
    or jsonb_typeof(p_definition->'in_details') <> 'boolean' or jsonb_typeof(p_definition->'active') <> 'boolean'
    or jsonb_typeof(p_definition->'sort_order') <> 'number' then raise exception 'INVALID_DEFINITION'; end if;
  feature_id := p_definition->>'id';
  group_name := p_definition->>'group_key';
  feature_field := p_definition->>'field_key';
  zh := btrim(p_definition->>'name_zh');
  en := btrim(p_definition->>'name_en');
  ja := btrim(p_definition->>'name_ja');
  ko := btrim(p_definition->>'name_ko');
  if feature_id !~ '^[a-z][a-z0-9_]{2,63}$' or group_name not in ('coffee','drinks','food','amenities')
    or feature_field not in ('serving','services','tags') or length(zh) not between 1 and 80
    or greatest(length(en),length(ja),length(ko)) > 80
    or (p_definition->>'sort_order') !~ '^[0-9]{1,5}$' then raise exception 'INVALID_DEFINITION'; end if;
  sort_value := (p_definition->>'sort_order')::integer;
  if sort_value > 10000 then raise exception 'INVALID_DEFINITION'; end if;
  if (p_definition->>'active')::boolean and not ((p_definition->>'in_filters')::boolean or (p_definition->>'in_details')::boolean)
    then raise exception 'FEATURE_NOT_VISIBLE'; end if;
  if (p_definition->>'active')::boolean and exists (
    select 1 from public.venue_feature_catalog where id <> feature_id and active and lower(name_zh) = lower(zh)
  ) then raise exception 'DUPLICATE_FEATURE_NAME'; end if;
  select * into current_row from public.venue_feature_catalog where id = feature_id for update;
  if p_expected_revision is null then
    if found then raise exception 'FEATURE_CONFLICT'; end if;
    insert into public.venue_feature_catalog
      (id, group_key, field_key, name_zh, name_en, name_ja, name_ko, in_filters, in_details, active, sort_order)
    values (feature_id, group_name, feature_field, zh, en, ja, ko, (p_definition->>'in_filters')::boolean,
      (p_definition->>'in_details')::boolean, (p_definition->>'active')::boolean, sort_value)
    returning * into saved_row;
  else
    if not found or current_row.revision <> p_expected_revision then raise exception 'FEATURE_CONFLICT'; end if;
    if current_row.field_key <> feature_field then raise exception 'IMMUTABLE_FEATURE_FIELD'; end if;
    -- The stable ID, storage field and historical aliases remain attached to each venue.
    update public.venue_feature_catalog
       set group_key = group_name, name_zh = zh, name_en = en, name_ja = ja, name_ko = ko,
           in_filters = (p_definition->>'in_filters')::boolean, in_details = (p_definition->>'in_details')::boolean,
           active = (p_definition->>'active')::boolean, sort_order = sort_value,
           revision = revision + 1, updated_at = now()
     where id = feature_id returning * into saved_row;
  end if;
  return to_jsonb(saved_row);
end;
$$;
revoke all on function public.set_venue_feature_definition(jsonb, integer) from public, anon;
grant execute on function public.set_venue_feature_definition(jsonb, integer) to authenticated;

-- The venue editor now checks the editable dictionary, including active state.
create or replace function public.set_venue_features(p_venue_id uuid, p_features jsonb, p_previous jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  snapshot jsonb;
  field_name text;
  item jsonb;
  value_text text;
  known_field text;
  known_active boolean;
  proposed public.venues%rowtype;
begin
  if not public.is_coffee_admin() then raise exception 'ADMIN_REQUIRED' using errcode = '42501'; end if;
  if p_features is null or jsonb_typeof(p_features) <> 'object' then raise exception 'INVALID_FEATURES'; end if;
  if not (p_features ?& array['serving','services','tags']) or p_features - array['serving','services','tags'] <> '{}'::jsonb then
    raise exception 'INVALID_FEATURES'; end if;
  select jsonb_build_object('serving', v.serving, 'services', v.services, 'tags', v.tags)
    into snapshot from public.venues v where id = p_venue_id for update;
  if not found then raise exception 'VENUE_NOT_FOUND'; end if;
  foreach field_name in array array['serving','services','tags'] loop
    if jsonb_typeof(p_features -> field_name) <> 'array' then raise exception 'INVALID_FEATURES'; end if;
    if jsonb_array_length(p_features -> field_name) > 100 then raise exception 'TOO_MANY_FEATURES'; end if;
    for item in select * from jsonb_array_elements(p_features -> field_name) loop
      if jsonb_typeof(item) <> 'string' then raise exception 'INVALID_FEATURES'; end if;
      value_text := item #>> '{}';
      if length(btrim(value_text)) = 0 or length(value_text) > 120 then raise exception 'INVALID_FEATURES'; end if;
      select field_key, active into known_field, known_active from public.venue_feature_catalog where id = value_text;
      if known_field is not null and known_field <> field_name then raise exception 'INVALID_FEATURE_FIELD'; end if;
      if not coalesce(known_active, false) and not coalesce((snapshot -> field_name) @> jsonb_build_array(value_text), false) then
        raise exception 'UNKNOWN_FEATURE'; end if;
    end loop;
  end loop;
  if snapshot = p_features then return jsonb_build_object('id', p_venue_id) || snapshot; end if;
  if snapshot is distinct from p_previous then raise exception 'FEATURE_CONFLICT'; end if;
  select * into proposed from jsonb_populate_record(null::public.venues, p_features);
  update public.venues set serving = proposed.serving, services = proposed.services, tags = proposed.tags, updated_at = now()
    where id = p_venue_id;
  return jsonb_build_object('id', p_venue_id) || p_features;
end;
$$;
revoke all on function public.set_venue_features(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.set_venue_features(uuid, jsonb, jsonb) to authenticated;
commit;

-- Requires 202610040001_photo_admin.sql. Installs a guarded editor; no venue data is migrated.
begin;
create or replace function public.set_venue_features(p_venue_id uuid, p_features jsonb, p_previous jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  snapshot jsonb;
  field_name text;
  item jsonb;
  value_text text;
  known_field text;
  proposed public.venues%rowtype;
  -- Canonical IDs and storage fields must match src/lib/venue-features.ts.
  catalog constant jsonb := '{"serving":["signature_coffee","espresso","hand_drip","cold_brew","non_coffee","alcoholic_drinks","plant_milk","brunch","dessert","draft_beer","bottle_shop","filter_coffee","batch_brew","nitro_coffee","decaf_coffee","breakfast","lunch","vegan_options"],"services":["free_wifi","english_menu","credit_cards","restroom","pet_friendly","outdoor_seating","non_smoking","laptop_friendly","english_service","cash_only","takeaway","late_night","kids_friendly","dog_friendly","wheelchair"],"tags":["instagram_worthy"]}';
begin
  if not public.is_coffee_admin() then raise exception 'ADMIN_REQUIRED' using errcode = '42501'; end if;
  if p_features is null or jsonb_typeof(p_features) <> 'object' then raise exception 'INVALID_FEATURES'; end if;
  if not (p_features ?& array['serving','services','tags']) or p_features - array['serving','services','tags'] <> '{}'::jsonb then
    raise exception 'INVALID_FEATURES';
  end if;
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
      select key into known_field from jsonb_each(catalog) where value ? value_text;
      if known_field is not null then
        if known_field <> field_name then raise exception 'INVALID_FEATURE_FIELD'; end if;
      elsif not coalesce((snapshot -> field_name) @> jsonb_build_array(value_text), false) then
        -- Existing ambiguous labels may be retained in-place; new arbitrary labels are rejected.
        raise exception 'UNKNOWN_FEATURE';
      end if;
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

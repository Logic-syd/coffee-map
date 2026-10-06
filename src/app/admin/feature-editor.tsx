"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FEATURE_GROUPS, getVenueFeatures, getUnknownFeatures, serializeFeatures } from "@/lib/venue-features";
import type { VenueFeature, VenueFeatureData } from "@/lib/venue-features";
import VenueFeatures from "@/components/VenueFeatures";
import styles from "./photo-admin.module.css";

type FeatureVenue = VenueFeatureData & { id: string; name_zh: string };
export default function FeatureEditor({ venue, catalog, busy, allowNext, onDirty, onBusy, onSaved }: {
  venue: FeatureVenue;
  catalog: VenueFeature[];
  busy: boolean;
  allowNext: boolean;
  onDirty: (dirty: boolean) => void;
  onBusy: (busy: boolean) => void;
  onSaved: (data: Required<VenueFeatureData>, next: boolean) => void;
}) {
  const initial = getVenueFeatures(venue, catalog).map((item) => item.id);
  const [selected, setSelected] = useState(initial);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const dirty = selected.length !== initial.length || selected.some((id) => !initial.includes(id));
  const unknown = getUnknownFeatures(venue, catalog);
  const preview = serializeFeatures(selected, venue, catalog);

  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setError("");
  }

  async function save(next: boolean) {
    if (busy || saving.current || !dirty || (next && !allowNext)) return;
    saving.current = true;
    onBusy(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("set_venue_features", {
        p_venue_id: venue.id,
        p_features: preview,
        p_previous: { serving: venue.serving ?? null, services: venue.services ?? null, tags: venue.tags ?? null },
      });
      if (rpcError) throw rpcError;
      if (data?.id !== venue.id || !Array.isArray(data.serving) || !Array.isArray(data.services) || !Array.isArray(data.tags)) throw new Error("未收到保存确认，请重试。");
      onSaved(data, next);
    } catch (failure) {
      const message = failure && typeof failure === "object" && "message" in failure ? String(failure.message) : "";
      setError(message.includes("FEATURE_CONFLICT") ? "这家店的特色刚被更新，请先刷新门店资料，再重新勾选。" : message.includes("ADMIN_REQUIRED") || message.includes("JWT") ? "登录已过期或没有管理权限，请重新登录。" : message.includes("schema cache") ? "特色保存接口尚未配置，请完成后台初始化后重试。" : `保存失败，勾选内容仍保留。${message || "请检查网络后重试。"}`);
    } finally { saving.current = false; onBusy(false); }
  }

  return <div className={styles.featureEditor}>
    <p className={styles.featureHelp}>只勾选已确认的特色，留空表示尚未确认。每项只需录一次，筛选和详情会自动共用。</p>
    {[true, false].map((filterable) => <fieldset key={String(filterable)} disabled={busy} className={styles.featureSection}>
      <legend>{filterable ? "筛选 + 详情" : "仅在详情展示"}</legend>
      <p>{filterable ? "帮助用户找店，也展示这家店具备的特点。" : "补充门店特色，不增加筛选项。"}</p>
      {FEATURE_GROUPS.map((group) => {
        const options = catalog.filter((item) => item.group === group.id && item.inFilters === filterable && item.active !== false && (item.inFilters || item.inDetails));
        if (!options.length) return null;
        return <div key={group.id} className={styles.featureGroup}><h3>{group.labels["zh-CN"]}</h3><div className={styles.featureOptions}>{options.map((item) => <button key={item.id} type="button" aria-pressed={selected.includes(item.id)} className={selected.includes(item.id) ? styles.featureSelected : ""} onClick={() => toggle(item.id)}>{selected.includes(item.id) && <Check size={13} />}{item.labels["zh-CN"]}{item.inFilters && !item.inDetails ? " · 仅筛选" : ""}</button>)}</div></div>;
      })}
    </fieldset>)}
    {unknown.length > 0 && <div className={styles.legacyFeatures}><strong>旧标签或已停用标签</strong><p>{unknown.map((item) => item.value).join("、")}</p><small>这些值会原样保留，暂不用于筛选或详情展示。</small></div>}
    {selected.length > 0 && <div className={styles.featurePreview}><small>用户看到的详情预览</small><VenueFeatures venue={preview} locale="zh-CN" catalog={catalog} /></div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <div className={styles.featureSave}><span>{busy ? "正在保存…" : `${selected.length} 项特色${dirty ? " · 尚未保存" : ""}`}{!allowNext && " · 先保存封面才能前往下一家"}</span><div><button className={styles.secondary} disabled={busy || !dirty} onClick={() => void save(false)}>保存特色</button><button className={styles.primary} disabled={busy || !dirty || !allowNext} onClick={() => void save(true)}>保存特色并下一家</button></div></div>
  </div>;
}

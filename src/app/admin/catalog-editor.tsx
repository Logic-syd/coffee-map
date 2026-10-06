"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FEATURE_GROUPS } from "@/lib/venue-features";
import type { FeatureGroup } from "@/lib/venue-features";
import type { CatalogRow } from "@/lib/venue-feature-catalog";
import styles from "./photo-admin.module.css";

function newDefinition(rows: CatalogRow[]): CatalogRow {
  return {
    id: `custom_${crypto.randomUUID().replaceAll("-", "")}`,
    group_key: "coffee", field_key: "serving", name_zh: "", name_en: "", name_ja: "", name_ko: "",
    in_filters: false, in_details: true, active: true, aliases: [],
    sort_order: Math.min(10000, Math.max(0, ...rows.map((item) => item.sort_order)) + 10), revision: 0,
  };
}

const payload = (row: CatalogRow) => ({
  id: row.id, group_key: row.group_key, field_key: row.field_key,
  name_zh: row.name_zh.trim(), name_en: row.name_en.trim(), name_ja: row.name_ja.trim(), name_ko: row.name_ko.trim(),
  in_filters: row.in_filters, in_details: row.in_details, active: row.active, sort_order: row.sort_order,
});

export default function CatalogEditor({ rows, busy, onBusy, onDirty, onSaved, onClose }: {
  rows: CatalogRow[];
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onDirty: (dirty: boolean) => void;
  onSaved: (row: CatalogRow) => void;
  onClose: () => void;
}) {
  const [source, setSource] = useState<CatalogRow | null>(null);
  const [draft, setDraft] = useState<CatalogRow | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const saving = useRef(false);
  const dirty = Boolean(draft && JSON.stringify(payload(draft)) !== JSON.stringify(source ? payload(source) : payload({ ...draft, name_zh: "" })));

  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);

  function choose(item: CatalogRow | null) {
    if (busy || saving.current || (dirty && !window.confirm("当前标签有未保存的修改，确定放弃吗？"))) return;
    const next = item || newDefinition(rows);
    setSource(item);
    setDraft({ ...next });
    setError("");
    setNotice("");
  }

  function groupChanged(group: FeatureGroup) {
    if (!draft) return;
    setDraft({ ...draft, group_key: group, field_key: source ? draft.field_key : group === "amenities" ? "services" : "serving" });
  }

  async function save() {
    if (!draft || !draft.name_zh.trim() || !dirty || busy || saving.current) return;
    if (draft.active && !draft.in_filters && !draft.in_details) { setError("启用的标签至少要用于筛选或详情中的一处。也可以先停用它。"); return; }
    saving.current = true;
    onBusy(true);
    setError("");
    setNotice("");
    try {
      const { data, error: rpcError } = await supabase.rpc("set_venue_feature_definition", {
        p_definition: payload(draft), p_expected_revision: source?.revision ?? null,
      });
      if (rpcError) throw rpcError;
      if (!data || data.id !== draft.id || !Number.isInteger(data.revision)) throw new Error("未收到保存确认，请刷新后检查。");
      const saved = data as CatalogRow;
      setSource(saved);
      setDraft({ ...saved });
      onSaved(saved);
      setNotice(`已保存「${saved.name_zh}」。重新打开 App 即可看到更新。`);
    } catch (failure) {
      const message = failure && typeof failure === "object" && "message" in failure ? String(failure.message) : "";
      setError(message.includes("FEATURE_CONFLICT") ? "这个标签刚被修改，请刷新后再编辑。" : message.includes("DUPLICATE_FEATURE_NAME") ? "已有同名标签，请直接编辑现有标签。" : message.includes("ADMIN_REQUIRED") ? "登录已过期或没有管理权限。" : message.includes("schema cache") || message.includes("Could not find the function") ? "标签管理接口尚未安装，请先完成云端配置。" : `保存失败：${message || "请检查网络后重试。"}`);
    } finally { saving.current = false; onBusy(false); }
  }

  const shown = rows.filter((item) => `${item.name_zh} ${item.name_en}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className={styles.catalogShell} aria-label="标签管理">
    <div className={styles.catalogHeader}><button className={styles.secondary} onClick={onClose} disabled={busy}><ArrowLeft size={16} />返回门店</button><div><h2>管理标签</h2><p>修改名称、分类和展示位置；停用不会删除门店里已录的内容。</p></div><button className={styles.primary} onClick={() => choose(null)} disabled={busy}><Plus size={16} />新增标签</button></div>
    <div className={styles.catalogGrid}>
      <aside className={styles.catalogList}><label>搜索标签<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入中文或英文名称" /></label><div>{shown.map((item) => <button key={item.id} aria-pressed={draft?.id === item.id} onClick={() => choose(item)} disabled={busy}><strong>{item.name_zh}</strong><small>{item.active ? item.in_filters ? "筛选 · 详情" : "仅详情" : "已停用"}</small></button>)}</div></aside>
      <div className={styles.catalogForm}>{!draft ? <div className={styles.catalogEmpty}>从左侧选一个标签，或点击“新增标签”。</div> : <>
        <h3>{source ? `编辑「${source.name_zh}」` : "新增标签"}</h3><p className={styles.featureHelp}>中文名称必填。其他语言可以稍后补充，未填写时会先显示中文名称。</p>
        <fieldset disabled={busy}>
          <div className={styles.catalogFields}><label>中文名称<input value={draft.name_zh} maxLength={80} onChange={(event) => setDraft({ ...draft, name_zh: event.target.value })} placeholder="例如：宠物友好" required /></label><label>English<input value={draft.name_en} maxLength={80} onChange={(event) => setDraft({ ...draft, name_en: event.target.value })} /></label><label>日本語<input value={draft.name_ja} maxLength={80} onChange={(event) => setDraft({ ...draft, name_ja: event.target.value })} /></label><label>한국어<input value={draft.name_ko} maxLength={80} onChange={(event) => setDraft({ ...draft, name_ko: event.target.value })} /></label>
          <label>分类<select value={draft.group_key} onChange={(event) => groupChanged(event.target.value as FeatureGroup)}>{FEATURE_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.labels["zh-CN"]}</option>)}</select></label><label>排序值<input type="number" min="0" max="10000" value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) })} /></label></div>
          <div className={styles.catalogChecks}><label><input type="checkbox" checked={draft.in_filters} onChange={(event) => setDraft({ ...draft, in_filters: event.target.checked })} />用于筛选</label><label><input type="checkbox" checked={draft.in_details} onChange={(event) => setDraft({ ...draft, in_details: event.target.checked })} />详情展示</label><label><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />启用标签</label></div>
        </fieldset>
        {source && <p className={styles.catalogHint}>已有门店用这个标签记录特色；名称和展示位置可改，内部标识与存储字段保持固定。</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}
        <div className={styles.catalogActions}><span>{dirty ? "有未保存修改" : "已保存"}</span><button className={styles.primary} disabled={!dirty || !draft.name_zh.trim() || busy} onClick={() => void save()}>{busy ? "正在保存…" : "保存标签"}</button></div>
      </>}</div>
    </div>
  </section>;
}

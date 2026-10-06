"use client";

/* eslint-disable @next/next/no-img-element -- Local blob previews and public Storage images. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, DragEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, ArrowRight, Check, Coffee, ImagePlus, LogOut, Search, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PHOTO_BUCKET, formatBytes, preparePhoto } from "@/lib/admin-images";
import type { PreparedPhoto } from "@/lib/admin-images";
import { VENUE_FEATURES, getVenueFeatures } from "@/lib/venue-features";
import type { VenueFeature, VenueFeatureData } from "@/lib/venue-features";
import FeatureEditor from "./feature-editor";
import CatalogEditor from "./catalog-editor";
import { catalogFromRows, loadVenueFeatureCatalog } from "@/lib/venue-feature-catalog";
import type { CatalogRow } from "@/lib/venue-feature-catalog";
import styles from "./photo-admin.module.css";

type Venue = VenueFeatureData & { id: string; name_zh: string; name_eng: string | null; address: string; image_url: string | null };
type Filter = "missing" | "all" | "ready" | "features";
const fields = "id,name_zh,name_eng,address,image_url,serving,services,tags";
const hasCover = (venue: Venue) => Boolean(venue.image_url?.trim());
const matches = (venue: Venue, search: string, filter: Filter, catalog: VenueFeature[]) =>
  `${venue.name_zh} ${venue.name_eng || ""} ${venue.address}`.toLowerCase().includes(search.trim().toLowerCase()) &&
  (filter === "all" || (filter === "features" ? getVenueFeatures(venue, catalog).length === 0 : filter === "ready" ? hasCover(venue) : !hasCover(venue)));

function errorMessage(error: unknown) {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (message.includes("COVER_CONFLICT")) return "这家店的封面刚被更新。请刷新门店资料后重新选择照片，避免覆盖其他修改。";
  if (message.includes("ADMIN_REQUIRED") || message.includes("row-level security") || message.includes("JWT")) return "没有保存权限或登录已过期，请重新登录；若仍失败，请核对管理员配置。";
  if (message.includes("Failed to fetch") || message.includes("fetch failed")) return "网络连接失败，请检查网络后重试。";
  if (message.includes("Bucket not found") || message.includes("schema cache") || message.includes("does not exist")) return "后台的云端配置尚未完成，请先按配置说明创建照片存储和管理函数。";
  return message || "操作失败，请稍后重试。";
}

export default function PhotoAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const userId = user?.id;
  const [authReady, setAuthReady] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [checking, setChecking] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [catalog, setCatalog] = useState(VENUE_FEATURES);
  const [catalogRows, setCatalogRows] = useState<CatalogRow[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogDirty, setCatalogDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("missing");
  const [selected, setSelected] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [featureDirty, setFeatureDirty] = useState(false);
  const [editorTab, setEditorTab] = useState<"photo" | "features">("photo");
  const [phase, setPhase] = useState("");
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadedPath = useRef<string | null>(null);
  const operation = useRef(false);
  const sessionId = useRef<string | null>(null);
  sessionId.current = user?.id ?? null;
  const venue = venues.find((item) => item.id === selected);
  const visible = venues.filter((item) => matches(item, search, filter, catalog));
  const readyCount = venues.filter(hasCover).length;
  const busy = Boolean(phase);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAdmin(false);
    setVenues([]);
    setSelected(null);
    setPhoto(null);
    setCatalogOpen(false);
    setCatalogDirty(false);
    setCatalogReady(false);
    setCatalogRows([]);
    setCatalog(VENUE_FEATURES);
    setAccessError("");
    if (!userId) return;
    setChecking(true);
    async function load() {
      try {
        const { data, error } = await supabase.rpc("is_coffee_admin");
        if (error) throw error;
        if (cancelled) return;
        if (data !== true) { setAccessError("这个账号尚未获得门店管理权限，请联系项目管理员完成授权。"); return; }
        setAdmin(true);
        setLoading(true);
        try {
          const loaded = await loadVenueFeatureCatalog();
          if (!cancelled) { setCatalogRows(loaded.rows); setCatalog(loaded.features); setCatalogReady(true); setCatalogError(""); }
        } catch {
          if (!cancelled) setCatalogError("标签管理的云端配置尚未安装；目前仍使用应用内的原有标签。");
        }
        setLoadError("");
        const rows: Venue[] = [];
        for (let offset = 0; ; offset += 500) {
          const result = await supabase.from("venues").select(fields).order("name_zh").order("id").range(offset, offset + 499);
          if (result.error) throw result.error;
          rows.push(...(result.data as Venue[]));
          if (result.data.length < 500) break;
        }
        if (!cancelled) setVenues(rows);
      } catch (error) {
        if (!cancelled) { setAccessError(errorMessage(error)); setLoadError(errorMessage(error)); }
      } finally {
        if (!cancelled) { setChecking(false); setLoading(false); }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId, refresh]); // Recheck permission on login, not on every token refresh.

  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.preview); }, [photo]);
  useEffect(() => {
    if (!photo && !featureDirty && !catalogDirty) return;
    const preventLoss = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [photo, featureDirty, catalogDirty]);

  function discardAllowed() {
    return (!photo && !featureDirty && !catalogDirty) || window.confirm("还有未保存的照片、门店特色或标签定义，确定放弃吗？");
  }

  function chooseVenue(id: string | null) {
    if (operation.current || id === selected || !discardAllowed()) return;
    setSelected(id);
    setFeatureDirty(false);
    setPhoto(null);
    uploadedPath.current = null;
    setSaveError("");
    setNotice("");
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setPassword("");
    } catch {
      setLoginError("登录失败，请检查邮箱、密码和网络。请使用已创建的后台账号。");
    } finally { setLoginBusy(false); }
  }

  async function logout() {
    if (operation.current || !discardAllowed()) return;
    const { error } = await supabase.auth.signOut();
    if (error) { setNotice("退出失败，请检查网络后重试。"); return; }
    setPhoto(null);
    uploadedPath.current = null;
    setNotice("");
  }

  async function selectFile(file: File) {
    if (!venue || operation.current) return;
    operation.current = true;
    const owner = sessionId.current;
    setPhase("正在处理照片…");
    setSaveError("");
    setNotice("");
    try {
      const prepared = await preparePhoto(file);
      if (owner !== sessionId.current) { URL.revokeObjectURL(prepared.preview); return; }
      setPhoto(prepared);
      uploadedPath.current = null;
    } catch (error) { setSaveError(errorMessage(error)); }
    finally { operation.current = false; setPhase(""); }
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length !== 1) { setSaveError("封面一次选择一张照片，请选出最能代表门店的一张。"); return; }
    void selectFile(event.dataTransfer.files[0]);
  }

  async function save(next: boolean) {
    if (!venue || !photo || operation.current || (next && featureDirty)) return;
    operation.current = true;
    setSaveError("");
    setNotice("");
    const owner = sessionId.current;
    try {
      if (!uploadedPath.current) {
        setPhase("正在上传照片…");
        const path = `${venue.id}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, photo.blob, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
        if (error) throw error;
        uploadedPath.current = path;
      }
      if (owner !== sessionId.current) throw new Error("登录状态已变化，请重新登录后保存。");
      setPhase("正在保存封面…");
      const { data, error } = await supabase.rpc("set_venue_cover", {
        p_venue_id: venue.id, p_object_path: uploadedPath.current, p_previous_url: venue.image_url,
      });
      if (error) throw error;
      if (!data?.image_url || data.id !== venue.id) throw new Error("未收到保存确认，请重试；已上传的照片会被复用。");
      if (owner !== sessionId.current) return;
      const updated = venues.map((item) => item.id === venue.id ? { ...item, image_url: data.image_url as string } : item);
      setVenues(updated);
      setPhoto(null);
      uploadedPath.current = null;
      setNotice(`已保存「${venue.name_zh}」的封面。App 下次加载门店数据时会显示新照片。`);
      if (next) {
        const index = venues.findIndex((item) => item.id === venue.id);
        const remaining = [...updated.slice(index + 1), ...updated.slice(0, index)].filter((item) => matches(item, search, filter, catalog));
        setSelected(remaining[0]?.id ?? null);
      }
    } catch (error) { setSaveError(errorMessage(error)); }
    finally { operation.current = false; setPhase(""); }
  }

  function refreshVenues() {
    if (operation.current || !discardAllowed()) return;
    setPhoto(null);
    uploadedPath.current = null;
    setRefresh((value) => value + 1);
  }

  function featuresSaved(data: Required<VenueFeatureData>, next: boolean) {
    if (!venue || sessionId.current !== userId) return;
    const updated = venues.map((item) => item.id === venue.id ? { ...item, serving: data.serving, services: data.services, tags: data.tags } : item);
    setVenues(updated);
    setFeatureDirty(false);
    setNotice(`已保存「${venue.name_zh}」的特色。App 下次加载时会更新筛选和详情。`);
    if (next && !photo) {
      const index = updated.findIndex((item) => item.id === venue.id);
      const remaining = [...updated.slice(index + 1), ...updated.slice(0, index)].filter((item) => matches(item, search, filter, catalog));
      setSelected(remaining[0]?.id ?? null);
    }
  }

  function openCatalog() {
    if (operation.current || !catalogReady || !discardAllowed()) return;
    setPhoto(null);
    setFeatureDirty(false);
    setCatalogOpen(true);
  }

  function closeCatalog() {
    if (operation.current || !discardAllowed()) return;
    setCatalogOpen(false);
    setCatalogDirty(false);
  }

  function catalogSaved(row: CatalogRow) {
    if (!sessionId.current) return;
    const updated = [...catalogRows.filter((item) => item.id !== row.id), row].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
    setCatalogRows(updated);
    setCatalog(catalogFromRows(updated));
    setCatalogDirty(false);
  }

  return (
    <div className={styles.shell} lang="zh-CN">
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="返回 Coffee Map"><span className={styles.logo}><Coffee size={21} /></span><span>Coffee Map<small>门店工作台</small></span></Link>
        {user ? <div className={styles.account}><span>{user.email}</span><button onClick={() => void logout()} disabled={busy}><LogOut size={16} />退出</button></div> : <span className={styles.headerNote}>上海 · 每一家，都值得被看见</span>}
      </header>

      {!authReady ? <div className={styles.loading} role="status">正在检查登录状态…</div> : !user ? (
        <main className={styles.loginLayout}>
          <div className={styles.loginIntro}><span className={styles.eyebrow}>COFFEE MAP / STUDIO</span><h1>给好咖啡，<br />一份完整的介绍。</h1><p>添照片，选特色，把上海的咖啡馆<br />慢慢补完整。</p><div className={styles.loginStamp}><Coffee size={46} strokeWidth={1} /><span>照片与特色 · 持续收集</span></div></div>
          <form onSubmit={login} className={styles.loginCard}><span className={styles.eyebrow}>欢迎回来</span><h2>登录门店后台</h2><p>使用你的管理员账号，继续整理照片和特色。</p><label>邮箱<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>密码<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入后台密码" /></label>{loginError && <p role="alert" className={styles.error}>{loginError}</p>}<button className={styles.primary} disabled={loginBusy}>{loginBusy ? "正在登录…" : "进入工作台"}<ArrowRight size={18} /></button><p className={styles.loginHint}>仅向管理员开放。首次使用需由项目管理员创建账号并授权。</p></form>
        </main>
      ) : checking && !admin ? <div className={styles.loading} role="status">正在确认管理权限…</div> : !admin ? (
        <main className={styles.accessCard}><h1>还差一步配置</h1><p role="alert">{accessError || "请确认账号的管理权限。"}</p><p>完成云端配置和账号授权后，即可整理照片和特色。</p><button className={styles.primary} onClick={refreshVenues}>重新检查</button></main>
      ) : (
        <main className={styles.workspace}>
          <section className={styles.overview}><div><span className={styles.eyebrow}>SHANGHAI COLLECTION</span><h1>门店资料</h1><p>添照片、选特色，也能维护自己的标签目录。</p><button className={styles.catalogOpenButton} disabled={busy || !catalogReady} onClick={openCatalog}>管理标签</button></div><div className={styles.progress}><span><strong>{readyCount}</strong><span> / {venues.length} 家已配图</span></span><div className={styles.progressTrack}><div style={{ width: `${venues.length ? readyCount / venues.length * 100 : 0}%` }} /></div><small>还有 {venues.length - readyCount} 家等待封面</small></div></section>
          {catalogError && <div className={styles.error} role="alert">{catalogError}</div>}
          {notice && <div className={styles.notice} role="status"><Check size={18} />{notice}</div>}
          {catalogOpen ? <CatalogEditor rows={catalogRows} busy={busy} onBusy={(value) => { operation.current = value; setPhase(value ? "正在保存标签…" : ""); }} onDirty={setCatalogDirty} onSaved={catalogSaved} onClose={closeCatalog} /> : <div className={styles.workGrid}>
            <aside className={`${styles.listPanel} ${selected ? styles.mobileHidden : ""}`} aria-label="门店列表">
              <div className={styles.listTools}><label className={styles.search}><Search size={18} /><input aria-label="搜索门店" placeholder="搜索店名或地址" value={search} onChange={(event) => setSearch(event.target.value)} /><span>{visible.length}</span></label><div className={styles.filters} aria-label="资料状态筛选">{([["missing", "待配图"], ["all", "全部门店"], ["ready", "已配图"], ["features", "待补特色"]] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? styles.activeFilter : ""} onClick={() => { setFilter(value); if (value === "features") setEditorTab("features"); }}>{label}</button>)}</div></div>
              <div className={styles.venueList}>{loading ? <p className={styles.empty} role="status">正在读取门店…</p> : loadError ? <div className={styles.empty}><p role="alert">{loadError}</p><button onClick={refreshVenues}>重新加载</button></div> : visible.length === 0 ? <p className={styles.empty}>{venues.length === 0 ? "还没有门店记录。" : search ? "没有匹配的门店，试试其他关键词。" : filter === "missing" ? "全部门店都已配图，做得不错。" : "这里暂时没有门店。"}</p> : visible.map((item) => <button key={item.id} disabled={busy} onClick={() => chooseVenue(item.id)} className={`${styles.venue} ${selected === item.id ? styles.selectedVenue : ""}`} aria-pressed={selected === item.id}><span className={styles.thumbnail}>{hasCover(item) ? <img src={item.image_url!} alt="" loading="lazy" /> : <Coffee size={22} strokeWidth={1.3} />}</span><span className={styles.venueInfo}><strong>{item.name_zh}</strong><small>{item.address}</small><span className={hasCover(item) ? styles.readyTag : styles.missingTag}>{hasCover(item) ? "已配图" : "待配图"} · {getVenueFeatures(item, catalog).length} 项特色</span></span><ArrowRight size={15} /></button>)}</div>
              <div className={styles.listFooter}><span>一次专注一家店</span><button onClick={refreshVenues} disabled={busy}>刷新资料</button></div>
            </aside>
            <section className={`${styles.editor} ${!selected ? styles.mobileHidden : ""}`} aria-label="门店资料编辑">
              {!venue ? <div className={styles.editorEmpty}><span><ImagePlus size={40} strokeWidth={1.2} /></span><h2>下一家好店，从这里开始</h2><p>从左侧选择一家门店，添加照片和特色。</p><small>建议使用清晰的门头、室内或咖啡照片</small></div> : <>
                <div className={styles.editorHeading}><button className={styles.mobileBack} onClick={() => chooseVenue(null)} disabled={busy}><ArrowLeft size={17} />门店列表</button><div className={styles.sectionLabel}><span>门店资料</span><span>{hasCover(venue) ? "已有封面，可替换" : "等待第一张照片"}</span></div><h2>{venue.name_zh}</h2><p>{venue.address}</p></div>
                <div className={styles.editorTabs} aria-label="编辑内容">{([["photo", "封面照片"], ["features", "门店特色"]] as const).map(([tab, label]) => <button key={tab} aria-pressed={editorTab === tab} disabled={busy} onClick={() => setEditorTab(tab)}>{label}{(tab === "photo" ? photo : featureDirty) ? " · 未保存" : ""}</button>)}</div>
                <div hidden={editorTab !== "features"}>
                  <FeatureEditor catalog={catalog} key={`${venue.id}:${JSON.stringify([venue.serving, venue.services, venue.tags])}`} venue={venue} busy={busy} allowNext={!photo} onDirty={setFeatureDirty} onBusy={(value) => { operation.current = value; setPhase(value ? "正在保存门店特色…" : ""); }} onSaved={featuresSaved} />
                </div>
                <div hidden={editorTab !== "photo"}>
                <div className={styles.editorBody}>
                  <div className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`} onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
                    {photo || hasCover(venue) ? <div className={styles.coverPreview}><img src={photo?.preview || venue.image_url!} alt={`${venue.name_zh}封面预览`} /><span>{photo ? "新封面 · 尚未保存" : "当前封面"}</span></div> : <div className={styles.uploadEmpty}><span><Upload size={30} strokeWidth={1.4} /></span><h3>把照片拖到这里</h3><p>也可以从手机相册或电脑中选择</p></div>}
                    <div className={styles.uploadActions}><button className={styles.secondary} onClick={() => fileInput.current?.click()} disabled={busy}><ImagePlus size={18} />{photo || hasCover(venue) ? "更换照片" : "选择照片"}</button><span>自动压缩 · 无需重命名</span></div>
                  </div>
                  <input ref={fileInput} className={styles.fileInput} aria-label="选择封面照片" type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void selectFile(file); }} />
                  {photo ? <div className={styles.photoInfo}><div><strong>{photo.filename}</strong><small>{photo.width} × {photo.height} · {formatBytes(photo.originalBytes)} → {formatBytes(photo.blob.size)}</small></div><button aria-label="放弃新照片" disabled={busy} onClick={() => { setPhoto(null); uploadedPath.current = null; setSaveError(""); }}><X size={18} /></button></div> : <p className={styles.tip}>首轮每家补一张封面即可。横向照片更适合列表展示，图片最长边会缩至 1600 像素。</p>}
                  {phase && <p className={styles.phase} role="status">{phase}</p>}
                  {saveError && <div className={styles.error} role="alert"><p>{saveError}</p><button onClick={refreshVenues} disabled={busy}>刷新门店资料</button></div>}
                </div>
                <footer className={styles.saveBar}><span>{featureDirty ? "特色尚未保存，请先保存特色再前往下一家" : photo ? "确认预览后，将更新门店封面" : "选择新照片后即可保存"}</span><div><button className={styles.secondary} disabled={!photo || busy} onClick={() => void save(false)}>保存封面</button><button className={styles.primary} disabled={!photo || busy || featureDirty} onClick={() => void save(true)}>保存并下一家<ArrowRight size={17} /></button></div></footer>
                </div>
              </>}
            </section>
          </div>}
          <p className={styles.footnote}>COFFEE MAP STUDIO <span>·</span> 上海咖啡馆，慢慢收集。</p>
        </main>
      )}
    </div>
  );
}

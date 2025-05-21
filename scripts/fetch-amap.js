import fs from "fs";
import { parse } from "csv-parse/sync";
import { createObjectCsvWriter } from "csv-writer";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { AMAP_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY } =
  process.env;
const sb = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY);
// ============ 1. 读取 “店名+城市” CSV 清单 =============================
/* CSV 格式: id?,name,city  —— id 列可省略 */
// const rows = parse(fs.readFileSync("data/shops.csv"), {
//   columns: true,
//   skip_empty_lines: true,
// });
// ============ 1. 读取 “店名+城市” CSV 清单（自动识别分隔符） ============
/*
+   Numbers 在中文地区导出的 CSV 默认用 “;” 分隔，英语地区用 “,”。
+   以下逻辑先读第一行，判断分隔符，然后再 parse。
+*/

const raw = fs.readFileSync("data/shops.csv", "utf8");
const firstLine = raw.split(/\r?\n/)[0];
const delimiter =
  firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
// ── 读完后立即去重：同名＋城市出现多次时，只保留“第一条”
const rawRows = parse(raw, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  delimiter, // ← 关键：动态传入 , 或 ;
});
// const rows = Array.from(
//   new Map(rawRows.map(r => [`${r.name}|${r.city}`, r])).values()
// );
const rows = Array.from(
  new Map(rawRows.map((r) => [`${r.name}|${r.city}`, r])).values(),
);

// console.log(rows.slice(0, 3)); // 先看前 3 条
// process.exit(0);

// async function pullOne({ id, name, city }) {
//   const url =
//     `https://restapi.amap.com/v3/place/text` +
//     `?key=${AMAP_KEY}` +
//     `&keywords=${encodeURIComponent(name)}` +
//     `&city=${encodeURIComponent(city)}` +
//     `&extensions=all&output=json`;

//   const r = await fetch(url).then((r) => r.json());
//   const poi = r.pois?.[0];
//   if (!poi) return null;

//   const [lng, lat] = poi.location.split(",").map(Number);

// ============ 2. 单条 POI 拉取逻辑 =====================================
async function fetchOne({ id, name, city }) {
  /* 2-1 组装高德 API URL
     - types=050000 → 只要咖啡馆
     - extensions=all → 返回 tel、business_hours */
  const url =
    `https://restapi.amap.com/v3/place/text?key=${AMAP_KEY}` +
    `&keywords=${encodeURIComponent(name)}` +
    `&city=${encodeURIComponent(city)}` +
    `&types=050000` +
    `&citylimit=true` + // ← 只返回指定城市
    `&output=json&extensions=all`;

  const res = await fetch(url).then((r) => r.json());
  const pois = res.pois || [];
  if (pois.length === 0) return null;

  // 营业时间（business_hours 可能为数组）
  // let hours = [];
  // (poi.business_hours || []).forEach((b) => {
  //   hours.push([b.week, b.open_time.slice(0, 5), b.close_time.slice(0, 5)]);
  // });
  /* 2-2 取“第一个地址包含城市名”的 POI；否则用第 1 个 */
  const poi = pois.find((p) => p.address?.includes(city)) || pois[0];
  if (!poi.location) return null;

  const [lng, lat] = poi.location.split(",").map(Number);

  /* 2-3 营业时间映射到 hours_json */
  const hoursArr = (poi.business_hours || []).map((b) => [
    b.week,
    b.open_time.slice(0, 5),
    b.close_time.slice(0, 5),
  ]);

  return {
    // 若 CSV 有 id 就用，没有则让数据库 uuid 默认值生成
    ...(id ? { id } : {}),
    name_zh: name,
    city,
    address: poi.address || "",
    tel: poi.tel || "",
    lat,
    lng,
    hours_json: hoursArr.length ? JSON.stringify({ default: hoursArr }) : null,
  };
}

// (async () => {
//   const out = [];
//   for (const row of rows) {
//     console.log("⏳", row.name);
//     const rec = await pullOne(row);
//     if (rec) {
//       out.push(rec);
//       console.log("✅", row.name, rec.tel);
//     } else {
//       console.warn("⚠️  未找到", row.name);
//     }
//     await new Promise((r) => setTimeout(r, 200)); // 200 ms 间隔
//   }

//   // ② 写本地 CSV 备份
//   const csv = createObjectCsvWriter({
//     path: "data/venues_raw.csv",
//     header: Object.keys(out[0]).map((k) => ({ id: k, title: k })),
//   });
//   await csv.writeRecords(out);
//   console.log("📄 CSV 写入完成 data/venues_raw.csv");

//   // ③ 直接 upsert 到 Supabase
//   const { error } = await sb.from("venues").upsert(out);
//   if (error) console.error("❌ Supabase 导入失败", error);
//   else console.log("🎉 已导入 Supabase");
// })();

// ============ 3. 主流程：循环→高德→写 CSV→upsert Supabase ===========
(async () => {
  const records = [];

  for (const row of rows) {
    console.log("⏳ 抓取", row.name);
    const rec = await fetchOne(row);
    if (rec) {
      records.push(rec);
      console.log("✅", row.name, rec.tel || "无电话");
    } else {
      console.warn("⚠️ 未找到 POI:", row.name);
    }
    await new Promise((r) => setTimeout(r, 200)); // 简单限流
  }
  /* 3-1 备份写本地 CSV */
  if (records.length) {
    const writer = createObjectCsvWriter({
      path: "data/venues_raw.csv",
      header: Object.keys(records[0]).map((k) => ({ id: k, title: k })),
    });
    await writer.writeRecords(records);
    console.log("📄 已写 data/venues_raw.csv");
  }
  /* 3-2 Upsert 到 Supabase —— onConflict 指定 name_zh+city */
  // const { error } = await sb
  //   .from("venues")
  //   .upsert(records, { onConflict: "name_zh,city" });
  // ── 再次去重：保留“最新抓取”一条（覆盖旧 POI 数据）
  const latestMap = new Map();
  records.forEach((r) => latestMap.set(`${r.name_zh}|${r.city}`, r)); // 后写覆盖
  const deduped = Array.from(latestMap.values());

  const { error } = await sb
    .from("venues")
    .upsert(deduped, { onConflict: "name_zh,city" });

  if (error) {
    console.error("❌ 写 Supabase 失败：", error);
  } else {
    console.log(`🎉 成功写入/更新 ${records.length} 条`);
  }
})();

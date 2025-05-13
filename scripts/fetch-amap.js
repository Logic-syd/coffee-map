// scripts/fetch-amap.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import fetch from "node-fetch";
import { createObjectCsvWriter } from "csv-writer";

// 自动创建 data 目录
if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

const key = process.env.NEXT_PUBLIC_AMAP_KEY;
if (!key) {
  console.error("❌ 请在 .env.local 里设置 NEXT_PUBLIC_AMAP_KEY");
  process.exit(1);
}

// ① 把这 10 家店的 id 换成你的店名和城市
const shops = [
  { id: "1", name: "街垒Bunker", city: "上海" },
  { id: "2", name: "嗝geer", city: "上海" },
  { id: "3", name: "Liquid's Tag", city: "上海" },
  { id: "4", name: "懒海COZY SEA", city: "上海" },
  { id: "5", name: "Farside月之暗面", city: "上海" },
  { id: "6", name: "WE CHEERS", city: "上海" },
  { id: "7", name: "啤酒妙Beer Temple", city: "上海" },
  { id: "8", name: "Tap That(武定路店)", city: "上海" },
  { id: "9", name: "造浪BEER WAVE", city: "上海" },
  { id: "10", name: "2062Tap Room", city: "上海" },
  { id: "11", name: "WILLSTUDIO & WILLPUB", city: "上海" },
  { id: "12", name: "山人精酿酒馆", city: "上海" },
  // …共 10 条
];

async function fetchShop(s) {
  const url =
    `https://restapi.amap.com/v3/place/text?key=${key}` +
    `&keywords=${encodeURIComponent(s.name)}` +
    `&city=${encodeURIComponent(s.city)}` +
    `&extensions=all&output=JSON`;

  const res = await fetch(url);
  const json = await res.json();
  const poi = json.pois?.[0];
  if (!poi) {
    console.warn(`⚠️ 没找到：${s.name}`);
    return {
      id: s.id,
      name: s.name,
      city: s.city,
      address: "",
      tel: "",
      lat: "",
      lng: "",
      hours_json: "",
    };
  }

  const [lng, lat] = poi.location?.split(",") || ["", ""];
  // 解析营业时间（可能是多个段）
  const bh = poi.business_hours || [];
  const hoursArr = bh.map((b) => {
    // b.week: '周一至周日' 或 '周末'
    // b.open_time: '08:00:00'
    // b.close_time: '18:00:00'
    // 你可以根据需要再格式化 AM/PM 之类
    return [b.week, b.open_time.slice(0, 5), b.close_time.slice(0, 5)];
  });

  return {
    id: s.id,
    name: s.name,
    city: s.city,
    address: poi.address || "",
    tel: poi.tel || "",
    lat: lat,
    lng: lng,
    hours_json: JSON.stringify({ default: hoursArr }),
  };
}

async function main() {
  const csvWriter = createObjectCsvWriter({
    path: "data/raw.csv",
    header: [
      { id: "id", title: "id" },
      { id: "name", title: "name_zh" },
      { id: "city", title: "city" },
      { id: "address", title: "address" },
      { id: "tel", title: "tel" },
      { id: "lat", title: "lat" },
      { id: "lng", title: "lng" },
      { id: "hours_json", title: "hours_json" },
    ],
  });

  const records = [];
  for (const shop of shops) {
    console.log(`⏳ 正在抓取 ${shop.name}…`);
    const rec = await fetchShop(shop);
    console.log(`✅ ${shop.name}`, rec.address, rec.tel);
    records.push(rec);
    // 适当加点延迟，避免短时间打满限流
    await new Promise((r) => setTimeout(r, 200));
  }

  await csvWriter.writeRecords(records);
  console.log("🎉 数据已写入 data/raw.csv");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

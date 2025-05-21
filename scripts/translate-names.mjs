/***********************************************************************
 * scripts/translate-names.mjs
 * 1. 读取 Supabase venues 表，找 name_ja/ko/eng 为 NULL 的行
 * 2. 根据店名语种判定（中文 / 英文 / 中英混合）
 * 3. 调 OpenAI 一次性翻译 -> ja / ko / en 三语言
 * 4. update venues set name_ja=?, name_ko=?, name_eng=?
 *********************************************************************/
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { franc } from "franc-min";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { jsonrepair } from "jsonrepair";
import fs from "fs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);
// const open = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   baseURL: process.env.OPENAI_BASE_URL,
// });
const open = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL, // 必须指向 DeepSeek
});
const model = process.env.MODEL || "deepseek-chat";

// ---------- 1. 拉需要翻译的记录 ----------
const { data: rows, error } = await sb
  .from("venues")
  .select("id, name_zh, name_eng, name_ja, name_ko")
  .or(
    "name_ja.is.null,name_ja.eq.,name_ko.is.null,name_ko.eq.,and(name_zh.not.is.null,name_eng.is.null),and(name_zh.not.is.null,name_eng.eq.)",
  ) // 匹配 日语/韩语为空 或 有中文无英文
  .limit(500); // 一次最多 500 条

if (error) {
  console.error(error);
  process.exit(1);
}
if (!rows.length) {
  console.log("✅ 无需翻译");
  process.exit(0);
}

console.log("需要翻译", rows.length, "条");

// ---------- 2. 组装要翻译的文案 ----------
function detectLang(text) {
  // franc 检测 zh=cmn, en=eng, ko=kor, ja=jpn
  const code = franc(text, { minLength: 2 });
  return code === "cmn"
    ? "zh"
    : code === "kor"
      ? "ko"
      : code === "jpn"
        ? "ja"
        : "en";
}

// 把所有要翻译的文本拼接到一个 prompt，减少 token
// let prompt =
//   "请把下列咖啡店名称翻译为日语、韩语、英语三种版本，输出 JSON 数组：\n" +
//   '[{"id":数字,"ja":"...","ko":"...","en":"..."}]\n\n';
// rows.forEach((r) => {
//   const src = r.name_zh || r.name_eng;
//   const lang = detectLang(src);
//   prompt += `${r.id}. (${lang}) ${src}\n`;
// });
// let prompt = 'Translate the following coffee shop names into JA, KO, EN. '
//          + 'Return ONLY JSON array named "data": '
//          + '{"data":[{id, ja, ko, en}]}\n\n';
const BATCH = 30;
for (let i = 0; i < rows.length; i += BATCH) {
  const slice = rows.slice(i, i + BATCH);

  /* ---------- 生成翻译请求 Prompt ---------- */
  let prompt =
    `You are a professional translator specializing in coffee shop/cafe names.\n` +
    `For EACH coffee-shop name below, follow the rules EXACTLY and return pure JSON in the form {"data":[{id, ja, ko, en}]}.\n\n` +
    `Rules:\n` +
    `1. ALWAYS translate the Chinese name into clear, natural-sounding English (en), Japanese (ja), and Korean (ko).\n` +
    `2. The English name (en) is MOST important - it must capture the meaning and feeling of the original Chinese name.\n` +
    `3. For cafes/coffee shops with distinctive concepts (e.g., related to art, nature, etc.), reflect that concept in all translations.\n` +
    `4. NEVER leave any translation field empty. All ja, ko, and en fields must contain appropriate translations.\n` +
    `5. For proper nouns or specific terms, ensure appropriate capitalization in English.\n` +
    `6. For Japanese translations, PRIORITIZE using kanji (漢字) over katakana whenever possible. Use traditional, meaningful Japanese words rather than phonetic transcriptions. For example, use "珈琲" instead of "コーヒー" for coffee, "森" instead of "フォレスト" for forest.\n` +
    `7. JSON ONLY, no markdown, no extra keys.\n\n` +
    `Example:\n` +
    `Input: 1. (zh) 映山红咖啡\n` +
    `Output: {"id":1,"ja":"躑躅珈琲","ko":"진달래 카페","en":"Azalea Coffee"}\n` +
    `Input: 2. (zh) 黑羊咖啡\n` +
    `Output: {"id":2,"ja":"黒羊珈琲","ko":"블랙 쉽 커피","en":"Black Sheep Coffee"}\n\n`;

  slice.forEach((r) => {
    const src = r.name_zh || r.name_eng;
    const lang = detectLang(src); // zh / en / ja / ko
    prompt += `${r.id}. (${lang}) ${src}\n`;
  });

  console.log("⏳ 调用 OpenAI…");

  // const chat = await open.chat.completions.create({
  //   model,
  //   temperature: 0.3,
  //   messages: [
  //     { role: "system", content: "You are a professional translator." },
  //     { role: "user", content: prompt },
  //   ],
  // });
  const chat = await open.chat.completions.create({
    model,
    temperature: 0.3,
    max_tokens: 4000,
    // 告诉 DeepSeek：别加解释，直接给 JSON
    response_format: { type: "json_object" }, // DeepSeek 兼容 OpenAI 参数
    messages: [
      // { role: "system", content: "You are a professional translator." },
      // { role: "user", content: prompt },
      {
        role: "system",
        content:
          "You are a professional translator,you will translate some coffee shops' name.You should translate accurately and elegantly, and it should look like a coffee shop name." +
          "Return ONLY raw JSON, no explanation.",
      },
      { role: "user", content: prompt },
    ],
  });
  let text = chat.choices[0].message.content.trim();

  console.log("原始返回内容：", text);

  // ---- 解析：先直接 parse，失败就 repair 后再 parse ----
  let translatedArr;
  try {
    translatedArr = JSON.parse(text).data; // 期望 {"data":[…]}
  } catch {
    try {
      translatedArr = JSON.parse(jsonrepair(text)).data;
    } catch {
      // 把失败的批写入 logs/bad_batch_<timestamp>.txt 方便人工检查
      fs.mkdirSync("logs", { recursive: true });
      fs.writeFileSync(`logs/bad_batch_${Date.now()}.txt`, text, "utf8");
      console.warn(
        `⚠️ 解析失败，已保存日志，跳过本批 (${slice[0].id} ~ ${slice.at(-1).id})`,
      );
      continue; // 跳过
    }
  }
  // ---- 最新 wins 去重 (id 为唯一键) --------------------------
  const latestMap = new Map();
  translatedArr.forEach((o) => latestMap.set(o.id, o));
  const deduped = Array.from(latestMap.values());

  console.log("⚡️ 翻译完成");

  // ---------- 3. 更新数据库 ----------
  const updates = deduped.map((o) => ({
    id: o.id,
    name_ja: o.ja === "" ? null : o.ja, // 确保空字符串转为null
    name_ko: o.ko === "" ? null : o.ko,
    name_eng: o.en === "" ? null : o.en,
  }));

  const { error: upErr } = await sb
    .from("venues")
    .upsert(updates, { onConflict: "id" });
  if (upErr) console.error(upErr);
  else console.log("🎉 已更新", updates.length, "行");
}

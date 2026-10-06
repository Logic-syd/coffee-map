import { resolveLanguage } from "./locale.ts";
import { matchesText } from "../utils/search-text.ts";
export type FeatureLocale = "zh-CN" | "en" | "ja" | "ko";
export type FeatureGroup = "coffee" | "drinks" | "food" | "amenities";
export type FeatureField = "serving" | "services" | "tags";
type Labels = Record<FeatureLocale, string>;
export type VenueFeature = {
  id: string;
  labels: Labels;
  group: FeatureGroup;
  field: FeatureField;
  inFilters: boolean;
  inDetails: boolean;
  aliases: string[];
  active?: boolean;
  revision?: number;
  sortOrder?: number;
};
export type VenueFeatureData = {
  serving?: string[] | null;
  services?: string[] | null;
  tags?: string[] | null;
};

const labels = (zh: string, en: string, ja: string, ko: string): Labels => ({
  "zh-CN": zh,
  en,
  ja,
  ko,
});
const feature = (
  id: string,
  group: FeatureGroup,
  field: FeatureField,
  inFilters: boolean,
  names: Labels,
  aliases: string[] = [],
): VenueFeature => ({
  id,
  group,
  field,
  inFilters,
  inDetails: true,
  labels: names,
  aliases,
});

// A venue selects a feature once. Placement belongs to this catalog, not to each venue.
export const VENUE_FEATURES: VenueFeature[] = [
  feature(
    "signature_coffee",
    "coffee",
    "serving",
    true,
    labels(
      "特调咖啡",
      "Signature coffee",
      "お店のオリジナルコーヒー",
      "시그니처 커피",
    ),
  ),
  feature(
    "espresso",
    "coffee",
    "serving",
    true,
    labels("意式咖啡", "Espresso", "エスプレッソ", "에스프레소"),
    ["italian coffee"],
  ),
  feature(
    "hand_drip",
    "coffee",
    "serving",
    true,
    labels("手冲咖啡", "Pour-over", "ハンドドリップ", "핸드드립"),
    ["handdrip", "hand_brew", "hand drip coffee", "pour_over"],
  ),
  feature(
    "cold_brew",
    "coffee",
    "serving",
    true,
    labels("冷萃咖啡", "Cold brew", "コールドブリュー", "콜드브루"),
    ["coldbrew", "cold brew/drip"],
  ),
  feature(
    "non_coffee",
    "drinks",
    "serving",
    true,
    labels(
      "非咖啡饮品",
      "Non-coffee drinks",
      "コーヒー以外の飲み物",
      "논커피 음료",
    ),
  ),
  feature(
    "alcoholic_drinks",
    "drinks",
    "serving",
    true,
    labels("含酒精饮品", "Alcoholic drinks", "アルコール飲料", "알코올 음료"),
    ["alcoholic coffee/drinks"],
  ),
  feature(
    "plant_milk",
    "drinks",
    "serving",
    true,
    labels("植物奶", "Plant-based milk", "植物性ミルク", "식물성 우유"),
    ["plantbasic_milk", "plant-based milk"],
  ),
  feature(
    "brunch",
    "food",
    "serving",
    true,
    labels("早午餐", "Brunch", "ブランチ", "브런치"),
  ),
  feature(
    "dessert",
    "food",
    "serving",
    true,
    labels("甜点", "Dessert", "デザート", "디저트"),
  ),
  feature(
    "free_wifi",
    "amenities",
    "services",
    true,
    labels("免费 Wi-Fi", "Free Wi-Fi", "無料 Wi-Fi", "무료 와이파이"),
    ["wifi"],
  ),
  feature(
    "english_menu",
    "amenities",
    "services",
    true,
    labels("英文菜单", "English menu", "英語メニュー", "영어 메뉴"),
  ),
  feature(
    "credit_cards",
    "amenities",
    "services",
    true,
    labels("支持刷卡", "Card payment", "カード決済", "카드 결제"),
    ["credit"],
  ),
  feature(
    "restroom",
    "amenities",
    "services",
    true,
    labels("卫生间", "Restroom", "トイレ", "화장실"),
  ),
  feature(
    "instagram_worthy",
    "amenities",
    "tags",
    true,
    labels(
      "适合拍照",
      "Photogenic space",
      "写真映えする空間",
      "사진 찍기 좋은 공간",
    ),
  ),
  feature(
    "pet_friendly",
    "amenities",
    "services",
    true,
    labels("宠物友好", "Pet friendly", "ペット同伴可", "반려동물 동반"),
  ),
  feature(
    "outdoor_seating",
    "amenities",
    "services",
    true,
    labels("户外座位", "Outdoor seating", "屋外席", "야외 좌석"),
    ["outside seating"],
  ),
  feature(
    "non_smoking",
    "amenities",
    "services",
    true,
    labels("禁烟", "Non-smoking", "禁煙", "금연"),
  ),
  feature(
    "draft_beer",
    "drinks",
    "serving",
    false,
    labels("生啤", "Draft beer", "生ビール", "생맥주"),
  ),
  feature(
    "bottle_shop",
    "drinks",
    "serving",
    false,
    labels("瓶装精酿", "Bottle shop", "ボトルショップ", "병맥주 판매"),
  ),
  feature(
    "filter_coffee",
    "coffee",
    "serving",
    false,
    labels("滤泡咖啡", "Filter coffee", "フィルターコーヒー", "필터 커피"),
    ["filter"],
  ),
  feature(
    "batch_brew",
    "coffee",
    "serving",
    false,
    labels("批量滤泡", "Batch brew", "バッチブリュー", "배치 브루"),
  ),
  feature(
    "nitro_coffee",
    "coffee",
    "serving",
    false,
    labels("氮气咖啡", "Nitro coffee", "ナイトロコーヒー", "니트로 커피"),
    ["nitro"],
  ),
  feature(
    "decaf_coffee",
    "coffee",
    "serving",
    false,
    labels("低因咖啡", "Decaf coffee", "デカフェ", "디카페인 커피"),
  ),
  feature(
    "breakfast",
    "food",
    "serving",
    false,
    labels("早餐", "Breakfast", "朝食", "아침 식사"),
  ),
  feature(
    "lunch",
    "food",
    "serving",
    false,
    labels("午餐", "Lunch", "ランチ", "점심 식사"),
  ),
  feature(
    "vegan_options",
    "food",
    "serving",
    false,
    labels("纯素选项", "Vegan options", "ヴィーガン対応", "비건 메뉴"),
    ["vegan", "vagan options"],
  ),
  feature(
    "laptop_friendly",
    "amenities",
    "services",
    false,
    labels(
      "适合带电脑",
      "Laptop friendly",
      "パソコン利用可",
      "노트북 이용 가능",
    ),
    ["laptop"],
  ),
  feature(
    "english_service",
    "amenities",
    "services",
    false,
    labels(
      "可用英语沟通",
      "English-speaking service",
      "英語対応",
      "영어 응대 가능",
    ),
  ),
  feature(
    "cash_only",
    "amenities",
    "services",
    false,
    labels("仅限现金", "Cash only", "現金のみ", "현금만 가능"),
    ["cashonly"],
  ),
  feature(
    "takeaway",
    "amenities",
    "services",
    false,
    labels("可外带", "Takeout", "テイクアウト可", "포장 가능"),
  ),
  feature(
    "late_night",
    "amenities",
    "services",
    false,
    labels("营业至深夜", "Late-night service", "深夜営業", "심야 영업"),
  ),
  feature(
    "kids_friendly",
    "amenities",
    "services",
    false,
    labels("儿童友好", "Kid friendly", "子ども連れ歓迎", "어린이 동반 환영"),
  ),
  feature(
    "dog_friendly",
    "amenities",
    "services",
    false,
    labels("允许带狗", "Dogs welcome", "犬同伴可", "반려견 동반 가능"),
  ),
  feature(
    "wheelchair",
    "amenities",
    "services",
    false,
    labels(
      "轮椅可达",
      "Wheelchair accessible",
      "車椅子対応",
      "휠체어 접근 가능",
    ),
  ),
];

export const FEATURE_GROUPS: { id: FeatureGroup; labels: Labels }[] = [
  { id: "coffee", labels: labels("咖啡", "Coffee", "コーヒー", "커피") },
  {
    id: "drinks",
    labels: labels("其他饮品", "Other drinks", "その他の飲み物", "기타 음료"),
  },
  { id: "food", labels: labels("食物", "Food", "フード", "음식") },
  {
    id: "amenities",
    labels: labels(
      "设施与服务",
      "Amenities & services",
      "設備・サービス",
      "시설 및 서비스",
    ),
  },
];
const fields: FeatureField[] = ["serving", "services", "tags"];
const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
export const resolveFeature = (
  value: string,
  catalog: VenueFeature[] = VENUE_FEATURES,
) => {
  const normalized = normalize(value);
  return catalog.find((item) =>
    [item.id, ...item.aliases].some((alias) => normalize(alias) === normalized),
  );
};
export const featureLocale = (locale: string): FeatureLocale =>
  resolveLanguage("system", [locale]);

export function getVenueFeatures(
  venue: VenueFeatureData,
  catalog: VenueFeature[] = VENUE_FEATURES,
) {
  const ids = new Set(
    fields.flatMap((field) =>
      (venue[field] || []).map((value) => resolveFeature(value, catalog)?.id),
    ),
  );
  return catalog.filter((item) => item.active !== false && ids.has(item.id));
}

export function getUnknownFeatures(
  venue: VenueFeatureData,
  catalog: VenueFeature[] = VENUE_FEATURES,
) {
  return fields.flatMap((field) =>
    (venue[field] || [])
      .filter((value) => {
        if (!value.trim()) return false;
        const item = resolveFeature(value, catalog);
        return !item || item.active === false;
      })
      .map((value) => ({ field, value })),
  );
}

export function serializeFeatures(
  ids: string[],
  original: VenueFeatureData,
  catalog: VenueFeature[] = VENUE_FEATURES,
): Record<FeatureField, string[]> {
  const result: Record<FeatureField, string[]> = {
    serving: [],
    services: [],
    tags: [],
  };
  // Keep ambiguous historical values in their original fields until a human resolves them.
  for (const { field, value } of getUnknownFeatures(original, catalog))
    result[field].push(value);
  for (const item of catalog)
    if (item.active !== false && ids.includes(item.id))
      result[item.field].push(item.id);
  return result;
}

export function matchesFeatureFilters(
  venue: VenueFeatureData,
  selected: string[],
  catalog: VenueFeature[] = VENUE_FEATURES,
) {
  const present = new Set(
    getVenueFeatures(venue, catalog).map((item) => item.id),
  );
  return selected.every(
    (id) =>
      catalog.some(
        (item) => item.id === id && item.inFilters && item.active !== false,
      ) && present.has(id),
  );
}

export function matchesFeatureSearch(
  venue: VenueFeatureData,
  search: string,
  catalog: VenueFeature[] = VENUE_FEATURES,
) {
  return getVenueFeatures(venue, catalog).some((item) =>
    Object.values(item.labels).some((label) => matchesText(label, search)),
  );
}

export function featureLabel(
  feature: VenueFeature,
  locale: FeatureLocale,
): string {
  return (
    feature.labels[locale]?.trim() ||
    feature.labels["zh-CN"]?.trim() ||
    feature.labels.en?.trim() ||
    feature.id
  );
}

export type Language = "en" | "zh-CN" | "ja" | "ko";

// 多语言文本字典
const translations = {
  // 菜单及通用文本
  "menu.home": {
    en: "Home",
    "zh-CN": "首页",
    ja: "ホーム",
    ko: "홈",
  },
  "menu.support": {
    en: "Support",
    "zh-CN": "支持",
    ja: "サポート",
    ko: "지원",
  },
  "menu.share": {
    en: "Share",
    "zh-CN": "分享",
    ja: "シェア",
    ko: "공유",
  },
  "menu.about": {
    en: "About",
    "zh-CN": "关于",
    ja: "について",
    ko: "소개",
  },
  "menu.cityGuide": {
    en: "City Guide",
    "zh-CN": "城市指南",
    ja: "都市ガイド",
    ko: "도시 가이드",
  },
  "action.back": {
    en: "Back",
    "zh-CN": "返回",
    ja: "戻る",
    ko: "뒤로",
  },
  "action.close": {
    en: "Close",
    "zh-CN": "关闭",
    ja: "閉じる",
    ko: "닫기",
  },

  // 筛选分类与特殊筛选
  "filter.favourites": {
    en: "Favourites",
    "zh-CN": "收藏",
    ja: "お気に入り",
    ko: "즐겨찾기",
  },
  "filter.openCafes": {
    en: "Open Now",
    "zh-CN": "营业中",
    ja: "営業中",
    ko: "영업 중",
  },
  "filter.filterCoffee": {
    en: "Coffee",
    "zh-CN": "咖啡",
    ja: "コーヒー",
    ko: "커피",
  },
  "filter.drinks": {
    en: "Drinks",
    "zh-CN": "饮品",
    ja: "ドリンク",
    ko: "음료",
  },
  "filter.food": {
    en: "Food",
    "zh-CN": "食物",
    ja: "フード",
    ko: "음식",
  },
  "filter.amenities": {
    en: "Amenities",
    "zh-CN": "设施服务",
    ja: "施設・サービス",
    ko: "편의시설",
  },
  "filter.resetAll": {
    en: "Reset All Filters",
    "zh-CN": "重置所有筛选",
    ja: "すべてのフィルターをリセット",
    ko: "모든 필터 초기화",
  },

  // Coffee 类别标签
  "tag.signature": {
    en: "Signature Coffee",
    "zh-CN": "特调咖啡",
    ja: "シグネチャーコーヒー",
    ko: "시그니처 커피",
  },
  "tag.espresso": {
    en: "Espresso",
    "zh-CN": "意式咖啡",
    ja: "エスプレッソ",
    ko: "에스프레소",
  },
  "tag.drip": {
    en: "Hand Drip",
    "zh-CN": "手冲咖啡",
    ja: "ハンドドリップ",
    ko: "핸드드립",
  },
  "tag.coldbrew": {
    en: "Cold Brew",
    "zh-CN": "冷萃咖啡",
    ja: "コールドブリュー",
    ko: "콜드브루",
  },

  // Drinks 类别标签
  "tag.noncoffee": {
    en: "Non-Coffee Drinks",
    "zh-CN": "非咖啡饮品",
    ja: "コーヒー以外の飲み物",
    ko: "논커피 음료",
  },
  "tag.alcohol": {
    en: "Alcoholic Coffee",
    "zh-CN": "酒精类咖啡",
    ja: "アルコール飲料",
    ko: "알콜 음료",
  },
  "tag.plantmilk": {
    en: "Plant-Based Milk",
    "zh-CN": "植物奶",
    ja: "植物性ミルク",
    ko: "식물성 우유",
  },

  // Food 类别标签
  "tag.brunch": {
    en: "Brunch",
    "zh-CN": "早午餐",
    ja: "ブランチ",
    ko: "브런치",
  },
  "tag.dessert": {
    en: "Dessert",
    "zh-CN": "甜点",
    ja: "デザート",
    ko: "디저트",
  },

  // Amenities 类别标签
  "tag.wifi": {
    en: "Free Wi-Fi",
    "zh-CN": "免费Wi-Fi",
    ja: "無料Wi-Fi",
    ko: "무료 와이파이",
  },
  "tag.engmenu": {
    en: "English Menu",
    "zh-CN": "英文菜单",
    ja: "英語メニュー",
    ko: "영어 메뉴",
  },
  "tag.card": {
    en: "Card Payment",
    "zh-CN": "支持刷卡",
    ja: "カード決済",
    ko: "카드결제",
  },
  "tag.restroom": {
    en: "Toilet",
    "zh-CN": "有卫生间",
    ja: "トイレあり",
    ko: "화장실 구비",
  },
  "tag.photogenic": {
    en: "Instag-Worthy",
    "zh-CN": "适合拍照",
    ja: "映えスポット",
    ko: "인스타 감성",
  },
  "tag.pet": {
    en: "Pet Friendly",
    "zh-CN": "宠物友好",
    ja: "ペットOK",
    ko: "반려동물 동반",
  },
  "tag.outdoor": {
    en: "Outdoor Seating",
    "zh-CN": "户外座位",
    ja: "屋外席",
    ko: "야외 좌석",
  },
  "tag.nosmoke": {
    en: "Non-Smoking",
    "zh-CN": "禁烟",
    ja: "禁煙",
    ko: "금연",
  },

  // 仅用于显示，不作为筛选条件
  "venue.serving.draftBeer": {
    en: "Draft Beer",
    "zh-CN": "生啤",
    ja: "生ビール",
    ko: "생맥주",
  },
  "venue.serving.bottleShop": {
    en: "Bottle Shop",
    "zh-CN": "瓶装精酿",
    ja: "ボトルショップ",
    ko: "병맥주 샵",
  },
};

// 翻译文本
export function t(
  key: keyof typeof translations,
  locale: Language = "en",
): string {
  const translation = translations[key];

  if (!translation) return key;

  return translation[locale] || translation["en"] || key;
}

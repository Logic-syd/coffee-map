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

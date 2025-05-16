/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: true, // 添加生产环境sourcemap支持
  i18n: {
    locales: ["zh-CN", "en", "ja", "ko"],
    defaultLocale: "en",
    localeDetection: true, // 自动检测系统语言
  },
};

module.exports = nextConfig;

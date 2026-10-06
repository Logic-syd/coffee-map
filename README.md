# Coffee Map

面向上海门店的咖啡地图，使用 Next.js、MapLibre、Supabase 和 Capacitor。当前目标为先完成上海体验，再进入 iOS TestFlight 和 App Store。

## 本地运行

本次恢复使用 Node.js 24 验证。先安装依赖并创建本机配置：

```bash
npm ci
cp .env.example .env.local
```

在 `.env.local` 中填写 Supabase 项目 URL 和 Publishable key。客户端也兼容旧版 `NEXT_PUBLIC_SUPABASE_ANON_KEY`；请使用公开客户端密钥，不要放入 secret 或 service_role key。随后运行：

```bash
npm run dev
```

打开 http://localhost:3000。静态构建使用 `npm run build`，产物在 `out/`。

## 验证

```bash
npm run check
```

使用 Node.js 24（见 `.nvmrc`）。`check` 依次执行类型检查、lint、测试和正式构建；构建不再跳过类型或 lint 检查。Next.js 中间文件位于 `.next/`，静态导出位于 `out/`。

首页在获得上海范围内的位置后默认显示 5 公里内门店，可切换到浏览全上海；拒绝定位、超时或身在外地时可继续浏览上海门店。位置缓存最多保留 5 分钟。缺少有效营业时间时显示“营业时间待确认”，不会标成已打烊。

原生资源同步使用 `npm run build-ios`，需要完整 Xcode 和 iOS 依赖环境。网页构建成功不代表 iPhone 真机体验、签名或 App Store 审核已验证。

## 只读备份门店

配置好 `.env.local` 后运行：

```bash
node scripts/backup-venues.mjs
```

如果已核对 Dashboard 当前总数，可额外提供 `EXPECTED_VENUE_COUNT`。恢复时核对的数量为 87；以之后实际数量为准。

```bash
EXPECTED_VENUE_COUNT=87 node scripts/backup-venues.mjs
```

脚本只读取 public.venues，按时间创建 `backups/` 下的 JSON、CSV 和校验元数据；该目录已被 Git 忽略。它不备份数据库结构、权限、账户或 Storage 文件。

## 项目记录

- [门店资料后台与配置方法](docs/PHOTO_ADMIN.md)（入口 `/admin`）
- [门店特色、筛选与详情的统一规则](docs/tags.md)
- [整体检查及 iOS 路线](docs/PROJECT_STATUS_2026-10-02.md)
- [87 条门店数据恢复结果](docs/DATA_RECOVERY_2026-10-03.md)
- [分段及跨日营业时间格式](docs/opening-hours.md)

## 四语本地化

菜单中的语言设置支持跟随设备语言、English、日本語、한국어、简体中文。选择保存在本机，切页及重开后保留；关闭本地存储时仍可在本次使用中切换。自动模式按设备语言优先级选取支持的语言，全部不支持时使用英文；缺少店名或标签译文时回退中文。

英文原名在各语言中保留；中文原名使用数据库已有四语翻译。日语、韩语、英语界面同时保留中文原名和地址供辨认、复制与导航。混合名称中的英文品牌不音译，分店说明使用现有译文。

`src/data/venue-name-localizations.ts` 保存有原文匹配条件的显示修正，不写回云端。数据库译文更新后自动优先使用新内容。原始各语名称仍参与搜索，兼容假名、全半角和拉丁字母重音差异；这不代表已支持拼写错误的模糊匹配。待核对的中文品牌读音见 `data/localization/japanese-name-review.json`，不声称是商家官方日文名称。

主应用的菜单、状态、筛选、详情、关于、帮助、分享说明、404 和错误页面使用同一四语字典。店主后台目前保留中文。iOS 定位说明已加入四语资源；系统授权弹窗的语言由 iOS 决定，仍需 Xcode 真机验证。

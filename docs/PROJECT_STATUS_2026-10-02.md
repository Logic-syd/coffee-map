# Coffee Map 项目现状与 iOS 上架计划

> 2026-10-03 更新：Supabase 已恢复，87 条门店数据已备份并接回应用；电话映射和分段营业判断已修复。详见 [数据恢复记录](DATA_RECOVERY_2026-10-03.md)。下文保留首次检查时的状态。

检查日期：2026 年 10 月 2 日。范围：GitHub main 分支提交 `4406894da4e35766af48677db0e456f02e5f402c`，最后提交于 2025 年 5 月 21 日，说明为“导入数据并优化，准备测试”。用户已确认首版聚焦上海，先上 iOS App Store；Supabase 账号还在，项目及数据状态待确认。

目前属于功能已有骨架、尚未完成发布准备的 MVP。现有 Next.js 和 Capacitor 方案可以继续使用，暂未发现必须重写的理由。原样克隆后不能直接构建；补上仅用于本机检查的接口配置后能够生成静态页面。主要缺口是数据恢复与核验、筛选和地图交互、错误处理、iOS 权限和发布材料。

本报告是全项目接手检查，不是某次提交的差异评审。已检查核心页面、数据读取和导入脚本、状态管理、配置及 iOS 工程，并运行依赖安装、类型检查、lint、构建和手机尺寸浏览器检查。尚未登录 Supabase、连接生产数据库、执行数据导入、运行 iOS 模拟器或真机、上传 TestFlight。没有修改业务源码、升级依赖、提交或推送 Git。

## 现有实现

| 部分 | 现状 |
| --- | --- |
| 技术架构 | Next.js 15.3.2，React 实装 19.1.0，TypeScript，Tailwind，MapLibre 5.5.0，Zustand，Supabase，Capacitor 7.2.0 |
| 列表和搜索 | 有门店卡片、多语言店名字段、按名称搜索。用 76 条本地备份测试时正常显示，指定店名搜索返回 1 条 |
| 收藏 | 保存在 localStorage；测试添加 1 家后，收藏列表为 1 条，刷新后仍为 1 条。没有云同步账号体系 |
| 门店详情 | 可打开详情，已有营业时间、服务标签、联系方式、导航和分享的展示代码；数据完整性不足，联系方式还在首页映射中丢失 |
| 地图 | 上海默认位置、标记、小抽屉和详情入口已有实现。地图在本次测试网络下能够显示 |
| 导航和分享 | 有 Apple Maps 等外链，以及 Web Share 和剪贴板逻辑；尚未验证 iOS WebView 中的系统分享和地图跳转 |
| 多语言 | 有中英日韩词典和门店名称字段，但界面多数固定英文或中英混用，语言选择组件没有接入主流程 |
| iOS | 已有 Xcode 工程、图标资源和启动页，Bundle ID 为 com.coffeemap.app；未完成本机原生构建及签名验证 |
| 辅助页面 | About、Support、Share 都是占位文案，没有隐私政策页面 |

## 实际验证结果

| 检查 | 结果与限制 |
| --- | --- |
| 依赖安装 | 使用 lockfile 执行 npm ci，安装 678 个包成功；禁用安装生命周期脚本，lockfile 未变 |
| Node 环境 | 本机默认 v16.20.2；Next 要求至少 18.18，Capacitor CLI 7 要求至少 20。本次使用应用自带 Node v24.19.0，未改系统配置 |
| TypeScript | `tsc --noEmit --incremental false` 失败，12 个诊断：7 个缺失图标模块、未安装 swr、1 个隐式 any、3 个未配置测试环境的 test/expect 错误 |
| Lint | `npm run lint` 通过，7 条警告，涉及字体、图片、Hook 依赖和无效禁用注释 |
| 原样生产构建 | `npm run build` 失败：首页预渲染时报 supabaseUrl is required |
| 本机模拟配置构建 | 临时设置两个 NEXT_PUBLIC_SUPABASE 环境变量后成功静态导出；首页 First Load JS 约 463 kB。接口仅指向 127.0.0.1，不代表云端已经可用 |
| 构建质量门禁 | 生效的 next.config.js 配置了 ignoreBuildErrors 和 ignoreDuringBuilds，因此构建成功没有覆盖上述类型问题 |
| 浏览器 | 独立无头 Chrome，390 × 844 手机视口；76 条备份列表、搜索、收藏持久化和打开详情通过；确认地图和筛选问题，见下表 |
| 依赖审计 | 当日 npm audit 返回 31 个依赖告警：4 critical、15 high、7 moderate、5 low。是依赖树告警，不等于 31 条已在此应用中证实可利用的漏洞；静态 iOS 包不运行 Next 服务端，服务端类漏洞须按部署方式判断 |
| 原生构建 | 未执行。本机选中 /Library/Developer/CommandLineTools，在 /Applications 未发现完整 Xcode；未核实签名账户、证书或 App Store Connect 状态 |

检查日志和原始浏览器结果保存在本机 `/tmp/coffee-map-audit-20261002`。临时目录可能被系统清理。报告旁的 `audit-2026-10-02` 文件夹保留了浏览器结果和截图。

## 数据能恢复到什么程度

| 文件 | 数量 | 内容与限制 |
| --- | --- | --- |
| data/shops.csv | 136 行，按店名和城市去重后 79 家 | 上海店名清单，分号分隔，不是完整门店资料 |
| data/venues_raw.csv | 76 条唯一上海门店 | 有店名、地址、经纬度及部分电话；营业时间列全部为空，没有图片和服务标签列 |
| data/raw.csv | 12 家 | 较早的本地备份 |
| public/data/venues.min.json 及 gzip 文件 | 各 12 家 | GeoJSON，所有营业时间列表为空，没有图片、serving、services 或 tags 内容 |
| Supabase venues | 未确认 | 首页真正读取此表；仓库中没有环境配置、建表迁移或 RLS 策略，不能据本地备份推断云端记录数或权限状态 |

本地预览将 76 条 CSV 记录转换为当前首页期待的接口格式，使用临时 ID 和空营业时间，便于恢复界面检查。这些数据未导入 Supabase，也不是整理完成的发布数据。浏览器测试另使用 2 条明确标记的模拟记录，验证甜点筛选错误；这些记录没有写入仓库数据。

恢复云端之前先检查原项目状态，导出数据并记录表结构和读取权限，再决定修复原项目还是重建。前端只需要公共 URL 和适当的匿名或 publishable key；服务端权限密钥不能放进 NEXT_PUBLIC 变量。数据抓取和 AI 翻译脚本涉及外部请求及数据库写入，本次没有执行。

## 已确认的主要问题

| 优先级 | 问题及证据 | 完成条件 |
| --- | --- | --- |
| P0 | 缺配置即无法启动或构建。src/lib/supabase.ts 第 3 至 6 行在模块加载时创建客户端；没有配置校验、示例环境文件或备用数据接入 | 提供可复现的开发配置；缺配置时给出可理解提示；云端不可用时能显示缓存或明确错误 |
| P0 | 筛选逻辑与界面不一致。FilterSheet 的 13 个键在首页 labelMap 中没有映射，包含 dessert、espresso、brunch、favourites。带 dessert 标签的测试记录被过滤掉，结果由 2 条变为 0 条 | 统一筛选模型和标签规范，收藏条件使用收藏状态，每个展示出来的筛选项有可验证行为 |
| P0 | 地图忽略搜索和筛选。src/app/page.tsx 第 241 行把原始 venues 传给地图；搜索列表为 1 家时地图仍有 76 个标记 | 列表与地图使用同一份过滤后的数据，切换模式保留条件 |
| P0 | 地图模式下高级筛选按钮无内容。FilterSheet 仅在列表分支渲染；浏览器点击地图模式 Filters 后没有 Reset All Filters 或筛选面板 | 筛选面板在两种模式都能打开、修改及关闭 |
| P0 | 接口失败静默显示空列表。首页只 console.error；模拟 HTTP 500 后页面只有 Open Now、Dessert，无错误说明或重试 | 区分加载中、无匹配结果、接口失败和离线，提供明确反馈及恢复方式 |
| P1 | 类型检查失败却被构建跳过；并存 3 个 Next 配置、2 个 Tailwind 配置和 2 个 ESLint 配置，存在遗留未使用代码 | 清理缺失图标和未用 hook，配置有效测试工具，统一配置，恢复类型和 lint 门禁 |
| P1 | 详情联系方式没有接入。首页映射只保留特定字段，未保留 contacts 或把 tel 归入 contacts；详情只读取 v.contacts | 定义统一 Venue 数据模型，并验证电话及网站入口 |
| P1 | 数据生成脚本不完整。scripts/convert.mjs 第 60 行使用未声明的 json，环境变量命名也与抓取脚本不一致；gzip 写入代码已注释 | 本地转换与云端写入分开，支持校验和预览，不让数据整理依赖隐含配置 |
| P1 | 多语言接入不完整，搜索占位文案声称支持标签，但当前只搜索店名 | 首版明确支持的界面语言，统一语言状态、文案和搜索承诺 |
| P1 | 当前地图关闭 attributionControl，使用无 key 的 CARTO URL | 按供应商现行要求恢复地图署名，确认 API key、使用条件及中国大陆网络表现 |

13 个缺少映射的筛选键：favourites、signature_coffee、espresso、hand_drip、non_coffee、alcoholic_drinks、brunch、dessert、english_menu、restroom、instagram_worthy、pet_friendly、non_smoking。

地图使用 MapLibre，官方说明其经纬度采用 WGS84；导入脚本直接保存高德 POI 的坐标，仓库没有统一坐标系的处理。云端坐标来源和既有数据是否已转换尚未确认，需要抽查真实店址后决定转换策略，不能把本次预览当作定位精度验证。[MapLibre 坐标说明](https://maplibre.org/maplibre-gl-js/docs/API/classes/LngLat/)

## iOS 发布仍需完成

应用没有定位用途说明文案，定位调用使用 navigator.geolocation；分享使用 navigator.share 或 clipboard，导航是网页外链。这些流程需要在 iPhone 上测试授权允许、拒绝、再次进入、后台恢复及系统应用跳转，再决定需要哪些 Capacitor 原生插件。页面使用固定高度和底部按钮，尚未验证安全区、键盘、横屏及 iPad。

仓库已有 1024 × 1024 图标资源和启动页，不能把“文件存在”视为发布视觉验收通过。关于、支持和分享占位页必须完成或移除，同时准备真实的支持渠道、应用介绍、隐私政策、截图、版本号和审核说明。

Apple 要求应用内及 App Store Connect 中都提供隐私政策链接；当前项目缺少这一入口。Capacitor 依赖已经带有 PrivacyInfo.xcprivacy，不能简单认定所有隐私清单都缺失；仍需在最终归档中核对应用和所用 SDK 的声明，并按实际数据处理填写隐私信息。[Apple 审核指南](https://developer.apple.com/app-store/review/guidelines/)

Apple 自 2026 年 4 月 28 日起要求上传的 iOS 应用使用 iOS 26 SDK 或更高版本构建。需要准备满足该要求的完整 Xcode，配置开发者团队及签名，先完成真机和 TestFlight 验证。[Apple SDK 要求](https://developer.apple.com/news/?id=ueeok6yw)

Capacitor 本身不是必须重写的理由；审核仍看应用的实用性、内容和体验。上海门店信息质量、收藏、可靠定位与导航、离线或弱网体验应组成一个完整使用流程。是否通过审核不能由技术栈或本次静态检查保证。[Apple 最低功能要求](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality)

CARTO 的现行条款要求使用 API key 并展示 OpenStreetMap 和 CARTO 署名，免费与商业使用另有条件。当前代码的关闭署名行为需要修复，正式选择地图服务时要同时核实授权、费用、网络和坐标要求。[CARTO 条款](https://carto.com/legal/basemap-terms/)

## 建议执行顺序与验收条件

| 阶段 | 工作 | 验收条件 |
| --- | --- | --- |
| 1 恢复可维护的运行基线 | 核实并备份 Supabase；建立环境示例和 Node 版本约束；清理配置、类型错误与未用代码；升级存在告警的关键依赖并回归；建立数据模型和本地备用数据 | 新检出可按 README 启动；typecheck、lint、build 均通过；数据缺失或网络失败时有明确反馈 |
| 2 完成上海首版体验 | 修好全部筛选和地图联动；接通联系方式；校准坐标；处理定位拒绝与重试；统一界面语言；核验精选门店的地址、营业时间、图片及标签 | 每个可见入口可用；列表和地图结果一致；模拟失败和真实移动网络下仍能完成找店、收藏、查看与导航 |
| 3 进入 TestFlight | 配置完整 Xcode、签名及 Bundle ID；补齐定位说明与必要原生能力；完成安全区和真机测试；移除占位内容，准备隐私页、支持页及元数据 | 真机无阻断问题；归档与上传成功；TestFlight 收集并解决关键反馈 |
| 4 提交 App Store | 确认发行地区和对应要求；完善截图、商店介绍、隐私填报和审核说明；用最终构建回归核心流程 | 发布材料与应用实际行为一致，提交审核并按反馈处理 |

建议首版继续聚焦上海精选门店、地图与列表、准确筛选、收藏、详情和导航。先把现有使用流程做完整，再判断登录、评论、社交、多城市和付费是否必要。按里程碑验收比在云端及真机状态未知时承诺固定上架日期更可靠。

下一步最有价值的工作是恢复运行基线，同时核实 Supabase 项目和门店数据。Supabase 状态、Apple Developer 会员状态以及目标发行地区仍需用户账户侧确认。

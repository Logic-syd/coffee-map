# 将Coffee Map打包为iOS应用的步骤

## 前提条件

在开始之前，请确保您已安装以下软件：

1. **Xcode**（不仅仅是命令行工具）：

   - 从 Mac App Store 下载并安装最新版本的 Xcode
   - 安装后，打开 Xcode 并接受许可协议
   - 确保您使用的是完整的 Xcode，而不仅仅是命令行工具，运行：
     ```bash
     sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
     ```

2. **CocoaPods**：

   - CocoaPods 是 iOS 开发的依赖管理工具
   - 安装命令：
     ```bash
     sudo gem install cocoapods
     ```

3. **Apple 开发者账号**：
   - 登录 Xcode 中的 Apple 开发者账号
   - 如果您没有，可以免费创建一个，但功能有限制（测试设备数量等）

## 构建步骤

一旦安装了所有必要的工具，请按照以下步骤操作：

1. **构建 Next.js 应用**：

   ```bash
   npm run build
   ```

2. **添加 iOS 平台到 Capacitor**：

   ```bash
   cp -R ios-cap-config/capacitor.config.ts .
   npx cap add ios
   ```

3. **同步 Web 代码到 iOS 项目**：

   ```bash
   npx cap sync ios
   ```

4. **打开 Xcode 项目**：

   ```bash
   npx cap open ios
   ```

5. **在 Xcode 中配置项目**：
   - 点击左侧导航栏中的项目文件（App）
   - 在 "Signing & Capabilities" 选项卡中：
     - Team: 选择您的开发者账号
     - Bundle Identifier: 保持默认或更改为您喜欢的标识符
   - 此步骤需要有效的 Apple 开发者账号

## 测试应用

### 在本地模拟器上测试：

1. 在 Xcode 中，选择一个 iOS 模拟器（例如 iPhone 14）
2. 点击运行按钮（▶）或按 Cmd+R
3. 应用将在模拟器中启动

### 在您自己的设备上测试：

1. 将您的 iPhone/iPad 连接到 Mac
2. 在 Xcode 中，从设备下拉菜单中选择您的设备
3. 确保您的设备已解锁并信任您的计算机
4. 点击运行按钮（▶）
5. 首次在设备上安装应用时，您可能需要在设备上进入 设置 > 通用 > 设备管理，并信任您的开发者证书

## 分发给朋友测试（TestFlight）

要让朋友测试您的应用，最佳方式是使用 TestFlight：

1. **注册 Apple Developer Program**（年费 99 美元）：

   - 个人或组织账户均可
   - 注册地址：[Apple Developer Program](https://developer.apple.com/programs/)

2. **准备应用上传**：

   - 在 Xcode 中，选择 "Product" > "Archive"
   - 完成归档后，点击 "Distribute App"
   - 选择 "App Store Connect" 和 "Upload"
   - 按照向导完成上传过程

3. **配置 TestFlight**：

   - 登录 [App Store Connect](https://appstoreconnect.apple.com/)
   - 导航到您的应用 > TestFlight
   - 在 "内部测试" 选项卡中，添加测试人员的电子邮件地址
   - 或创建 "外部测试" 链接，分享给任何人

4. **邀请测试人员**：
   - 测试人员将收到邀请电子邮件
   - 他们需要在设备上安装 TestFlight 应用
   - 使用邀请链接打开应用并安装您的测试版应用

### 替代方案：AdHoc 分发

如果您不想使用 TestFlight 或没有付费开发者账户，可以使用 AdHoc 分发（限制最多 100 台设备）：

1. 收集所有测试设备的 UDID（设备唯一标识符）
2. 在 Apple Developer 网站上添加这些设备
3. 创建 AdHoc 配置文件并在 Xcode 中使用它
4. 归档应用并通过 AdHoc 方式导出
5. 将生成的 .ipa 文件和配置文件分享给测试人员

## 注意事项

- 确保您的应用适当处理了 iOS 特有的特性和限制
- 使用 Capacitor 插件添加原生功能（如通知、相机访问等）
- 测试不同 iOS 版本和设备尺寸
- 处理深链接和 Apple Sign-In（如果适用）

希望这份指南对您有所帮助！如有任何问题，请查阅 Capacitor 和 Apple 开发者文档。

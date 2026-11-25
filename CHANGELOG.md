# 更新日志

本文件记录 oiyo 各版本的更新内容。版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)，变更分类参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## v1.0.0

**发布时间：** 2026-11-23 ｜ 范围：`v0.8.5..v1.0.0`（80 个提交）

**oiyo 1.0 正式发布！** 🎉

1.0 是一次以稳定性为目标的大版本。它没有堆叠新功能，而是把 0.8.x 中分散的入口、配置与命令收敛成一套更可预期的工程约定，同时补齐了小程序 CI、IDE 集成与更完整的自动导入能力。

大部分改动都有明确替代方案，升级成本集中在包名、入口、配置路径与 CLI 行为四处。建议阅读 [迁移(支持 skill)](https://oiyo.js.org/docs/guide/overview/migration) 文档进行迁移。

### 🔥 主要变化

- **包名与依赖收敛**：`@skiyee/oiyo` 更名为 `oiyo`，uni-app 与 Vue 依赖统一由 `@oiyo/uniapp` 提供
- **配置路径统一**：所有路径相对项目根目录，扫描、布局、中间件与分包使用同一套基准
- **更强的自动导入**：支持按 `package.json#exports` 扫描包 API 与组件
- **更完整的工程链路**：新增小程序 CI 预览/发布，IDE 自动打开扩展到多平台
- **更顺手的视图能力**：页面侧布局标签与 props，根上下文类型自动生成

#### 包结构与依赖

发布主体收敛为 `oiyo` 单包，入口按职责拆分：`oiyo`（聚合入口）、`oiyo/config`（`define*Config`）、`oiyo/schema`（配置类型、默认值与解析）、`oiyo/runtime`（宏、占位组件与 HTTP 等运行时能力）。`@oiyo/uniapp` 统一承载 uni-app 与 Vue 依赖，应用只需自行安装与 uni-app 版本匹配的 `vite`。

#### 配置与路径

`oiyo.config` 中所有路径现在相对项目根目录解析，本地路径必须以 `./` 开头。扫描源、布局、中间件与分包目录不再混用 `srcDir` 与 `rootDir`，配置行为更容易预期。

#### 自动导入

API 与组件扫描支持 `package.json#exports` 说明符，包根入口、通配子路径与真实文件路径共享同一套优先级；纯 JS 组件可通过 `types` 指向外部类型声明。`scan.apis`/`scan.components` 同时支持 `false`（关闭）与 `true`（使用默认值）。

#### CLI、IDE 与 CI

CLI 命令调整为 `prepare`/`dev`/`build`/`preview`/`upload`。`dev` 在 `ide.open` 开启时可自动打开微信、支付宝或抖音开发者工具；`preview`/`upload` 支持微信、支付宝、抖音与小红书小程序的预览与发布。

#### 布局与根上下文

页面模板可直接使用 `<OiyoLayout>` 指定布局并传递 props。`defineRootContext()` 的工厂现在在 `App.vue` 的 setup 作用域内执行，返回值需显式接收后才能在 `App.vue` 模板中使用；页面侧统一通过 `useRootContext()` 消费，并在声明并导出泛型类型时自动获得类型提示。

### 🚀 如何升级

1. **更新依赖**

   ```sh
   npm/yarn/pnpm remove @skiyee/oiyo
   npm/yarn/pnpm add oiyo@^1.0.0
   ```

2. **声明 ESM 与 Node 版本**

   在 `package.json` 中声明 `"type": "module"`，并确保 Node 版本满足 `^20.19.0 || >=22.12.0`。

3. **迁移入口**

   将 `@skiyee/oiyo/global` 的导入改为 `oiyo/runtime`。页面元信息、占位组件与运行时 API 仍由框架自动注入，无需手动导入。

4. **调整配置路径**

   为 `dir.*`、`scan.apis[].from`、`scan.components[].from` 等本地路径补上 `./` 前缀；`dir.packages` 合并进 `dir.subPackages`。

5. **检查 TypeScript 配置**

   根 `tsconfig.json` 继承 `./.oiyo/tsconfig.json` 即可，生成的配置已包含 `vite/client`。原来手写的 `"types": ["vite/client"]` 可以保留或删除；如果项目自定义了 `types`，请把 `vite/client` 一并保留，否则 `import.meta.env` 会失去类型。

6. **重新生成并验证**

   ```sh
   pnpm exec oiyo prepare
   pnpm exec oiyo build h5
   ```

   确认 `.oiyo/` 下的声明与 `pages.json`、`manifest.json` 已刷新，再运行项目自己的类型检查与测试。

> [!TIP]
> 如果某个扫描源暂时不需要，可以先把 `scan.apis` 或 `scan.components` 设为 `false`，再按需逐个接入。

### 🚨 破坏性变更

- 包名由 `@skiyee/oiyo` 改为 `oiyo`；uni-app 与 Vue 依赖统一由 `@oiyo/uniapp` 提供，应用需自行安装与 uni-app 版本匹配的 `vite`。
- 仅发布 ESM 产物：应用需声明 `"type": "module"`，Node 版本要求 `^20.19.0 || >=22.12.0`。
- 移除 `oiyo/global` 入口，宏与占位组件统一由 `oiyo/runtime` 提供（仍无需手动导入）。
- 配置中的路径统一相对项目根目录解析，本地路径必须以 `./` 开头（此前相对 `srcDir`）。
- 配置结构调整：`dir.packages` 合并进 `dir.subPackages`。
- `defineRootContext()` 的返回值需显式接收后才能在 `App.vue` 模板中使用，页面内通过 `useRootContext()` 消费。
- CLI 行为调整：`build` 不再自动打开 IDE（仅 `dev` 在 `ide.open` 开启时自动打开）；新增 `preview`/`upload` 命令。

### 👉 变更清单

#### ✨ 新增

- 支持在页面模板中使用 `<OiyoLayout>` 指定布局并传递 props。
- 新增小程序 CI 预览与发布，覆盖微信、支付宝、抖音、小红书。
- IDE 自动打开扩展到微信、支付宝、抖音开发者工具。
- 自动导入支持按 `package.json#exports` 扫描包 API 与组件，并可为纯 JS 组件指定外部类型入口。
- `scan.apis`/`scan.components` 支持 `false`（关闭）与 `true`（使用默认值）。
- 根上下文支持自动生成类型声明：`defineRootContext<T>()` 且 `T` 从 `App.vue` 导出时，`useRootContext()` 自动获得类型。

#### 🏎 优化

- 配置类型、默认值与解析能力集中到 `oiyo/schema`，并新增同步配置解析。
- 生成的 `tsconfig` 默认包含 `vite/client` 类型，应用无需再手动声明。
- 优化包导出的导入优先级与文件监听，减少重复或遗漏的自动导入。
- 组件命名在文件名已包含目录名时不再重复拼接。
- 配置文件中的 `pages`/`manifest` 支持路径别名导入。
- `vite` 改为可选 peer 依赖，由应用按 uni-app 版本自行安装。

#### 🩹 修复

- 修复无路由页面应用布局时的空引用问题。
- 修复根视图共享的顶层 `ref` 未自动解包的问题。
- 修复 API 扫描误将 Vue 单文件组件纳入的问题。
- 补充 `GlobalStyle.disableScroll` 类型声明。

升级过程中遇到问题，欢迎在 [GitHub Issues](https://github.com/oiyojs/oiyo/issues) 反馈。Happy coding with oiyo 1.0! 🚀

## v0.8.5

**发布时间：** 2026-11-04 ｜ 范围：`v0.8.4..v0.8.5`（1 个功能提交 + 版本号更新）

### 修复

- 修复模板中重复引用同一个 API 时会重复生成导入语句的问题，现在每个 API 只会被引入一次。

## v0.8.4

### 修复

- 修复生成的 `pages.json` 中配置了 tab 的页面包含 `index` 时导致的报错问题。

### 优化

- 构建插件改为按需加载 UniApp 插件，提升了在 ESM 与 CJS 环境下的兼容性。
- 刷新依赖版本并规范依赖声明方式。
- 清理了冗余的 TypeScript 配置并修正路径映射。

<div align="center">
  <a href="https://oiyo.js.org/">
    <picture>
      <img alt="oiyo logo" src="./.github/assets/logo.png" height="128">
    </picture>
  </a>

  <h1>oiyo</h1>
  
  <p>
    <strong>UniApp 增强型工程框架</strong>
  </p>
  
  <p>开箱即用 · 融合AI协作 · 优秀开发体验 · 超低心智成本</p>

  <p>
    <a href="https://www.github.com/skiyee/oiyo"><img alt="NPM version" src="https://img.shields.io/npm/v/@skiyee/oiyo?color=D47F24&labelColor=130E0A&label=npm"></a>
    <a href="https://www.github.com/skiyee/oiyo"><img alt="NPM downloads" src="https://img.shields.io/npm/dm/@skiyee/oiyo?color=D47F24&labelColor=130E0A&label=downloads"></a>
    <a href="https://oiyo.js.org"><img alt="DOCS" src="https://img.shields.io/badge/docs-oiyo-D47F24?labelColor=%23130E0A&color=%23D47F24"></a>
    <a href="https://github.com/oiyojs/oiyo/blob/main/LICENSE"><img alt="LICENSE" src="https://img.shields.io/badge/license-Apache--2.0-D47F24?labelColor=130E0A&color=D47F24"></a>
  </p>

  <table align="center">
    <thead>
      <tr>
        <th>平台</th>
        <th>H5</th>
        <th>IOS(vue)</th>
        <th>Android(vue)</th>
        <th>微信小程序</th>
        <th>支付宝小程序</th>
        <th>抖音小程序</th>
        <th>小红书小程序</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>UniApp</td>
        <td>√</td>
        <td>√</td>
        <td>√</td>
        <td>√</td>
        <td>√</td>
        <td>√</td>
        <td>?</td>
      </tr>
    </tbody>
  </table>

</div>

## 💻 要求

- Node.js >= 18
- pnpm <= 10

## ✨ 特性

| 核心特性                                                       | 说明                                                                                         |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [自动路由](https://oiyo.js.org/docs/manual/page/register)      | 按约定目录扫描生成 `pages.json`，一个页面文件即一条路由，不再手动维护                        |
| [页面元信息](https://oiyo.js.org/docs/manual/page/meta)        | `definePageMeta()` 将导航栏样式、首页声明、TabBar 配置写在页面内，减少跨文件心智切换         |
| [布局系统](https://oiyo.js.org/docs/manual/shell/layout)       | 布局在 `src/layouts` 定义一次，页面中一行 `layout` 声明即可复用，业务逻辑与容器彻底分离      |
| [根上下文](https://oiyo.js.org/docs/manual/shell/root-context) | `defineRootContext()` 配合 `useRootContext()`，在 `App.vue` 统一声明全局弹窗与开关，随处使用 |
| [跳转守卫](https://oiyo.js.org/docs/manual/page/middleware)    | 命名中间件与全局中间件，支持异步拦截、`goTo()` 重定向、`abortNavigation()` 取消              |
| [自动导入](https://oiyo.js.org/docs/manual/scan/api)           | 自动扫描 API 与组件，常用路径内置，无需手动 import，类型提示完整                             |
| [数据请求](https://oiyo.js.org/docs/manual/data/http)          | 开箱即用的 `http` 客户端，内置分层派生实例、生命周期钩子、自动重试与请求取消                 |
| [工程约定](https://oiyo.js.org/docs/structure)                 | 固定目录结构 + 三层配置文件，输出稳定可预测的项目结构，人、团队与 AI 都能读懂                |

## 🎉 开始

通过以下命令交互式的创建一个起手项目：

```bash
pnpm create oiyo@latest
```

| 项目仓库                                                                     | 创建命令                                | 简介                                  |
| ---------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| [oiyo/standard](https://github.com/skiyee/oiyo-starters/tree/main)           | pnpm create oiyo --template=standard    | 基于 oiyo 赋能的 最佳实践 起步项目    |
| [oiyo/unibest](https://github.com/skiyee/oiyo-starters/tree/unibest)         | pnpm create oiyo --template=unibest     | 基于 oiyo 赋能的 unibest 起步项目     |
| [oiyo/wot-starter](https://github.com/skiyee/oiyo-starters/tree/wot-starter) | pnpm create oiyo --template=wot-starter | 基于 oiyo 赋能的 wot-starter 起步项目 |

## 📖 文档

强烈建议阅读文档，进一步挖掘该框架更多的功能！

Oiyo 官方文档: [oiyo.js.org/docs](https://oiyo.js.org/docs)

## 💞 社群

我们提供社群，让每一个开发者都能参与最直接的交流：

- 微信群：关注公众号「天空言码」回复「群」获取加群二维码

- QQ群：[246107301](https://qm.qq.com/q/iVPctWtKQS)

## 💝 关于

作者: **sky [Skiyee]** - 切图仔、全干攻城猫、轮子砖家

| 平台      | 链接                                             |
| --------- | ------------------------------------------------ |
| 🌐 官网   | [oiyo.js.org](https://oiyo.js.org/)              |
| 🐧 QQ     | [319619193](https://oiyo.js.org/)                |
| 🗻 掘金   | [skiyee](https://juejin.cn/user/300614247782265) |
| 💬 公众号 | 微信搜「天空言码」或扫码关注 ↓                   |

<img alt="公众号二维码" src="https://cdn.jsdelivr.net/gh/skiyee/static@main/contact/wx/official-qrcode.png" width="360">

## 💖 赞赏

<p align="center">
  <a href="https://oiyo.js.org/support/sponsorship">
    <img alt="赞赏伙伴" src="https://cdn.jsdelivr.net/gh/skiyee/sponsors@main/oiyo-sponsors.svg" />
  </a>
</p>

## 📣 说明

- 社区版本：保留了当时项目的主要功能与实现，可用于学习、研究和技术交流。源码和历史版本请以本仓库的 Git 历史为准。
- 正式版本：面向实际使用的用户进行持续维护，并在独立的代码基础上继续迭代。正式版本包含社区版本没有的功能、性能改进和平台适配。

> 社区版本与正式版本在功能和版本进度以及协议上并不相同，因此，社区版本不是当前正式版的完整或即时镜像；如需使用最新正式版本，请从官网安装。

## 🔗 外链

- [Oiyo 专栏 - 掘金](https://juejin.cn/column/7663486605853229102)
- [Oiyo Starter - 脚手架项目](https://github.com/skiyee/oiyo-starters)

## ⚖️ 许可

社区版本（本项目）采用 [Apache License 2.0](LICENSE) 授权：

- 可用于个人与商业项目，可修改、可闭源分发、可再分发
- 含专利授权（Apache-2.0 §3）与商标保护（§6）
- 再分发时需保留 `LICENSE` 与 `NOTICE` 文件，并对修改过的文件加以标注

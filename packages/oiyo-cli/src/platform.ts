import * as prompt from '@clack/prompts'

export const PLATFORMS_MAP = {
  'h5': 'H5',
  'mp-weixin': '微信小程序',
  'mp-alipay': '支付宝小程序',
  'mp-toutiao': '抖音小程序',
  'mp-xhs': '小红书小程序',
  'mp-harmony': '鸿蒙小程序',
  'mp-jd': '京东小程序',
  'mp-kuaishou': '快手小程序',
  'mp-lark': '飞书小程序',
  'mp-baidu': '百度小程序',
  'mp-qq': 'QQ 小程序',
  'quickapp-webview': '快应用 WebView',
  'quickapp-webview-huawei': '华为快应用 WebView',
  'quickapp-webview-union': '联盟快应用 WebView',
  'app': 'App',
  'app-android': 'App Android',
  'app-ios': 'App iOS',
  'app-harmony': 'App Harmony',
}

export type Platform = keyof typeof PLATFORMS_MAP

export const PLATFORMS = Object.keys(PLATFORMS_MAP) as [Platform]

export async function getPlatformBySelect(): Promise<Platform | null> {
  const platform = await prompt.select<Platform>({
    message: '请选择开发目标平台',
    options: PLATFORMS.map(platform => ({
      label: PLATFORMS_MAP[platform],
      value: platform,
      hint: platform,
    })),
  })

  if (prompt.isCancel(platform)) {
    prompt.cancel('已取消平台选择')
    return null
  }

  return platform
}

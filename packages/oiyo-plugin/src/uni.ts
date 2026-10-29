import type { Plugin } from 'vite'

import { createRequire } from 'node:module'

type UniPluginFactory = (() => Plugin | Plugin[]) & { default?: UniPluginFactory }

let uniPluginFactory: UniPluginFactory | undefined

function loadUniPlugin(): UniPluginFactory {
  if (uniPluginFactory) {
    return uniPluginFactory
  }

  try {
    const mod = createRequire(import.meta.url)('@dcloudio/vite-plugin-uni') as UniPluginFactory | { default: UniPluginFactory }
    uniPluginFactory = (typeof mod === 'function' ? mod : mod.default) as UniPluginFactory
  }
  catch (error) {
    throw new Error(
      '[oiyo] 未找到 @dcloudio/vite-plugin-uni，请确认项目已安装 uni-app 相关依赖',
      { cause: error },
    )
  }

  return uniPluginFactory
}

export const OiyoUniPlugin = (): Plugin[] => {
  const factory = loadUniPlugin()
  const plugins = factory()
  return Array.isArray(plugins) ? plugins : [plugins]
}

export default OiyoUniPlugin

import type { FSWatcher, Plugin } from 'vite'

import type { OiyoContext } from './context'
import type { Logger } from '~/logger'

import * as path from 'pathe'

export function OiyoServePlugin(): Plugin[] {
  let ctx: OiyoContext
  let viteLogger: Logger

  const watchers: FSWatcher[] = []

  return [
    {
      name: 'oiyo:serve',
      apply: 'serve',
      enforce: 'pre',

      configResolved(config) {
        ctx = config.oiyo!
        viteLogger = ctx.logger.withScope('VITE')
      },

      async buildStart() {
        viteLogger.debug('初始化: serve')

        await Promise.all([
          ctx.layout.scanLayouts(),
          ctx.route.scanRoutes(),
          ctx.manifest.loadManifestConfig(),
        ])

        if (ctx.state.canReuseGeneratedState()) {
          viteLogger.debug('复用: .oiyo 已存在且构建信息匹配')
        }
        else {
          ctx.layout.writeDeclaration()
          ctx.route.writePagesJson() && ctx.route.writeDeclaration()

          ctx.state.markGenerated()
        }

        viteLogger.debug('初始化完成')
      },

      configureServer(server) {
        viteLogger.debug('监听: 开发服务器')

        ctx.route.watchPagesConfig(() => {
          viteLogger.debug('触发: pages.config.* 配置更新')

          ctx.route.writePagesJson() && ctx.route.writeDeclaration()

          server.hot.send({ type: 'full-reload' })
        })

        ctx.manifest.watchManifestConfig(() => {
          viteLogger.debug('触发: manifest.config.* 配置更新')

          ctx.manifest.writeManifestJson() && server.hot.send({ type: 'full-reload' })
        })

        const handleDirAdd = async (id: string) => {
          viteLogger.debug(`路径新增: ${id}`)

          const dir = path.normalize(id)

          ctx.route.inlineSubPackageFilter(dir)
        }
        watchers.push(server.watcher.on('addDir', dir => void handleDirAdd(dir)))

        const handleFileAdd = async (id: string) => {
          viteLogger.debug(`文件新增: ${id}`)

          const file = path.normalize(id)

          if (ctx.route.isRoute(file)) {
            const isEntered = ctx.route.enterRoute(file)
            isEntered && ctx.route.writePagesJson() && ctx.route.writeDeclaration()
          }
          else if (ctx.layout.isLayout(file)) {
            const isEnter = ctx.layout.enterLayout(file)
            isEnter && ctx.layout.writeDeclaration()
          }
        }
        watchers.push(server.watcher.on('add', id => void handleFileAdd(id)))

        const handleFileUnlink = (id: string) => {
          viteLogger.debug(`文件删除: ${id}`)

          const file = path.normalize(id)

          if (ctx.route.isRoute(file)) {
            const isExited = ctx.route.exitRoute(file)
            isExited && ctx.route.writePagesJson() && ctx.route.writeDeclaration()
          }
          else if (ctx.layout.isLayout(file)) {
            const isExited = ctx.layout.exitLayout(file)
            isExited && ctx.layout.writeDeclaration()
          }
        }
        watchers.push(server.watcher.on('unlink', id => void handleFileUnlink(id)))
      },

      async transform(code, id) {
        const file = path.normalize(id)
        if (file.includes('?') || !file.startsWith(`${ctx.state.srcDir!}/`)) {
          return null
        }

        if (ctx.route.isRoute(file)) {
          const pageResult = await ctx.route.transformPage(code, file)
          return pageResult
        }

        return null
      },

      async closeBundle() {
        await Promise.all([
          ctx.route.unwatchPagesConfig(),
          ctx.manifest.unwatchManifestConfig(),
          ...watchers.splice(0).map(watcher => watcher.close()),
        ])
      },
    },
  ]
}

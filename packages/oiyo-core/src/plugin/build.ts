import type { Plugin } from 'vite'

import type { OiyoContext } from './context'
import type { Logger } from '~/logger'

import * as watcher from 'chokidar'
import * as path from 'pathe'

export function OiyoBuildPlugin(): Plugin[] {
  let ctx: OiyoContext

  let viteLogger: Logger

  let shouldWatch = false
  const watchers: watcher.FSWatcher[] = []

  return [
    {
      name: 'oiyo:build',
      apply: 'build',
      enforce: 'pre',

      async configResolved(config) {
        ctx = config.oiyo!
        viteLogger = ctx.logger.withScope('VITE')
        shouldWatch = config.command === 'build' && !!config.build.watch

        viteLogger.debug('初始化开始')

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

        shouldWatch && ctx.route.watchPagesConfig(() => {
          viteLogger.debug('触发: pages.config.* 配置更新')

          ctx.route.writePagesJson() && ctx.route.writeDeclaration()
        })

        shouldWatch && ctx.manifest.watchManifestConfig(() => {
          viteLogger.debug('触发: manifest.config.* 配置更新')

          ctx.manifest.writeManifestJson()
        })

        const handleDirAdd = async (id: string) => {
          viteLogger.debug(`路径新增: ${id}`)

          const dir = path.normalize(id)

          ctx.route.inlineSubPackageFilter(dir)
        }
        shouldWatch && watchers.push(watcher.watch(ctx.state.srcDir, { ignoreInitial: true })
          .on('addDir', id => void handleDirAdd(id)))

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
        shouldWatch && watchers.push(watcher.watch(ctx.state.srcDir, { ignoreInitial: true })
          .on('add', id => void handleFileAdd(id)))

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
        shouldWatch && watchers.push(watcher.watch(ctx.state.srcDir, { ignoreInitial: true })
          .on('unlink', id => void handleFileUnlink(id)))
      },

      async transform(code, id) {
        const file = path.normalize(id)
        if (file.includes('?') || !file.startsWith(`${ctx.state.srcDir!}/`)) {
          return null
        }

        viteLogger.debug(`开始处理文件：${file}`)

        if (ctx.route.isRoute(file)) {
          const pageResult = await ctx.route.transformPage(code, file)
          return pageResult
        }

        return null
      },

      async closeWatcher() {
        await Promise.all([
          ctx.route.unwatchPagesConfig(),
          ctx.manifest.unwatchManifestConfig(),
          ...watchers.splice(0).map(watcher => watcher.close()),
        ])

        viteLogger.debug('清理文件监听器')
      },
    },
  ]
}

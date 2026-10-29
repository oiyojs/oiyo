import type { OiyoModLayout } from '#/layout'
import type { ImportInfo } from '#/shared/extractor/import'
import type { OiyoConfig, PagesConfig } from '@oiyo/config'
import type { ConfigWatcher } from 'c12'

import type { ResolvedPageMeta, ResolvedPagesJson, Route } from './types'
import type { Logger } from '~/logger'
import type { OiyoState } from '~/state'

import { mkdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

import { hasLayoutTag, removeLayoutTag, replaceOiyoLayoutTag, wrapWithLayoutTag } from '#/layout/replacer'
import { extractFnContent, removeFnContent } from '#/shared/extractor/fn'
import { extractImports } from '#/shared/extractor/import'
import { generateImportDeclaration } from '#/shared/generator/import'
import { DEFAULT_EXCLUDE } from '@oiyo/config'
import { parse as vueParse } from '@vue/compiler-sfc'
import { loadConfig, watchConfig } from 'c12'
import MagicString from 'magic-string'
import * as path from 'pathe'
import * as tg from 'tinyglobby'

import { atomicWriteFile, scanFiles, toArray } from '~/shared'

import { dedupePagesConfig } from './deduper'
import { parseMacro } from './extractor'
import { generatePagesDeclaration, generatePagesJson } from './generator'

export class OiyoModRoute {
  private readonly config: OiyoConfig

  private readonly logger: Logger

  private readonly oiyoState: OiyoState
  private readonly oiyoLayout?: OiyoModLayout

  private inlineSubPackageDirs: Set<string> = new Set()

  routes: Map<string, Route> = new Map()

  private pagesConfig: PagesConfig = {}
  private pagesConfigWatcher?: ConfigWatcher<PagesConfig>

  constructor(
    config: OiyoConfig,
    deps: {
      logger: Logger;
      oiyoState: OiyoState;
    }
  )
  constructor(
    config: OiyoConfig,
    deps: {
      logger: Logger;
      oiyoState: OiyoState;
      oiyoLayout: OiyoModLayout;
    },
  )
  constructor(
    config: OiyoConfig,
    deps: {
      logger: Logger;
      oiyoState: OiyoState;
      oiyoLayout?: OiyoModLayout;
    },
  ) {
    this.config = config
    this.logger = deps.logger.withScope('ROUTE')

    this.oiyoState = deps.oiyoState
    this.oiyoLayout = deps.oiyoLayout
  }

  private get srcDir() {
    return path.resolve(this.config.rootDir!, this.config.srcDir!)
  }

  private get mainPackageDir() {
    return path.resolve(this.srcDir, this.config.dir!.mainPackage!)
  }

  private get subPackageDirs() {
    const rawDirs = Array.from(new Set([...this.inlineSubPackageDirs, ...this.config.dir!.subPackages!]))
    return rawDirs.map(dir => path.resolve(this.srcDir, dir))
  }

  private get pagesJsonFile() {
    return path.resolve(this.srcDir, 'pages.json')
  }

  private get declarationDir() {
    return this.oiyoState.typesDir
  }

  private get declarationFile() {
    return path.resolve(this.declarationDir, 'pages.d.ts')
  }

  private toRoute(filePath: string, pageMeta: ResolvedPageMeta | null): Route {
    const mainPackageDir = this.mainPackageDir
    const subPackageDir = this.subPackageDirs.find(dir => filePath.startsWith(`${dir}/`))

    let baseDir = this.srcDir
    let pageDir = mainPackageDir
    if (subPackageDir) {
      baseDir = subPackageDir
      pageDir = subPackageDir
    }

    const relativePath = path.relative(baseDir, filePath)
    const parsedPath = path.parse(relativePath)
    const pagePath = parsedPath.dir === ''
      ? parsedPath.name
      : path.join(parsedPath.dir, parsedPath.name)

    const pageBelong = path.relative(this.srcDir, pageDir)

    const pageFile: Route = {
      filePath,
      pagePath,
      pageBelong,
      pageMeta,
    }

    return pageFile
  }

  private saveRoute(newRoute: Route): boolean {
    if (!this.routes.has(newRoute.filePath)) {
      this.routes.set(newRoute.filePath, newRoute)
      return true
    }

    const currentPage = this.routes.get(newRoute.filePath)!

    const isPageMetaChanged = JSON.stringify(currentPage.pageMeta) !== JSON.stringify(newRoute.pageMeta)
    if (isPageMetaChanged) {
      this.routes.set(newRoute.filePath, newRoute)
    }

    return isPageMetaChanged
  }

  private async loadPagesConfig(): Promise<PagesConfig> {
    try {
      const [{ config, configFile }, inlineSubPackageDirs] = await Promise.all([
        loadConfig<PagesConfig>({
          configFile: 'pages.config',
          cwd: this.srcDir,
        }),
        tg.globSync('*', {
          cwd: path.resolve(this.srcDir, 'packages'),
          deep: 1,
          absolute: true,
          onlyDirectories: true,
          ignore: toArray(this.config.exclude),
        }),
      ])

      inlineSubPackageDirs.map(dir => this.inlineSubPackageDirs.add(dir))

      this.pagesConfig = config || {}

      if (configFile) {
        this.logger.debug(`已加载 pages.config.* 配置: ${path.relative(this.srcDir, configFile)}`)
      }
      else {
        this.logger.debug('未找到 pages.config.* 配置，将使用默认值')
      }
    }
    catch {
      this.pagesConfig = {}
      this.logger.warn('无法加载 pages.config.* 配置，已采用空配置')
    }

    return this.pagesConfig
  }

  inlineSubPackageFilter(dir: string) {
    const packageDir = path.resolve(this.srcDir, 'packages')

    if (!dir.startsWith(`${packageDir}/`)) {
      return false
    }

    const packageRootName = path.relative(packageDir, dir).split('/')[0]
    const packageRootDir = path.resolve(packageDir, packageRootName)
    if (this.inlineSubPackageDirs.has(packageRootDir)) {
      return true
    }

    const exclude = [...DEFAULT_EXCLUDE, ...(this.config.exclude || [])]
    if (exclude.some(pattern => path.matchesGlob(packageRootDir, pattern))) {
      return false
    }

    this.inlineSubPackageDirs.add(packageRootDir)
    this.logger.debug(`通过“主动模式”录入分包目录: ${packageRootDir}`)

    return true
  }

  async scanRoutes() {
    await this.loadPagesConfig()

    const routeDirs = [this.mainPackageDir, ...this.subPackageDirs]
    this.logger.debug(`参与路由扫描目录，共 ${routeDirs.length} 个`)

    const files = (await Promise.all(routeDirs.map(dir => scanFiles({
      dir,
      pattern: ['**/*.vue', '**/*.nvue'],
    })))).flat(2).filter(file => this.isRoute(file))

    await Promise.all(files.map(async (filePath) => {
      const source = await readFile(filePath, 'utf-8')

      const pageMetaContent = extractFnContent(source, 'definePageMeta')
      const pageMetaData = pageMetaContent ? parseMacro<ResolvedPageMeta>(pageMetaContent, 'definePageMeta') : null
      const pageInfo = this.toRoute(filePath, pageMetaData)

      const isSave = this.saveRoute(pageInfo)
      isSave && this.logger.debug(`通过“扫描模式”录入路由: ${pageInfo.pageBelong}&${pageInfo.pagePath}`)
    }))

    this.logger.debug(`通过扫描目录，共录入 ${this.routes.size} 个路由`)

    return this.routes
  }

  isRoute(file: string): boolean {
    if (!file.endsWith('.vue') && !file.endsWith('.nvue')) {
      return false
    }

    const exclude = [...DEFAULT_EXCLUDE, ...(this.config.exclude || [])]
    if (exclude.some(pattern => path.matchesGlob(file, pattern))) {
      return false
    }

    return [this.mainPackageDir, ...this.subPackageDirs].some(dir => file.startsWith(`${dir}/`))
  }

  enterRoute(file: string) {
    const route = this.toRoute(file, null)

    const isSave = this.saveRoute(route)
    isSave && this.logger.debug(`通过“主动模式”录入路由: ${route.pageBelong}&${route.pagePath}`)

    return isSave
  }

  exitRoute(file: string) {
    if (!this.routes.has(file)) {
      this.logger.debug(`无法脱离不存在的路由：${file}`)
      return false
    }

    const route = this.routes.get(file)!

    const isDelete = this.routes.delete(file)

    isDelete && this.logger.debug(`通过“主动模式”脱离路由: ${route.pageBelong}&${route.pagePath}`)

    return isDelete
  }

  private resolvePagesJson(userPageJson?: PagesConfig): ResolvedPagesJson {
    return dedupePagesConfig(
      generatePagesJson(Array.from(this.routes.values())),
      userPageJson || this.pagesConfig,
    ) as ResolvedPagesJson
  }

  writePagesJson(userPageJson?: PagesConfig): boolean {
    try {
      const pagesJson = this.resolvePagesJson(userPageJson)

      const content = `${JSON.stringify(pagesJson, null, 2)}\n`

      atomicWriteFile(this.pagesJsonFile, content)

      this.logger.debug(`写入 pages.json 路由文件，共 ${this.routes.size} 个路由`)

      return true
    }
    catch (error) {
      this.logger.error('无法写入 pages.json 路由文件，请检查目标文件权限和内容格式:', {
        error: error as Error,
      })

      return false
    }
  }

  generateDeclaration(userPageJson?: PagesConfig) {
    this.logger.debug(`生成 pages.d.ts 路由类型声明`)
    return generatePagesDeclaration(this.resolvePagesJson(userPageJson))
  }

  writeDeclaration(userPageJson?: PagesConfig) {
    try {
      mkdirSync(this.declarationDir, { recursive: true })

      atomicWriteFile(this.declarationFile, this.generateDeclaration(userPageJson))

      this.oiyoState.ensureDeclarationEntry()

      this.logger.debug(`写入 pages.d.ts 路由类型声明，共 ${this.routes.size} 个路由`)
    }
    catch (error) {
      this.logger.error('无法写入 pages.d.ts 路由类型声明，请检查目标文件权限和内容格式:', {
        error: error as Error,
      })
    }

    return this.declarationFile
  }

  async watchPagesConfig(onUpdateCallback?: () => void | Promise<void>): Promise<void> {
    if (this.pagesConfigWatcher) {
      return
    }

    const watcher = await watchConfig<PagesConfig>({
      configFile: 'pages.config',
      cwd: this.srcDir,
      acceptHMR({ getDiff }) {
        return getDiff().length === 0
      },
      onWatch: (event) => {
        this.logger.debug(`监听 pages.config.* 配置: ${event.type} ${event.path}`)
      },
      onUpdate: ({ newConfig }) => {
        this.pagesConfig = newConfig.config || {}
        this.logger.debug('已更新 pages.config.* 配置')

        if (onUpdateCallback) {
          void Promise.resolve(onUpdateCallback()).catch((error) => {
            this.logger.error(`无法触发 pages.config.* 配置更新回调，路由配置已更新，但后续回调未完成`, { error })
          })
        }
      },
    })

    this.pagesConfig = watcher.config || this.pagesConfig
    this.pagesConfigWatcher = watcher
    this.logger.debug(`监听 pages 配置文件 (${watcher.watchingFiles?.length || 0}个)`)
  }

  async unwatchPagesConfig(): Promise<void> {
    if (!this.pagesConfigWatcher) {
      return
    }

    this.logger.debug(`监听 pages 配置文件被关闭`)

    await this.pagesConfigWatcher.unwatch()
    this.pagesConfigWatcher = undefined
  }

  async transformPage(source: string, file: string) {
    this.logger.debug(`转换: ${file}`)

    if (!this.oiyoLayout) {
      throw new Error('[oiyo] Dependencies are missing; please contact skiyee(319619193@qq.com) to fix them.')
    }

    const { descriptor } = vueParse(source)
    const s = new MagicString(source)

    const template = descriptor.template
    const scriptSetup = descriptor.scriptSetup

    if (!template || !template?.content) {
      return {
        code: s.toString(),
        map: s.generateMap(),
      }
    }

    let scriptSetupContent = scriptSetup?.content || ''

    const usedImports = extractImports(scriptSetupContent)

    const imports: Map<string, ImportInfo> = new Map()

    const pageMetaContent = extractFnContent(source, 'definePageMeta')
    if (scriptSetupContent && pageMetaContent) {
      const pageMetaData = pageMetaContent ? parseMacro<ResolvedPageMeta>(pageMetaContent, 'definePageMeta') : null
      const pageInfo = this.toRoute(file, pageMetaData)

      const isChange = this.saveRoute(pageInfo)
      if (isChange) {
        this.logger.debug(`路由宏内容变更: ${pageInfo.pageBelong}&${pageInfo.pagePath}`)

        this.writePagesJson() && this.writeDeclaration()

        await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (pageMetaContent) {
        scriptSetupContent = removeFnContent(scriptSetupContent, 'definePageMeta') ?? scriptSetupContent
      }
    }

    let templateContent = template.content

    const route = this.routes.get(file)

    const { layout } = route?.pageMeta || {}

    const layoutName = typeof layout === 'string' ? layout : 'default'

    if (layout === false) {
      templateContent = removeLayoutTag(templateContent)
      this.logger.debug(`路由禁用布局: ${route?.pageBelong}&${route?.pagePath}`)
    }
    else {
      const layoutInfo = this.oiyoLayout.layouts.get(layoutName)

      if (!layoutInfo) {
        if (typeof layout === 'string') {
          this.logger.error(`未找到布局 "${layoutName}"，请检查布局名称或布局文件存放位置是否正确`)
        }
        else {
          this.logger.debug(`未找到默认布局，跳过分层包装: ${route?.pageBelong}&${route?.pagePath}`)
        }
      }
      else {
        usedImports.has(layoutInfo.componentName) || imports.set(layoutInfo.componentName, {
          importName: layoutInfo.componentName,
          importPath: layoutInfo.filePath,
          exportName: 'default',
        })

        templateContent = hasLayoutTag(templateContent)
          ? replaceOiyoLayoutTag(templateContent, layoutInfo.componentName)
          : wrapWithLayoutTag(templateContent, layoutInfo.componentName)

        this.logger.debug(`路由采用布局: ${layoutName}/${route?.pageBelong}&${route?.pagePath}`)
      }
    }

    const importContent = imports.size
      ? Array.from(imports.values())
          .map(item => generateImportDeclaration(
            item.importPath,
            item.importName,
            item.exportName,
          )).join('\n')
      : ''

    if (scriptSetup) {
      s.overwrite(
        scriptSetup.loc.start.offset,
        scriptSetup.loc.end.offset,
        [
          '',
          importContent,
          scriptSetupContent,
          '',
        ].join('\n'),
      )
    }
    else if (importContent || scriptSetupContent) {
      const scriptBlock = [
        '<script setup>',
        importContent,
        scriptSetupContent,
        '</script>',
        '',
      ].filter(Boolean).join('\n')

      s.prependLeft(
        template.loc.start.offset - '<template>'.length,
        scriptBlock,
      )
    }

    s.overwrite(
      template.loc.start.offset,
      template.loc.end.offset,
      templateContent,
    )

    return {
      code: s.toString(),
      map: s.generateMap(),
    }
  }
}

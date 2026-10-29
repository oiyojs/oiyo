import type { ManifestConfig, OiyoConfig } from '@oiyo/config'
import type { ConfigWatcher } from 'c12'

import type { Logger } from '~/logger'
import type { OiyoState } from '~/state'

import { existsSync, readFileSync } from 'node:fs'

import { loadConfig, watchConfig } from 'c12'
import { createDefu } from 'defu'
import * as path from 'pathe'

import { atomicWriteFile } from '~/shared'

import { defaultManifestConfig } from './defaults'

export class OiyoModManifest {
  private readonly config: OiyoConfig

  private readonly logger: Logger

  private readonly oiyoState: OiyoState

  private hasManifestConfig = false

  private manifestConfig: ManifestConfig = defaultManifestConfig

  private manifestConfigWatcher?: ConfigWatcher<ManifestConfig>

  constructor(
    config: OiyoConfig,
    deps: {
      logger: Logger;
      oiyoState: OiyoState;
    },
  ) {
    this.config = config
    this.logger = deps.logger.withScope('MANIFEST')

    this.oiyoState = deps.oiyoState
  }

  private get srcDir() {
    return path.resolve(this.config.rootDir!, this.config.srcDir!)
  }

  private get manifestJsonFile() {
    return path.resolve(this.srcDir, 'manifest.json')
  }

  async loadManifestConfig(): Promise<ManifestConfig> {
    try {
      const { config, _configFile } = await loadConfig<ManifestConfig>({
        configFile: 'manifest.config',
        cwd: this.srcDir,
        rcFile: false,
        packageJson: false,
        defaultConfig: defaultManifestConfig,
        dotenv: {
          fileName: [
            path.resolve(this.config.rootDir!, '.env'),
            path.resolve(this.config.rootDir!, `.env.${this.oiyoState.envMode}`),
          ],
        },
        merger: createDefu((object, key, value) => {
          if (Array.isArray(value)) {
            object[key] = value
            return true
          }
          return false
        }) as (...sources: Array<ManifestConfig | null | undefined>) => ManifestConfig,
      })

      this.hasManifestConfig = Boolean(_configFile)
      this.manifestConfig = config

      if (_configFile) {
        this.logger.debug(`已加载 manifest.config.* 配置: ${path.relative(this.srcDir, _configFile)}`)
      }
      else {
        this.logger.debug('未找到 manifest.config.* 配置，manifest.json 将保持原样')
      }
    }
    catch {
      this.hasManifestConfig = false
      this.manifestConfig = defaultManifestConfig
      this.logger.warn('无法加载 manifest.config.* 配置，已跳过 manifest.json 生成')
    }

    return this.manifestConfig
  }

  writeManifestJson(): boolean {
    if (!this.hasManifestConfig) {
      return false
    }

    try {
      const content = `${JSON.stringify(this.manifestConfig, null, 2)}\n`

      if (existsSync(this.manifestJsonFile) && readFileSync(this.manifestJsonFile, 'utf-8') === content) {
        this.logger.debug('manifest.json 内容未变化，跳过写入')

        return false
      }

      atomicWriteFile(this.manifestJsonFile, content)

      this.logger.debug('写入 manifest.json 应用配置文件')

      return true
    }
    catch (error) {
      this.logger.error('无法写入 manifest.json 应用配置文件，请检查目标文件权限和内容格式:', {
        error: error as Error,
      })

      return false
    }
  }

  async watchManifestConfig(onUpdateCallback?: () => void | Promise<void>): Promise<void> {
    if (this.manifestConfigWatcher) {
      return
    }

    const watcher = await watchConfig<ManifestConfig>({
      configFile: 'manifest.config',
      cwd: this.srcDir,
      rcFile: false,
      packageJson: false,
      defaultConfig: defaultManifestConfig,
      merger: createDefu((object, key, value) => {
        if (Array.isArray(value)) {
          object[key] = value
          return true
        }
        return false
      }) as (...sources: Array<ManifestConfig | null | undefined>) => ManifestConfig,
      dotenv: {
        fileName: [
          path.resolve(this.config.rootDir!, '.env'),
          path.resolve(this.config.rootDir!, `.env.${this.oiyoState.envMode}`),
        ],
      },
      acceptHMR({ getDiff }) {
        return getDiff().length === 0
      },
      onWatch: (event) => {
        this.logger.debug(`监听 manifest.config.* 配置: ${event.type} ${event.path}`)
      },
      onUpdate: ({ newConfig }) => {
        this.hasManifestConfig = Boolean(newConfig._configFile)
        this.manifestConfig = newConfig.config
        this.logger.debug('已更新 manifest.config.* 配置')

        if (onUpdateCallback) {
          void Promise.resolve(onUpdateCallback()).catch((error) => {
            this.logger.error(`无法触发 manifest.config.* 配置更新回调，manifest 配置已更新，但后续回调未完成`, { error })
          })
        }
      },
    })

    this.hasManifestConfig = Boolean(watcher._configFile)
    this.manifestConfig = watcher.config || this.manifestConfig
    this.manifestConfigWatcher = watcher

    this.logger.debug(`监听 manifest 配置文件 (${watcher.watchingFiles?.length || 0}个)`)
  }

  async unwatchManifestConfig(): Promise<void> {
    if (!this.manifestConfigWatcher) {
      return
    }

    this.logger.debug(`监听 manifest 配置文件被关闭`)

    await this.manifestConfigWatcher.unwatch()
    this.manifestConfigWatcher = undefined
  }
}

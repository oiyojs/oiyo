import type { Logger, LogLevel } from '@oiyo/core'
import type { CittyPlugin } from 'citty'

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import process from 'node:process'

import { type OiyoConfig, resolveOiyoConfig } from '@oiyo/config'
import { createLogger } from '@oiyo/core'
import { bold, hex } from 'ansis'
import { loadConfig } from 'c12'
import { join } from 'pathe'

import { findFileEntry } from './utils'

export const oiyoCommandArg = {
  logLevel: {
    type: 'enum' as const,
    description: '日志级别: silent | info | verbose',
    options: ['silent', 'info', 'verbose'] as ['silent', 'info', 'verbose'],
  },
  mode: {
    type: 'string' as const,
    description: '指定环境变量模式',
    alias: ['m'],
  },
}

export interface OiyoCommandData {
  mode: string;
  logger: Logger;
  config: OiyoConfig;
}

let isInit = false

async function printBanner(): Promise<void> {
  let oiyoVersion = '未知'
  let uniappVersion = '未知'
  let vueVersion = '未知'

  const cliPkgPath = findFileEntry('@oiyo/cli/package.json')
  if (existsSync(cliPkgPath)) {
    const pkg = JSON.parse(await readFile(cliPkgPath, 'utf8'))
    oiyoVersion = pkg.version
  }

  const projectPkgPath = join(process.cwd(), 'package.json')
  if (existsSync(projectPkgPath)) {
    const pkg = JSON.parse(await readFile(projectPkgPath, 'utf8'))
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
    uniappVersion = dependencies['@dcloudio/uni-app'] || '未知'
    vueVersion = dependencies.vue || '未知'
  }

  process.stdout.write(`${hex('#FC9117')(bold(`oiyo v${oiyoVersion}`))} powered by ${hex('#2B9939')(`uni-app(v${uniappVersion})`)} ${hex('#42B983')(`vue(v${vueVersion})`)}\n`)
}

export function oiyoCommandPlugin(): CittyPlugin {
  return {
    name: 'oiyo:context',
    async setup(ctx) {
      if (!isInit) {
        await printBanner()
        isInit = true
      }

      const mode = ctx.args.mode || ctx.args.m
      const logLevel = ctx.args.logLevel as LogLevel
      const { config } = await loadConfig<OiyoConfig>({ name: 'oiyo' })
      const oiyoConfig = resolveOiyoConfig(config)

      ctx.data = {
        logger: createLogger(logLevel),
        config: oiyoConfig,
        mode,
      }
    },
  }
}

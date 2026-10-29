import type { Platform } from '../platform'
import type { OiyoCommandData } from './common'

import process from 'node:process'

import { defineCommand } from 'citty'
import { execa } from 'execa'

import { openMiniAppIDE } from '../ide'
import { createProjectRequire } from './utils'

export const uniCommand = defineCommand({
  args: {
    action: {
      type: 'positional',
      description: '运行模式',
      required: true,
    },
    platform: {
      type: 'string',
      description: '通过参数显式指定平台',
      required: true,
    },
    mode: {
      type: 'string',
      description: '指定环境变量模式',
      required: true,
    },
    watch: {
      type: 'boolean',
      description: '启动压缩的持续监听构建',
    },
  },
  async run({ args, data }) {
    const { config, logger } = data as OiyoCommandData

    const env = {
      ...process.env,
      OIYO_UNI_CALLED: '1',
    }

    const { action, platform, mode, watch } = args

    const uniArgs = [
      action,
      '-p', platform,
      '--mode', mode,
    ]

    watch && uniArgs.push('--watch')

    const uniProcess = spawnUni(uniArgs, { env })

    for await (const line of uniProcess) {
      if (line.startsWith('请注意运行模式下') || line.startsWith('Please note that in running mode')) {
        continue
      }

      if (line.startsWith('uni-app 有新版本发布')) {
        continue
      }

      if (platform.startsWith('mp') && config.ide?.open) {
        if (line.startsWith('运行方式') || line.startsWith('Run method')) {
          await openMiniAppIDE(
            platform as Platform,
            config,
            logger,
          )

          continue
        }
      }

      process.stdout.write(`${line}\n`)
    }
  },
})

export function spawnUni(
  args: string[],
  options?: { env?: NodeJS.ProcessEnv },
) {
  const uniEntry = getUniEntry()

  return execa(process.execPath, [uniEntry, ...args], {
    stdout: ['pipe'],
    stderr: ['pipe', 'inherit'],
    reject: false,
    env: options?.env,
  })
}

export function getUniEntry(): string {
  try {
    return createProjectRequire().resolve('@dcloudio/vite-plugin-uni/bin/uni.js')
  }
  catch (error) {
    throw new Error(
      '[oiyo] 未找到真实的 UNIAPP CLI，请确认项目已安装 @dcloudio/vite-plugin-uni',
      { cause: error },
    )
  }
}

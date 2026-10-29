import type { Platform } from '../platform'
import type { OiyoCommandData } from './common'

import process from 'node:process'

import { defineCommand, runCommand } from 'citty'

import { getPlatformBySelect, PLATFORMS } from '../platform'
import { oiyoCommandArg, oiyoCommandPlugin } from './common'
import { prepareCommand } from './prepare'
import { uniCommand } from './uni'

export const devCommand = defineCommand({
  meta: {
    name: 'dev',
    description: '启动 Oiyo 开发流程',
  },
  plugins: [oiyoCommandPlugin],
  args: {
    target: {
      type: 'positional',
      description: '目标平台，如 h5、mp-weixin、app',
      required: false,
    },
    platform: {
      type: 'string',
      description: '通过参数显式指定平台',
      alias: ['p'],
    },
    ...oiyoCommandArg,
  },
  async run({ args, data }) {
    const { logger, config, mode = 'development' } = data as OiyoCommandData

    const { target, platform, p } = args

    const activePlatform = (target ?? platform ?? p ?? await getPlatformBySelect()) as Platform | null
    if (!activePlatform) {
      process.exit(0)
    }

    const cliLogger = logger.withScope('CLI')
    if (!PLATFORMS.includes(activePlatform)) {
      cliLogger.error(`不支持的平台：${activePlatform}\n可选平台：${PLATFORMS.join(', ')}`)
      process.exit(0)
    }

    const prepareArgs = [
      '--mode', mode,
      ...(args.logLevel ? ['--logLevel', args.logLevel] : []),
    ]

    await runCommand(prepareCommand, {
      rawArgs: prepareArgs,
    })

    const uniRawArgs = ['dev', '--platform', activePlatform, '--mode', mode]

    await runCommand(uniCommand, {
      rawArgs: uniRawArgs,
      data: {
        logger,
        config,
      },
    })
  },
})

import { bold, hex } from 'ansis'
import { defineCommand, runMain } from 'citty'

import packageJson from '../package.json'
import { buildCommand } from './commands/build'
import { devCommand } from './commands/dev'
import { prepareCommand } from './commands/prepare'

const main = defineCommand({
  meta: {
    name: 'oiyo',
    version: packageJson.version,
    description: `${hex('#FC9117')(bold(`Oiyo`))} CLI - 增强型工程框架`,
  },
  subCommands: {
    prepare: prepareCommand,
    dev: devCommand,
    build: buildCommand,
  },
})

runMain(main)

import { defineConfig } from 'tsdown'

export default defineConfig({
  name: '@oiyojs/oiyo',
  entry: {
    index: './src/index.ts',
    global: './src/global.ts',
    config: './src/config.ts',
    plugin: './src/plugin.ts',
  },
  outputOptions: {
    exports: 'named',
  },
  alias: {
    '~': './src',
  },
  format: ['esm', 'cjs'],
  clean: true,
  dts: true,
  failOnWarn: true,
  attw: {
    profile: 'node16',
  },
})

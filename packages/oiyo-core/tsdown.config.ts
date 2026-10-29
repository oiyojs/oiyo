import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    fixedExtension: false,
    entry: {
      index: './src/types.ts',
    },
    dts: {
      emitDtsOnly: true,
    },
  },
  {
    name: '@oiyo/core',
    entry: './src/index.ts',
    outputOptions: {
      exports: 'named',
    },
    alias: {
      '~': './src',
      '#': './src/module',
    },
    env: {
      NODE_ENV: 'test',
    },
    format: ['esm', 'cjs'],
    clean: true,
    dts: false,
    failOnWarn: true,
    cjsDefault: true,
    attw: {
      profile: 'node16',
      ignoreRules: ['false-esm'],
    },
  },
])

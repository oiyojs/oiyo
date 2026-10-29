import skiyee from '@skiyee/eslint-config'

export default skiyee({}, {
  files: ['example/**'],
  rules: {
    'no-console': 'off',
  },
})

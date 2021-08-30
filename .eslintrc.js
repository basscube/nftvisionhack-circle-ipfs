module.exports = {
  env: {
    browser: true,
    mocha: true,
    node: true,
  },
  extends: [
    '@metamask/eslint-config',
    '@metamask/eslint-config/config/nodejs',
  ],
  parserOptions: {
    ecmaVersion: 2018,
  },
  globals: {
    'web3': 'readonly',
    'ethereum': 'readonly',
    'ethers': 'readonly',
  },
  plugins: [
    'json',
  ],
  overrides: [
    {
      files: ['hardhat.config.js'],
      globals: { task: true },
    },
    {
      files: ['scripts/**'],
      rules: { 'no-process-exit': 'off' },
    },
    {
      files: ['hardhat.config.js', 'scripts/**', 'test/**'],
      rules: { 'node/no-unpublished-require': 'off' },
    }, {
      'files': ['src/index.js'],
      'parserOptions': {
        'sourceType': 'module',
      },
    },
  ],
  ignorePatterns: [
    '!.eslintrc.js',
    'dist',
    'test',
    'scripts',
    'hardhat.config.js',
  ],
}

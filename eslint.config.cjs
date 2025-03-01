const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const { nextConfig } = require('eslint-config-next');

module.exports = [
  ...nextConfig,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    ignores: ['node_modules/**', '.next/**', 'out/**', 'public/**'],
  },
];

module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    // other configs...
  ],
  parserOptions: {
    project: './tsconfig.json',
    // other options...
  },
  // other settings...
} 
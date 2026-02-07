module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native', 'prettier'],
  env: {
    'react-native/react-native': true,
    es2021: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-require-imports': 'off',

    // React
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Using TypeScript for props validation
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off', // Not relevant for React Native (no HTML entities)

    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // React Compiler rules (bundled in react-hooks v7) — warn for now
    'react-hooks/refs': 'warn',
    'react-hooks/purity': 'warn',
    'react-hooks/immutability': 'warn',
    'react-hooks/set-state-in-effect': 'warn',

    // React Native
    'react-native/no-unused-styles': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off', // We use theme colors via hooks
    'react-native/no-raw-text': 'off', // Too strict for our use case
    'react-native/sort-styles': 'off',

    // General
    'no-console': 'warn', // Flag console usage for review
    'no-debugger': 'error',
    'prefer-const': 'warn',
    'no-var': 'error',

    // Prettier
    'prettier/prettier': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    '*.config.js',
    'babel.config.js',
    'metro.config.js',
  ],
  overrides: [
    {
      // Allow require() in config files
      files: ['*.config.js', '*.config.ts'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
};

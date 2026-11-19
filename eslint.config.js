import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  globalIgnores(['dist', 'dist-ssr', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser, __APP_VERSION__: 'readonly', __APP_COMMIT__: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  {
    // Not fast-refresh modules: route table and the server-only entry.
    files: ['src/app/router.jsx', 'src/entry-server.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['**/*.test.{js,jsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.vitest } },
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['vite.config.js', 'eslint.config.js', 'scripts/**'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
  // Must stay last: turns off stylistic rules that Prettier owns.
  prettier,
]);

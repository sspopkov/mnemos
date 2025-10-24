import path from 'node:path';
import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const fromRoot = (pattern) => path.join(repoRoot, pattern).replace(/\\/g, '/');

const commonLanguageOptions = {
  ecmaVersion: 2023,
  sourceType: 'module',
};

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ...commonLanguageOptions,
      globals: {
        ...globals.es2021,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'no-console': 'warn',
      'no-debugger': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: [fromRoot('apps/web/**/*.{js,jsx,ts,tsx}')],
    extends: [reactHooks.configs['recommended-latest']],
    languageOptions: {
      ...commonLanguageOptions,
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  {
    files: [fromRoot('apps/api/**/*.{js,ts}')],
    languageOptions: {
      ...commonLanguageOptions,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
  {
    files: ['**/*.{cjs,mjs,cts,mts}'],
    languageOptions: {
      ...commonLanguageOptions,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  }
);

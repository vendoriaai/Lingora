// ESLint config — Lingora
// Strict, no `any` without `// reason:`. Bans ambient IPC channel strings outside
// shared/ipc/contract.ts so the typed contract can't be silently bypassed.
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    // Type-checked rules need per-file TSConfig resolution. List all 5 projects
    // so the parser picks the matching one for each linted file.
    project: [
      './tsconfig.shared.json',
      './tsconfig.renderer.json',
      './tsconfig.main.json',
      './tsconfig.preload.json',
      './tsconfig.test.json',
    ],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    react: { version: 'detect' },
    // Point the TS import resolver at the per-project tsconfigs so it picks up
    // the @renderer/* and @shared/* path aliases defined in each.
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          './tsconfig.shared.json',
          './tsconfig.renderer.json',
          './tsconfig.main.json',
          './tsconfig.preload.json',
          './tsconfig.test.json',
        ],
      },
    },
  },
  env: { browser: true, node: true, es2022: true, worker: true },
  ignorePatterns: [
    'dist',
    'dist-electron',
    'dist-web',
    'release',
    'coverage',
    'node_modules',
    'supabase/functions/*/deno.json',
    'src/renderer/shared/api/db.types.ts',
    'playwright-report',
    '*.config.ts',
  ],
  rules: {
    'no-restricted-syntax': [
      'error',
      // IPC channels must come from the generated contract, never ambient strings.
      {
        selector:
          "CallExpression[callee.object.property.name='ipcRenderer'][callee.property.name='invoke'] Literal",
        message:
          "IPC invoke must use a channel name from shared/ipc/contract.ts CHANNEL — ambient strings are banned.",
      },
      {
        selector:
          "CallExpression[callee.object.property.name='ipcMain'][callee.property.name='handle'] Literal",
        message:
          "ipcMain.handle must use a channel name from shared/ipc/contract.ts CHANNEL — ambient strings are banned.",
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    // Phase 0 ships Promise-parity stubs (async + immediate return) so the
    // renderer calls a consistent shape on both desktop and web. Phase 2+/5
    // wires real awaits in. Keep this as a warning so we catch unfinished
    // async methods without blocking the foundation build.
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-uses-react': 'off',
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-cycle': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  overrides: [
    {
      // Renderer + shared run in the browser; allow DOM globals.
      files: ['src/renderer/**/*.{ts,tsx}', 'src/shared/**/*.ts'],
      env: { browser: true, node: false },
    },
    {
      // Electron main/preload run in Node.
      files: ['src/main/**/*.ts', 'src/preload/**/*.ts'],
      env: { node: true, browser: false, commonjs: true },
      rules: { 'no-console': 'off' },
    },
    {
      // Supabase Edge Functions are Deno — no node imports resolution.
      files: ['supabase/functions/**/*.ts'],
      env: { node: false, browser: false, worker: true },
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'import/no-unresolved': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', 'tests/**/*.{ts,tsx}'],
      env: { jest: true },
      rules: { '@typescript-eslint/no-explicit-any': 'off', 'no-console': 'off' },
    },
  ],
};

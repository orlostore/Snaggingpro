import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist', 'node_modules', 'legacy', 'playwright-report', 'test-results', 'functions'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-restricted-properties': [
        'error',
        { object: 'document', property: 'write', message: 'document.write is forbidden' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: 'innerHTML assignment is forbidden — use lit-html render() instead',
        },
      ],
    },
  },
  prettier,
];

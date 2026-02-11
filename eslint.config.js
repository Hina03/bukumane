import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import nextConfigs from 'eslint-config-next';
import prettier from 'eslint-config-prettier';

const config = [
  {
    ignores: ['node_modules/', '.next/', 'dist/', 'build/', 'prisma/', 'public/'],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/prop-types': 'off',
    },
  },

  ...nextConfigs,

  prettier,
];

export default config;

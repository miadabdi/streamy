import parser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierRecommended from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: ['dist/**', 'node_modules/**', 'binaries/**', 'videoFiles/**', 'logs/**'],
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser,
			parserOptions: {
				project: 'tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
				sourceType: 'module',
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
			prettier: prettierPlugin,
		},
		rules: {
			...tseslint.configs.recommended.rules,
			...prettierRecommended.rules,
			'prettier/prettier': 'error',
			'@typescript-eslint/interface-name-prefix': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},
];

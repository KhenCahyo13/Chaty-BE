import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import perfectionist from 'eslint-plugin-perfectionist'
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default [
    {
        ignores: ["dist/**", "node_modules/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        plugins: {
            perfectionist,
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            "no-console": "error",
            'perfectionist/sort-interfaces': ['error', { order: 'asc', type: 'natural' }],
            'perfectionist/sort-jsx-props': ['error', { order: 'asc', type: 'natural' }],
            'perfectionist/sort-object-types': ['error', { order: 'asc', type: 'natural' }],
            'perfectionist/sort-objects': ['error', { order: 'asc', type: 'natural' }],
            'perfectionist/sort-union-types': ['error', { order: 'asc', type: 'natural' }],
            "simple-import-sort/exports": "error",
            "simple-import-sort/imports": "error",
        },
    },
];

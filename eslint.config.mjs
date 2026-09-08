import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: directory });
const eslintConfig = [{ ignores: ['.next/**'] }, ...compat.extends('next/core-web-vitals')];
export default eslintConfig;

#!/usr/bin/env node

import { build } from 'esbuild';
import { join } from 'path';

const srcDir = join(process.cwd(), 'src');
const distDir = join(process.cwd(), 'dist');

const options = {
  bundle: true,
  entryPoints: [join(srcDir, 'index.ts')],
  format: 'cjs',
  outdir: distDir,
  packages: 'external',
  platform: 'node',
  target: 'esnext',
  tsconfig: '../../tsconfig.json',
};

build(options).catch((err) => {
  console.error(err);
  process.exit(1);
});

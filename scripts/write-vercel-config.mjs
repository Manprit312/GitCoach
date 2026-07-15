#!/usr/bin/env node
/**
 * Writes web/vercel.json with your Railway API URL.
 *
 * Usage:
 *   RAILWAY_PUBLIC_URL=https://gitcoach-api.up.railway.app node scripts/write-vercel-config.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const railwayUrl = process.env.RAILWAY_PUBLIC_URL?.replace(/\/$/, '');

if (!railwayUrl) {
  console.error('Missing RAILWAY_PUBLIC_URL');
  console.error('Example: RAILWAY_PUBLIC_URL=https://gitcoach-api.up.railway.app node scripts/write-vercel-config.mjs');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, '../web/vercel.json');

const config = {
  version: 2,
  buildCommand: 'npm run build',
  outputDirectory: 'dist/web/browser',
  installCommand: 'npm install',
  framework: null,
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${railwayUrl}/api/:path*`,
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
};

fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote ${target}`);
console.log(`API proxy → ${railwayUrl}`);

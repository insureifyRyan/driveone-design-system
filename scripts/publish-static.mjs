#!/usr/bin/env node
/**
 * Assembles the Vercel static output.
 *   public/index.html      the review gallery
 *   public/filled/*.html   sample-data previews for client sign off
 *   public/templates/*.html  merge-tag templates, for review only. The scheduler reads
 *                            templates out of Postgres, not over HTTP.
 */
import { cpSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'templates'), { recursive: true });

cpSync(join(ROOT, 'preview'), OUT, { recursive: true });
cpSync(join(ROOT, 'email/dist'), join(OUT, 'templates'), { recursive: true });

console.log('public/ assembled:', readdirSync(join(OUT, 'templates')).length, 'template files');

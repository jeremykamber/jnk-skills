#!/usr/bin/env node
/**
 * qr.mjs — mint a QR code PNG for a URL, and report what it writes.
 *
 *   node scripts/qr.mjs <url> <out.png>
 *
 * Prints one JSON line: { url, png, bytes, base64Bytes }. The slides
 * skill inlines that base64 into the deck so the QR needs no hosting;
 * the PNG also ships beside the exercise for printing.
 *
 * Encoding is delegated to the `qrcode` package via npx — writing a QR
 * encoder by hand would be a lot of Reed-Solomon for no benefit, and
 * `--yes` keeps it zero-install.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [url, out] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: qr.mjs <url> <out.png>');
  process.exit(1);
}
if (!/^https?:\/\//.test(url)) {
  console.error(`error: "${url}" is not an http(s) URL — a QR that scans to nothing is worse than none`);
  process.exit(1);
}

mkdirSync(dirname(resolve(out)), { recursive: true });
try {
  execFileSync('npx', ['--yes', 'qrcode', '-e', 'M', '-w', '512', '-o', out, url], { stdio: ['ignore', 'ignore', 'pipe'] });
} catch (error) {
  console.error(`error: qrcode failed (${error.message}) — needs network the first time`);
  process.exit(1);
}

const bytes = statSync(out).size;
if (bytes < 200) {
  console.error(`error: ${out} is only ${bytes} bytes — that is not a QR code`);
  process.exit(1);
}
const b64 = readFileSync(out).toString('base64');
console.log(JSON.stringify({ url, png: resolve(out), bytes, base64Bytes: b64.length }));

#!/usr/bin/env node
/**
 * new-exercise.mjs — turn a spec into a runnable exercise.
 *
 *   node scripts/new-exercise.mjs web  <spec.json>        <outdir>
 *   node scripts/new-exercise.mjs code <lang> <spec.json> <outdir>
 *
 * Web:  inlines the shared engine and the spec into assets/shell.html
 *       and writes a self-contained index.html (no build step, no
 *       network, works from a file:// double-click and from Pages).
 * Code: copies the language template and fills its placeholders.
 *
 * Both refuse to build a spec that breaks the design rules — the
 * exercise is not worth publishing if the feedback is missing.
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, chmodSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, basename, extname } from 'node:path';
import { validate } from '../assets/engine.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const argv = process.argv.slice(2);
const [kind, ...rest] = argv;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function loadSpec(path) {
  let spec;
  try {
    spec = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} is not valid JSON (${error.message})`);
  }
  const { errors, warnings } = validate(spec);
  warnings.forEach(w => console.error(`warn  ${w}`));
  if (errors.length) {
    errors.forEach(e => console.error(`ERROR ${e}`));
    fail(`${errors.length} design error(s) — fix the spec before building`);
  }
  return spec;
}

/** The finished page for a spec: shell + engine + spec, one file. */
export function buildWeb(spec) {
  const shell = readFileSync(join(root, 'assets/shell.html'), 'utf8');
  const engine = readFileSync(join(root, 'assets/engine.mjs'), 'utf8')
    .replace(/^export /gm, '')          // one module, two consumers
    .replace(/^\/\*\*[\s\S]*?\*\/\n/m, ''); // drop the file header comment

  const json = JSON.stringify(spec, null, 2).replace(/</g, '\\u003c');
  return shell
    .replace('__TITLE__', spec.meta.title)
    .replace('/*__ENGINE__*/', engine)
    .replace('/*__SPEC__*/', json);
}

function web(specPath, outdir) {
  const spec = loadSpec(specPath);
  const page = buildWeb(spec);

  mkdirSync(outdir, { recursive: true });
  writeFileSync(join(outdir, 'index.html'), page);
  writeFileSync(join(outdir, '.nojekyll'), '');
  writeFileSync(join(outdir, 'README.md'), readme(spec));
  console.log(`wrote ${join(outdir, 'index.html')} — ${spec.steps.length} steps, ${page.length} bytes`);
  console.log('next: publish.mjs to push it and mint the QR');
}

function readme(spec) {
  const meta = spec.meta;
  const mins = Math.max(3, Math.round(spec.steps.length * 1.2));
  return `# ${meta.title}

${meta.objective}

Online: open \`index.html\` (no install, no server) or scan \`qr.png\`.
Paper: not required — the exercise is interactive by design, and the
"show every answer" panel at the end doubles as a review sheet.

## What this is for

- **Audience**: ${meta.audience}
- **Time**: about ${mins} minutes
- **You will**: ${meta.objective}

## How it works

Answer a step, get told *why* the answer is right or wrong, then move
on. Nothing is scored; you are asked for a first attempt so you can see
which steps are shaky, and the ones you miss come back at the end.

${meta.source ? `## Sources\n\n${meta.source}\n` : ''}
## Caveats

Written material drifts: check anything load-bearing against the
sources above. Answers are in the page itself, so this is practice, not
assessment — that is deliberate.
`;
}

function code(lang, specPath, outdir) {
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  for (const key of ['slug', 'title', 'objective']) {
    if (!spec[key]) fail(`${basename(specPath)} needs "${key}"`);
  }
  const template = join(root, 'assets/templates', lang);
  try {
    statSync(template);
  } catch {
    const available = readdirSync(join(root, 'assets/templates')).join(', ');
    fail(`no template for "${lang}" (available: ${available}) — see references/code-mode.md for the contract`);
  }

  cpSync(template, outdir, { recursive: true });
  const swap = {
    __SLUG__: spec.slug,
    __TITLE__: spec.title,
    __OBJECTIVE__: spec.objective,
    __AUDIENCE__: spec.audience || 'students who have seen the material once'
  };
  const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return [path];
  });
  walk(outdir).filter(path => ['.md', '.txt', '.sh', '.py', '.js', '.mjs', '.c', '.h', '.json', 'Makefile'].includes(extname(path) || basename(path)))
    .forEach(path => {
      const before = readFileSync(path, 'utf8');
      let after = before;
      for (const [token, value] of Object.entries(swap)) after = after.split(token).join(value);
      if (after !== before) writeFileSync(path, after);
      if (basename(path) === 'run.sh') chmodSync(path, 0o755);
    });

  console.log(`wrote ${outdir} from the ${lang} template`);
  console.log('starter tests fail by design; verify with:  cd ' + outdir + ' && ./run.sh');
}

if (import.meta.url === `file://${process.argv[1]}`) main();

function main() {
if (kind === 'web' && rest.length === 2) web(rest[0], rest[1]);
else if (kind === 'code' && rest.length === 3) code(rest[0], rest[1], rest[2]);
else fail('usage: new-exercise.mjs web <spec.json> <outdir>  |  new-exercise.mjs code <lang> <spec.json> <outdir>');
}

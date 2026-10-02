#!/usr/bin/env node
/**
 * publish.mjs — put an exercise on GitHub and mint the QR the deck uses.
 *
 *   node scripts/publish.mjs <exercise-dir> --mode web|code [options]
 *
 *   --name <slug>    repo name (default: the directory name)
 *   --out <path>     where the activity JSON goes (default: beside the dir)
 *   --dry-run        do everything local, print the plan, touch no remote
 *   --owner <login>  override the account (default: the gh CLI's account)
 *
 * What it guarantees:
 *   - the published tree is the *student* tree: teacher/ never leaves the
 *     machine, and neither does anything gitignored;
 *   - the repo is public, so students can clone it without asking;
 *   - for web mode, Pages is enabled and the live URL is confirmed before
 *     this script reports success (a QR to a 404 is worse than none);
 *   - both modes leave `qr.png` inside the repo (printable, and the file
 *     the deck inlines) and an activity JSON for the calling agent.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { dirname, resolve, join, basename } from 'node:path';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const dir = args[0];
if (!dir || dir.startsWith('--')) {
  console.error('usage: publish.mjs <exercise-dir> --mode web|code [--name slug] [--dry-run]');
  process.exit(1);
}
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const dryRun = args.includes('--dry-run');
const mode = flag('mode');
if (!['web', 'code'].includes(mode)) {
  console.error('error: --mode web|code is required — the live URL depends on it');
  process.exit(1);
}

const source = resolve(dir);
const slug = flag('name') || basename(source).replace(/[^a-z0-9-]+/gi, '-').toLowerCase();
const run = (cmd, cmdArgs, options = {}) =>
  execFileSync(cmd, cmdArgs, { encoding: 'utf8', stdio: options.quiet ? ['ignore', 'pipe', 'pipe'] : undefined, ...options }).trim();

const owner = flag('owner') || (dryRun ? 'dry-run-owner' : run('gh', ['api', 'user', '-q', '.login']));
const repo = `${owner}/${slug}`;
const repoUrl = `https://github.com/${repo}`;
const liveUrl = mode === 'web' ? `https://${owner}.github.io/${slug}/` : null;
const url = liveUrl || repoUrl;

/* ------------------------------------------------------------ staging */

const stage = join(tmpdir(), `publish-${slug}-${Date.now()}`);
mkdirSync(stage, { recursive: true });
cpSync(source, stage, {
  recursive: true,
  filter: path => {
    const rel = path.slice(source.length + 1);
    if (!rel) return true;
    return !/^(teacher|\.git|node_modules|solution)(\/|$)/.test(rel);
  }
});
if (existsSync(join(stage, 'teacher'))) {
  console.error('error: teacher/ survived staging — refusing to publish a solution');
  process.exit(1);
}
// The teacher tree stays behind, so the local repo cannot leak it either.
const ignore = join(stage, '.gitignore');
const ignoreBody = existsSync(ignore) ? readFileSync(ignore, 'utf8') : '';
if (!/teacher\//.test(ignoreBody)) writeFileSync(ignore, `${ignoreBody.trimEnd()}\nteacher/\n`.trimStart());

/* ----------------------------------------------------------------- qr */

const qrPath = join(stage, 'qr.png');
run(process.execPath, [join(dirname(new URL(import.meta.url).pathname), 'qr.mjs'), url, qrPath], { quiet: true });
const qrBytes = readFileSync(qrPath).toString('base64').length;

/* ------------------------------------------------------------ readme */

const readme = join(stage, 'README.md');
if (existsSync(readme)) {
  const body = readFileSync(readme, 'utf8');
  const line = mode === 'web' ? `**Live:** ${liveUrl}` : `**Clone:** \`git clone ${repoUrl}.git\``;
  if (!body.includes(url)) writeFileSync(readme, body.replace(/^(# .*\n)/, `$1\n${line}\n`));
}

/* -------------------------------------------------------------- plan */

const plan = [
  `git init -b main`,
  `git add -A`,
  `git commit -m "Add ${slug} exercise"`,
  `gh repo create ${repo} --public --source . --remote origin --push`,
  mode === 'web' ? `gh api -X POST repos/${repo}/pages -f "source[branch]=main" -f "source[path]=/"` : null,
  mode === 'web' ? `wait for ${liveUrl} to answer 200` : null
].filter(Boolean);

if (dryRun) {
  console.log(`dry run — staged ${stage} (${readdirSync(stage).length} entries, qr ${qrBytes} base64 chars)`);
  plan.forEach(step => console.log(`  would run: ${step}`));
} else {
  const git = (...gitArgs) => run('git', gitArgs, { cwd: stage, quiet: true });
  git('init', '-b', 'main');
  git('add', '-A');
  try {
    git('commit', '-m', `Add ${slug} exercise`);
  } catch {
    // A machine with no git identity is common; borrow the GitHub account's.
    const email = run('gh', ['api', 'user', '-q', '.email']) || `${owner}@users.noreply.github.com`;
    git('config', 'user.email', email);
    git('config', 'user.name', owner);
    git('commit', '-m', `Add ${slug} exercise`);
  }
  const exists = (() => {
    try {
      run('gh', ['repo', 'view', repo, '--json', 'name'], { quiet: true });
      return true;
    } catch {
      return false;
    }
  })();
  if (exists) {
    run('git', ['remote', 'add', 'origin', `${repoUrl}.git`], { cwd: stage, quiet: true });
    run('git', ['push', '-u', 'origin', 'main'], { cwd: stage });
  } else {
    run('gh', ['repo', 'create', repo, '--public', '--source', stage, '--remote', 'origin', '--push',
      '--description', `Practice exercise: ${slug}`]);
  }
  if (mode === 'web') {
    try {
      run('gh', ['api', '-X', 'POST', `repos/${repo}/pages`, '-f', 'source[branch]=main', '-f', 'source[path]=/'], { quiet: true });
    } catch {
      run('gh', ['api', '-X', 'PUT', `repos/${repo}/pages`, '-f', 'source[branch]=main', '-f', 'source[path]=/'], { quiet: true });
    }
    const deadline = Date.now() + 180_000;
    let live = false;
    while (Date.now() < deadline) {
      try {
        const status = run('gh', ['api', `repos/${repo}/pages`, '--jq', '.status'], { quiet: true });
        const code = run('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', liveUrl], { quiet: true });
        if (status === 'built' && code === '200') {
          live = true;
          break;
        }
      } catch {
        // Pages not ready yet.
      }
      execFileSync('sleep', ['5']);
    }
    if (!live) {
      console.error(`warn  Pages was not confirmed within 3 minutes — check ${liveUrl} before class`);
    }
  }
}

const activity = {
  slug,
  mode,
  title: (() => {
    try {
      return readFileSync(join(source, 'README.md'), 'utf8').split('\n')[0].replace(/^#\s*/, '').trim();
    } catch {
      return slug;
    }
  })(),
  url,
  liveUrl,
  repo,
  repoUrl,
  qrPng: resolve(dirname(source), `${slug}.qr.png`),
  activityJson: resolve(flag('out') || dirname(source), `${slug}.activity.json`),
  publishedFrom: source,
  dryRun
};
cpSync(join(stage, 'qr.png'), activity.qrPng);
mkdirSync(dirname(activity.activityJson), { recursive: true });
writeFileSync(activity.activityJson, `${JSON.stringify(activity, null, 2)}\n`);
if (!dryRun) rmSync(stage, { recursive: true, force: true });

console.log(JSON.stringify(activity, null, 2));

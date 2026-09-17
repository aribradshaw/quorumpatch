import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 20_000_000 });
const allowed = /^(?:app\/|public\/|scripts\/|tests\/|config\/|\.github\/workflows\/|\.githooks\/|(?:README|SECURITY|AGENTS)\.md$|LICENSE$|package(?:-lock)?\.json$|tsconfig\.json$|vite\.config\.ts$|devlog\.config\.json$|\.gitignore$|\.gitattributes$|\.oxfmtrc\.json$)/;
const forbiddenPath = /(?:^|\/)(?:\.env[^/]*|outputs|evidence|candidates|monitor|node_modules|\.openai)(?:\/|$)|\.(?:mp4|pdf|zip|pem|key)$/i;
const patterns = [
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /(?:sk_live_|slr_live_|sb_secret_|gh[pousr]_)[A-Za-z0-9_-]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/,
  /https?:\/\/[^\s"']+\.supabase\.co/i,
  /(?:C:\\Users\\|\/Users\/|\/home\/)[A-Za-z]/,
  /\[#\d{4,}\]|\bIS#\d+\b/,
];
function scan(name, bytes) {
  if (!allowed.test(name) || forbiddenPath.test(name)) throw new Error('Unapproved public path: ' + name);
  // Explicitly reviewed recording of public-only UI and saved open-source runs.
  if (name === 'public/quorumpatch-demo.webm') return;
  if (/\.(png|svg)$/.test(name)) {
    if (!['public/quorumpatch-mark.png', 'public/favicon.svg'].includes(name)) throw new Error('Unreviewed asset: ' + name);
    return;
  }
  const text = bytes.toString('utf8');
  if (patterns.some(p => p.test(text))) throw new Error('Potential private content: ' + name);
  if (name === 'public/pilot-proof.json') {
    const data = JSON.parse(text);
    for (const c of data.cases) {
      if (Object.keys(c).some(k => /sha|commit|recordedAt|sandboxId|ticket|client/i.test(k))) throw new Error('Private provenance field');
    }
  }
}
const files = git('ls-files', '-z').split('\0').filter(Boolean);
if (!files.length) throw new Error('No reviewed files staged');
for (const f of files) scan(f, readFileSync(f));
if (process.argv.includes('--history')) {
  for (const commit of git('rev-list', '--all').trim().split('\n').filter(Boolean)) {
    for (const f of git('ls-tree', '-r', '--name-only', commit).trim().split('\n').filter(Boolean)) scan(f, execFileSync('git', ['show', `${commit}:${f}`], { maxBuffer: 20_000_000 }));
  }
}
console.log(`Public boundary check passed for ${files.length} files. Human review is still required.`);

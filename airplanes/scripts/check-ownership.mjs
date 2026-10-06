// Checks that a branch only changed files its owner may change (docs/CONTRACTS.md → Ownership).
// Usage: node scripts/check-ownership.mjs <owner> [base=HEAD of the scaffold] [ref=HEAD]
//   owners: lead | content | 3d | frontend | qa
import { execFileSync } from 'node:child_process'

const OWNERS = {
  content: [/^airplanes\/src\/data\/(?!types\.ts$)/, /^airplanes\/docs\/(FACTS|CREDITS)\.md$/, /^airplanes\/scripts\/assets\//, /^airplanes\/public\/textures\/earth\//],
  '3d': [/^airplanes\/src\/three\//, /^airplanes\/public\/textures\/fx\//, /^airplanes\/public\/posters\//, /^airplanes\/public\/video\//, /^airplanes\/scripts\/capture\.mjs$/],
  frontend: [/^airplanes\/src\/ui\//, /^airplanes\/src\/scroll\//, /^airplanes\/src\/lite\//, /^airplanes\/src\/styles\//, /^airplanes\/public\/privacy\.html$/],
  qa: [/^airplanes\/tests\//, /^airplanes\/playwright\.config\.ts$/, /^airplanes\/qa\//],
}

const [owner, base = 'scaffold', ref = 'HEAD'] = process.argv.slice(2)
if (!owner || (!OWNERS[owner] && owner !== 'lead')) {
  console.error('usage: node scripts/check-ownership.mjs <content|3d|frontend|qa|lead> [base] [ref]')
  process.exit(2)
}
const changed = execFileSync('git', ['diff', '--name-only', `${base}...${ref}`], { encoding: 'utf8' }).split('\n').filter(Boolean)
if (owner === 'lead') {
  const others = Object.entries(OWNERS).flatMap(([o, rules]) => changed.filter((f) => rules.some((r) => r.test(f))).map((f) => `${o}: ${f}`))
  console.log(others.length ? `Lead branch touches agent-owned files:\n${others.join('\n')}` : 'ok')
  process.exit(others.length ? 1 : 0)
}
const foreign = changed.filter((f) => !OWNERS[owner].some((r) => r.test(f)))
if (foreign.length) {
  console.error(`${owner} changed files it does not own:\n${foreign.join('\n')}`)
  process.exit(1)
}
console.log(`ok: ${changed.length} files, all owned by ${owner}`)

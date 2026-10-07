/** Who owns a path (docs/CONTRACTS.md §2), for routing bugs found by build checks. Paths relative to airplanes/. */
export type Owner = 'lead' | 'content' | '3d' | 'frontend' | 'qa'

export function ownerOf(path: string): Owner {
  const p = path.replace(/^\.?\/?(airplanes\/)?/, '')
  if (/^src\/data\/types\.ts$/.test(p)) return 'lead'
  if (/^src\/data\//.test(p) || /^docs\/(FACTS|CREDITS)\.md$/.test(p) || /^scripts\/assets\//.test(p) || /^public\/textures\/earth\//.test(p)) return 'content'
  if (/^src\/three\//.test(p) || /^public\/(textures\/fx|posters|video)\//.test(p) || /^scripts\/capture\.mjs$/.test(p)) return '3d'
  if (/^src\/(ui|scroll|lite|styles)\//.test(p) || /^public\/privacy\.html$/.test(p)) return 'frontend'
  if (/^(tests|qa)\//.test(p) || /^playwright\.config\.ts$/.test(p)) return 'qa'
  return 'lead'
}

/** Groups "path(line,col): message" style lines by owner. */
export function groupByOwner(lines: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const l of lines) {
    const path = l.trim().match(/^([\w./-]+\.(?:tsx?|mjs|js|css|json))/)?.[1] ?? ''
    const o = path ? ownerOf(path) : 'lead'
    ;(out[o] ??= []).push(l.trim())
  }
  return out
}

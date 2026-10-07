import { store } from '../../state/store'

/**
 * Real loading progress for the loader (store.boot.assets, 0..1): the hero's own assets
 * (cloud atlas, jet model, environment, shaders). Later scenes stream in after the first frame
 * and do not hold the loader.
 */
const items = new Map<string, { weight: number; done: boolean }>()
let reported = -1

function report(): void {
  let total = 0
  let done = 0
  for (const it of items.values()) {
    total += it.weight
    if (it.done) done += it.weight
  }
  const p = total > 0 ? Math.round((done / total) * 100) / 100 : 0
  if (p !== reported) {
    reported = p
    store.getState().setBoot({ assets: p })
  }
}

/** Register a hero asset; call the returned function when it is ready. */
export function expect(name: string, weight = 1): () => void {
  if (!items.has(name)) items.set(name, { weight, done: false })
  report()
  return () => {
    const it = items.get(name)
    if (it && !it.done) {
      it.done = true
      report()
    }
  }
}

export function allDone(): boolean {
  for (const it of items.values()) if (!it.done) return false
  return items.size > 0
}

export function resetProgress(): void {
  items.clear()
  reported = -1
}

import { store } from '../state/store'

/**
 * Runs `fn` once bootstrap() has picked 3D or the lighter version (App's effect runs after its
 * children's effects, so on the first commit the store is still in mode 'boot'). Returns a cleanup
 * that unsubscribes and runs fn's own cleanup.
 */
export function whenBooted(fn: () => () => void): () => void {
  let cleanup: (() => void) | null = null
  if (store.getState().mode !== 'boot') {
    cleanup = fn()
    return () => cleanup?.()
  }
  const unsub = store.subscribe((s) => {
    if (s.mode === 'boot' || cleanup) return
    unsub()
    cleanup = fn()
  })
  return () => {
    unsub()
    cleanup?.()
  }
}

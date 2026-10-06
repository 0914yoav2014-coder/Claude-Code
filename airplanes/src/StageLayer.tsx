import { lazy, Suspense } from 'react'
import ErrorBoundary from './ErrorBoundary'
import { store, useApp } from './state/store'

/** The 3D chunk loads only in 3D mode, after hydration (so the hero text and poster paint first). */
const Stage = lazy(() => import('./three/Stage'))

export default function StageLayer() {
  const mode = useApp((s) => s.mode)
  if (mode !== '3d') return null
  return (
    <div className="stage-layer" data-testid="stage" aria-hidden="true">
      <ErrorBoundary onError={() => store.getState().enterLite('context-failed')}>
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

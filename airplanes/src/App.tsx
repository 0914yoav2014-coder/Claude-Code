import { useEffect } from 'react'
import { bootstrap } from './lib/boot'
import StageLayer from './StageLayer'
import Page from './ui/Page'

/**
 * Composition (Lead): the fixed 3D stage behind, the page (all real text and controls) in front.
 * Both render identically on the server and on the first client render (mode 'boot');
 * bootstrap() then picks 3D or the lighter version.
 */
export default function App() {
  useEffect(() => {
    bootstrap()
  }, [])
  return (
    <>
      <StageLayer />
      <Page />
    </>
  )
}

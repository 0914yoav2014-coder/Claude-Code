import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Two builds from one source:
// - default: code-split for static hosting (hero first, 3D chunk loads after hydration)
// - `--mode artifact`: one JS file with no dynamic chunks, so scripts/inline-artifact.mjs can
//   inline it into a single page for the claude.ai Artifact (whose CSP admits inline scripts only)
export default defineConfig(({ mode, isSsrBuild }) => {
  const artifact = mode === 'artifact'
  return {
    base: './',
    plugins: [react()],
    define: {
      __ARTIFACT__: JSON.stringify(artifact),
    },
    build: {
      target: 'es2022',
      assetsInlineLimit: 0,
      rolldownOptions: artifact && !isSsrBuild ? { output: { codeSplitting: false } } : undefined,
    },
    server: { port: 5173, strictPort: false },
  }
})

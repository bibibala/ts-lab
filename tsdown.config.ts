import { defineConfig } from 'tsdown'
import { StaleGuardRecorder } from 'tsdown-stale-guard'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/browser/index.ts',
    'src/tools/index.ts',
    'src/ui/index.ts',
    'src/wasm/index.ts',
  ],
  dts: true,
  exports: true,
  publint: true,
  plugins: [
    StaleGuardRecorder(),
  ],
})

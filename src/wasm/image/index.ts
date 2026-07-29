import type { WasmModule } from './fun.js'

let _module: WasmModule | null = null
let _initPromise: Promise<WasmModule> | null = null

function checkBrowser(): void {
  if (typeof WebAssembly === 'undefined') {
    throw new Error(
      'WebAssembly is not available in this browser. Requires Chrome 57+, Firefox 52+, Safari 15+, or Edge 16+.',
    )
  }

  try {
    void new Uint8Array(1)
  }
  catch {
    throw new Error('TypedArray support is missing — please upgrade your browser.')
  }

  if (typeof fetch !== 'function') {
    throw new TypeError('Fetch API is not available — please upgrade your browser.')
  }
}

export async function initModule(): Promise<WasmModule> {
  checkBrowser()

  if (_module)
    return _module
  if (_initPromise)
    return _initPromise

  _initPromise = (async () => {
    const factory = (await import('./fun.js')).default
    try {
      _module = await factory()
    }
    catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('wasm') || msg.includes('WASM')) {
        throw new Error(
          `Failed to instantiate the WebAssembly module: ${msg}. Check your network and browser compatibility.`,
        )
      }
      if (msg.includes('fetch') || msg.includes('URL')) {
        throw new Error(
          `Failed to fetch the .wasm binary: ${msg}. Make sure fun.wasm is deployed alongside the JS bundle.`,
        )
      }
      throw e
    }
    return _module
  })()

  return _initPromise
}

const PNG_SIZES = [16, 24, 30, 32, 40, 48, 64, 72, 80, 96, 128, 256, 512, 1024]

function readPngs(mod: WasmModule): Record<number, Uint8Array> {
  const result: Record<number, Uint8Array> = {}
  for (const size of PNG_SIZES) {
    try {
      result[size] = mod.FS_readFile(`/${size}.png`)
    }
    catch {
      // some sizes may not be generated for the given source image
    }
  }
  return result
}

function assertModule(mod: WasmModule | null): asserts mod is WasmModule {
  if (!mod) {
    throw new Error('Module not initialized — call initModule() first.')
  }
}

function writeInput(mod: WasmModule, imageData: Uint8Array): void {
  if (imageData.byteLength === 0) {
    throw new Error('imageData must not be empty.')
  }
  if (imageData.byteLength > 50 * 1024 * 1024) {
    throw new Error('Image size exceeds the 50 MB limit.')
  }
  mod.FS_writeFile('input.png', imageData)
}

export async function getIco(imageData: Uint8Array): Promise<Uint8Array> {
  const mod = await initModule()
  assertModule(mod)
  writeInput(mod, imageData)
  mod.ccall('wasm_convert_to_ico', 'number', ['string', 'string'], ['input.png', 'output.ico'])
  return mod.FS_readFile('output.ico')
}

export async function getIcns(imageData: Uint8Array): Promise<Uint8Array> {
  const mod = await initModule()
  assertModule(mod)
  writeInput(mod, imageData)
  mod.ccall('wasm_convert_to_icns', 'number', ['string', 'string'], ['input.png', 'output.icns'])
  return mod.FS_readFile('output.icns')
}

export async function getPngs(imageData: Uint8Array): Promise<Record<number, Uint8Array>> {
  const mod = await initModule()
  assertModule(mod)
  writeInput(mod, imageData)
  mod.ccall('wasm_convert_to_pngs', 'number', ['string'], ['input.png'])
  return readPngs(mod)
}

export async function getImageBoth(imageData: Uint8Array): Promise<{
  ico: Uint8Array
  icns: Uint8Array
  pngs: Record<number, Uint8Array>
}> {
  const mod = await initModule()
  assertModule(mod)
  writeInput(mod, imageData)
  mod.ccall('wasm_convert_to_both', 'number', ['string', 'string'], ['input.png', 'output_both'])

  return {
    ico: mod.FS_readFile('output_both.ico'),
    icns: mod.FS_readFile('output_both.icns'),
    pngs: readPngs(mod),
  }
}

import type { WasmModule } from './fun.js'

let _module: WasmModule | null = null
let _initPromise: Promise<WasmModule> | null = null

export async function initModule(): Promise<WasmModule> {
  if (_module)
    return _module
  if (_initPromise)
    return _initPromise

  _initPromise = (async () => {
    const factory = (await import('./fun.js')).default
    _module = await factory()
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
    catch { /* 该尺寸可能未生成 */ }
  }
  return result
}

export async function getIco(imageData: Uint8Array): Promise<Uint8Array> {
  const mod = await initModule()
  mod.FS_writeFile('input.png', imageData)
  mod.ccall('wasm_convert_to_ico', 'number', ['string', 'string'], ['input.png', 'output.ico'])
  return mod.FS_readFile('output.ico')
}

export async function getIcns(imageData: Uint8Array): Promise<Uint8Array> {
  const mod = await initModule()
  mod.FS_writeFile('input.png', imageData)
  mod.ccall('wasm_convert_to_icns', 'number', ['string', 'string'], ['input.png', 'output.icns'])
  return mod.FS_readFile('output.icns')
}

export async function getPngs(imageData: Uint8Array): Promise<Record<number, Uint8Array>> {
  const mod = await initModule()
  mod.FS_writeFile('input.png', imageData)
  mod.ccall('wasm_convert_to_pngs', 'number', ['string'], ['input.png'])
  return readPngs(mod)
}

export async function getImageBoth(imageData: Uint8Array): Promise<{
  ico: Uint8Array
  icns: Uint8Array
  pngs: Record<number, Uint8Array>
}> {
  const mod = await initModule()
  mod.FS_writeFile('input.png', imageData)
  mod.ccall('wasm_convert_to_both', 'number', ['string', 'string'], ['input.png', 'output_both'])

  return {
    ico: mod.FS_readFile('output_both.ico'),
    icns: mod.FS_readFile('output_both.icns'),
    pngs: readPngs(mod),
  }
}

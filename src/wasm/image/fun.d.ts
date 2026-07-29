/**
 * Emscripten WASM module — 图片转图标工具
 *
 * 底层导出的是 Emscripten MODULARIZE 工厂函数。
 * 调用默认导出（传入可选 moduleArg）返回 Promise<Module>。
 */

export interface WasmModule {
  /** 调用 WASM C 函数 */
  ccall: (ident: string, returnType: string, argTypes: string[], args: unknown[], opts?: unknown) => unknown
  /** 写文件到虚拟文件系统 */
  FS_writeFile: (path: string, data: Uint8Array) => void
  /** 从虚拟文件系统读文件 */
  FS_readFile: (path: string) => Uint8Array
  /** 释放虚拟文件系统中的文件 */
  FS_unlink: (path: string) => void
  /** WASM 堆内存 */
  HEAPU8: Uint8Array
}

export type ModuleFactory = (moduleArg?: Record<string, unknown>) => Promise<WasmModule>

declare const factory: ModuleFactory
export default factory

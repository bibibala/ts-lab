// ===================== Types =====================

export enum ECLevel { L = 0, M = 1, Q = 2, H = 3 }

export interface QRCode {
  modules: boolean[][]
  version: number
  size: number
  ecLevel: ECLevel
}

export interface ImageInput {
  data: Uint8ClampedArray | Uint8Array | number[]
  width: number
  height: number
}

export interface RenderOptions {
  moduleSize?: number
  margin?: number
  darkColor?: string
  lightColor?: string
}

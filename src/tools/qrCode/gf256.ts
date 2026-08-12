// ===================== GF(256) =====================

export const EXP = new Uint8Array(512)
export const LOG = new Int16Array(256)

;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x = (x << 1) ^ (x & 0x80 ? 0x11D : 0)
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

export function gfMul(a: number, b: number): number {
  return a && b ? EXP[LOG[a] + LOG[b]] : 0
}

export function gfDiv(a: number, b: number): number {
  return a ? EXP[(LOG[a] - LOG[b] + 255) % 255] : 0
}

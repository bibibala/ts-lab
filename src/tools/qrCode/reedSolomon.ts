// ===================== Reed-Solomon =====================

import { EXP, gfDiv, gfMul } from './gf256'

export function rsGenPoly(n: number): number[] {
  let g = [1]
  for (let i = 0; i < n; i++) {
    const ng: number[] = []
    ng.length = g.length + 1
    ng.fill(0)
    for (let j = 0; j < g.length; j++) {
      ng[j] ^= g[j]
      ng[j + 1] ^= gfMul(g[j], EXP[i])
    }
    g = ng
  }
  return g
}

export function rsEncode(data: number[], nsym: number): number[] {
  const gen = rsGenPoly(nsym)
  const rem: number[] = []
  rem.length = nsym
  rem.fill(0)
  for (let i = 0; i < data.length; i++) {
    const fb = (data[i] ^ rem[0])
    rem.shift()
    rem.push(0)
    if (fb) {
      for (let j = 0; j < nsym; j++) rem[j] ^= gfMul(gen[j + 1], fb)
    }
  }
  return rem
}

export function rsDecode(block: number[], nsym: number): number[] | null {
  const n = block.length
  const k = n - nsym

  // Syndromes
  const S: number[] = []
  let hasErr = false
  for (let i = 0; i < nsym; i++) {
    let v = 0
    for (let j = 0; j < n; j++) v = gfMul(v, EXP[i]) ^ block[j]
    S.push(v)
    if (v)
      hasErr = true
  }
  if (!hasErr)
    return block.slice(0, k)

  // Berlekamp-Massey
  let sigma = [1]
  let B = [1]
  let L = 0
  for (let r = 0; r < nsym; r++) {
    let d = S[r]
    for (let i = 1; i < sigma.length; i++) d ^= gfMul(sigma[i], S[r - i])
    if (d === 0) {
      B.unshift(0)
    }
    else {
      const T = sigma.slice()
      const nSig = sigma.slice()
      const dxB = [0, ...B.map(c => gfMul(c, d))]
      while (nSig.length < dxB.length) nSig.push(0)
      for (let i = 0; i < dxB.length; i++) nSig[i] ^= dxB[i]
      sigma = nSig
      if (2 * L <= r) {
        L = r + 1 - L
        B = T.map(c => gfDiv(c, d))
      }
      else {
        B.unshift(0)
      }
    }
  }

  // Chien search
  const errPos: number[] = []
  const ec = sigma.slice()
  for (let m = 0; m < n; m++) {
    let v = 0
    for (const c of ec) v ^= c
    if (v === 0)
      errPos.push(n - 1 - m)
    for (let j = 1; j < ec.length; j++) ec[j] = gfMul(ec[j], EXP[(255 - j) % 255])
  }
  if (errPos.length !== L)
    return null

  // Forney
  const omega: number[] = []
  omega.length = nsym
  omega.fill(0)
  for (let i = 0; i < nsym; i++) {
    for (let j = 0; j < sigma.length && i + j < nsym; j++)
      omega[i + j] ^= gfMul(S[i], sigma[j])
  }

  const corrected = block.slice()
  for (const pos of errPos) {
    const m = n - 1 - pos
    const X = EXP[m % 255]
    const Xi = EXP[(255 - m % 255) % 255]
    let ov = 0
    let p = 1
    for (let i = 0; i < omega.length; i++) {
      ov ^= gfMul(omega[i], p)
      p = gfMul(p, Xi)
    }
    let sv = 0
    const xis = gfMul(Xi, Xi)
    p = 1
    for (let i = 1; i < sigma.length; i += 2) {
      sv ^= gfMul(sigma[i], p)
      p = gfMul(p, xis)
    }
    if (!sv)
      return null
    corrected[pos] ^= gfMul(X, gfDiv(ov, sv))
  }
  return corrected.slice(0, k)
}

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getNetworkInfo } from '../src/browser/network'

describe('network', () => {
  describe('getNetworkInfo', () => {
    describe('browser environment', () => {
      beforeEach(() => {
        vi.stubGlobal('window', {})
      })

      it('should return current network info', () => {
        vi.stubGlobal('navigator', {
          onLine: true,
          connection: {
            effectiveType: '4g',
            downlink: 10,
            rtt: 50,
            saveData: false,
            type: 'wifi',
          },
        })

        const result = getNetworkInfo()

        expect(result).toEqual({
          online: true,
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false,
          connectionType: 'wifi',
        })
      })

      it('should fall back to defaults when connection API is unavailable', () => {
        vi.stubGlobal('navigator', {
          onLine: false,
          connection: undefined,
        })

        const result = getNetworkInfo()

        expect(result).toEqual({
          online: false,
          effectiveType: 'unknown',
          downlink: 0,
          rtt: 0,
          saveData: false,
          connectionType: 'unknown',
        })
      })

      it('should fall back to mozConnection when connection is absent', () => {
        vi.stubGlobal('navigator', {
          onLine: true,
          mozConnection: { effectiveType: '3g', downlink: 1.5, rtt: 300, saveData: true, type: 'cellular' },
        })

        const result = getNetworkInfo()

        expect(result.effectiveType).toBe('3g')
        expect(result.connectionType).toBe('cellular')
        expect(result.saveData).toBe(true)
      })

      it('should fall back to webkitConnection when both connection and mozConnection are absent', () => {
        vi.stubGlobal('navigator', {
          onLine: true,
          webkitConnection: { effectiveType: 'wifi', downlink: 50, rtt: 10, saveData: false, type: 'wifi' },
        })

        const result = getNetworkInfo()

        expect(result.effectiveType).toBe('wifi')
        expect(result.downlink).toBe(50)
      })
    })

    describe('non-browser environment', () => {
      it('should warn and return defaults', () => {
        vi.unstubAllGlobals()
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const result = getNetworkInfo()

        expect(warnSpy).toHaveBeenCalledTimes(1)
        expect(result).toEqual({
          online: false,
          effectiveType: 'unknown',
          downlink: 0,
          rtt: 0,
          saveData: false,
          connectionType: 'unknown',
        })

        warnSpy.mockRestore()
      })
    })
  })
})

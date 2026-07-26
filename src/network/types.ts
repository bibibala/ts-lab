/**
 * Current network environment info.
 */
export interface NetworkInfo {
  /** Whether the browser is online */
  online: boolean
  /** Network type: 4g / 3g / 2g / slow-2g / wifi / ethernet / unknown */
  effectiveType: string
  /** Estimated downlink speed in Mb/s */
  downlink: number
  /** Estimated round-trip time in ms */
  rtt: number
  /** Whether the user has enabled data-saver mode */
  saveData: boolean
  /** Connection type (partial browser support): wifi / cellular / ethernet / none / unknown */
  connectionType: string
}

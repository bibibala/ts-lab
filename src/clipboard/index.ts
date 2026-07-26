/**
 * Write a base64-encoded image to the clipboard.
 * Falls back to downloading the image if the Clipboard API is unavailable.
 *
 * @param src - A base64 image data URI (e.g. `data:image/png;base64,...`)
 * @throws {Error} If the source is not a valid base64 image or copying fails
 *
 * @example
 * ```ts
 * await writeImgToClipboard('data:image/png;base64,iVBOR...')
 * ```
 */
export async function writeImgToClipboard(src: string): Promise<void> {
  const base64Regex = /^data:image\/(?:png|jpeg|jpg|gif);base64,/
  if (!base64Regex.test(src)) {
    throw new Error('Source must be a base64-encoded image.')
  }

  const img = new Image()
  img.crossOrigin = 'Anonymous'
  img.src = src

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load the image.'))
  })

  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(blob => resolve(blob!), 'image/png')
  })

  if (navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ])
  }
  else {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'image.png'
    a.click()
    URL.revokeObjectURL(a.href)
  }
}

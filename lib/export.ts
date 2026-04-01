import { toPng } from 'html-to-image'

export async function exportAdElement(
  element: HTMLElement,
  targetWidth: number,
  targetHeight: number,
  filename: string
): Promise<void> {
  await document.fonts?.ready

  const dataUrl = await toPng(element, {
    canvasWidth: targetWidth,
    canvasHeight: targetHeight,
    pixelRatio: 2
  })

  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = dataUrl
  link.click()
}

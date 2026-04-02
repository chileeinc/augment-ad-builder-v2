import { toPng } from 'html-to-image'

const CANVAS_SIZE = 1080

export async function exportAdElement(
  element: HTMLElement,
  filename: string
): Promise<void> {
  await document.fonts.ready

  const dataUrl = await toPng(element, {
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    pixelRatio: 2,
    cacheBust: true,
  })
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = dataUrl
  link.click()
}

import { describe, it, expect, vi } from 'vitest'

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,abc123')
}))

import { exportAdElement } from './export'
import { toPng } from 'html-to-image'

describe('exportAdElement', () => {
  it('calls toPng with correct dimensions', async () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'offsetWidth', { value: 400 })
    Object.defineProperty(el, 'offsetHeight', { value: 400 })

    await exportAdElement(el, 1080, 1080, 'test-ad')

    expect(toPng).toHaveBeenCalledWith(el, expect.objectContaining({
      canvasWidth: 1080,
      canvasHeight: 1080
    }))
  })

  it('triggers a download link click', async () => {
    const el = document.createElement('div')
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await exportAdElement(el, 1080, 1080, 'my-ad')

    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })
})

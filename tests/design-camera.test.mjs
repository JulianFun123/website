import test from 'node:test'
import assert from 'node:assert/strict'
import {
  zoomDesignAt,
  pinchDesignAt,
  fitDesignElements,
  MIN_DESIGN_ZOOM,
  MAX_DESIGN_ZOOM,
} from '../app/utils/designCamera.ts'

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`)

test('zoom keeps the world point under the cursor fixed', () => {
  const camera = { x: 10, y: 20, scale: 0.5 }
  const point = { x: 100, y: 80 }
  const result = zoomDesignAt(camera, point, 1.4)
  close((point.x - result.x) / result.scale, (point.x - camera.x) / camera.scale)
  close((point.y - result.y) / result.scale, (point.y - camera.y) / camera.scale)
})

test('zoom is clamped to usable limits', () => {
  const camera = { x: 0, y: 0, scale: 1 }
  assert.equal(zoomDesignAt(camera, { x: 100, y: 100 }, 0.001).scale, MIN_DESIGN_ZOOM)
  assert.equal(zoomDesignAt(camera, { x: 100, y: 100 }, 900).scale, MAX_DESIGN_ZOOM)
})

test('fit centers distant elements and leaves the requested padding', () => {
  const camera = fitDesignElements(
    [{ x: 1000, y: -500, width: 1000, height: 500 }],
    { width: 600, height: 400 },
    50,
  )
  close(camera.scale, 0.5)
  close(1000 * camera.scale + camera.x, 50)
  close(2000 * camera.scale + camera.x, 550)
  close(-250 * camera.scale + camera.y, 200)
})

test('fit accounts for rotated element bounds', () => {
  const camera = fitDesignElements(
    [{ x: 0, y: 0, width: 300, height: 100, rotation: 90 }],
    { width: 300, height: 300 },
    50,
  )
  close(camera.scale, 2 / 3)
  close(150 * camera.scale + camera.x, 150)
  close(50 * camera.scale + camera.y, 150)
})

test('empty or unmeasured canvases have a safe initial camera', () => {
  assert.deepEqual(fitDesignElements([], { width: 600, height: 400 }), { x: 0, y: 0, scale: 1 })
  assert.deepEqual(
    fitDesignElements([{ x: 0, y: 0, width: 10, height: 10 }], { width: 0, height: 0 }),
    { x: 0, y: 0, scale: 1 },
  )
})

test('mobile fit can show a large canvas without changing the desktop zoom limit', () => {
  const elements = [{ x: 0, y: 0, width: 5000, height: 2000 }]
  const viewport = { width: 340, height: 500 }
  assert.equal(fitDesignElements(elements, viewport, 20).scale, MIN_DESIGN_ZOOM)
  const mobile = fitDesignElements(elements, viewport, 20, 0.03)
  close(mobile.scale, 0.06)
  close(mobile.x, 20)
})

test('pinch zoom preserves the touched canvas point while both fingers move', () => {
  const camera = { x: 10, y: 20, scale: 0.5 }
  const start = { center: { x: 100, y: 80 }, distance: 100 }
  const current = { center: { x: 130, y: 120 }, distance: 200 }
  const result = pinchDesignAt(camera, start, current)
  close(result.scale, 1)
  close((current.center.x - result.x) / result.scale, (start.center.x - camera.x) / camera.scale)
  close((current.center.y - result.y) / result.scale, (start.center.y - camera.y) / camera.scale)
})

test('pinch handles a zero initial distance and respects zoom limits', () => {
  const result = pinchDesignAt(
    { x: 0, y: 0, scale: 1 },
    { center: { x: 10, y: 10 }, distance: 0 },
    { center: { x: 10, y: 10 }, distance: 100 },
  )
  assert.equal(result.scale, MAX_DESIGN_ZOOM)
  assert.ok(Number.isFinite(result.x) && Number.isFinite(result.y))
})

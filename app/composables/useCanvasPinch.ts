import type { Ref } from 'vue'
import { pinchDesignAt, type Camera, type PinchPose } from '~/utils/designCamera'

interface CanvasPinchOptions {
  viewport: Ref<HTMLElement | undefined>
  camera: Ref<Camera>
  minimumZoom: Readonly<Ref<number>>
  onStart: () => void
  onEnd: () => void
}

export function useCanvasPinch(options: CanvasPinchOptions) {
  const points = new Map<number, { x: number; y: number }>()
  let start: { camera: Camera; pose: PinchPose } | undefined

  function position(event: PointerEvent) {
    const rect = options.viewport.value!.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function pose(): PinchPose | undefined {
    const [first, second] = [...points.values()]
    if (!first || !second) return
    return {
      center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
      distance: Math.hypot(second.x - first.x, second.y - first.y),
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'touch') return false
    if (points.size >= 2) return true
    points.set(event.pointerId, position(event))
    const current = pose()
    if (!current) return false
    start = { camera: { ...options.camera.value }, pose: current }
    options.onStart()
    for (const id of points.keys()) options.viewport.value!.setPointerCapture(id)
    return true
  }

  function onPointerMove(event: PointerEvent) {
    if (!points.has(event.pointerId)) return false
    points.set(event.pointerId, position(event))
    const current = pose()
    if (!start || !current) return false
    options.camera.value = pinchDesignAt(
      start.camera,
      start.pose,
      current,
      options.minimumZoom.value,
    )
    return true
  }

  function onPointerEnd(event: PointerEvent) {
    if (!points.has(event.pointerId)) return false
    const captured = [...points.keys()]
    points.delete(event.pointerId)
    if (!start) return false
    cancel()
    options.onEnd()
    for (const id of captured) {
      if (options.viewport.value?.hasPointerCapture(id))
        options.viewport.value.releasePointerCapture(id)
    }
    return true
  }

  function cancel() {
    points.clear()
    start = undefined
  }

  onBeforeUnmount(cancel)
  return { onPointerDown, onPointerMove, onPointerEnd, cancel }
}

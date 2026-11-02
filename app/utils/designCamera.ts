export interface Camera {
  x: number
  y: number
  scale: number
}
export interface DesignRect {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}
export const MIN_DESIGN_ZOOM = 0.15
export const MAX_DESIGN_ZOOM = 3

export function zoomDesignAt(
  camera: Camera,
  point: { x: number; y: number },
  requestedScale: number,
  minimumScale = MIN_DESIGN_ZOOM,
): Camera {
  const scale = Math.min(MAX_DESIGN_ZOOM, Math.max(minimumScale, requestedScale))
  const factor = scale / camera.scale
  return {
    x: point.x - (point.x - camera.x) * factor,
    y: point.y - (point.y - camera.y) * factor,
    scale,
  }
}

export function fitDesignElements(
  elements: DesignRect[],
  viewport: { width: number; height: number },
  padding = 50,
  minimumScale = MIN_DESIGN_ZOOM,
): Camera {
  if (!elements.length || viewport.width <= 0 || viewport.height <= 0)
    return { x: 0, y: 0, scale: 1 }
  const boxes = elements.map((element) => {
    const angle = ((element.rotation ?? 0) * Math.PI) / 180
    const width =
      Math.abs(element.width * Math.cos(angle)) + Math.abs(element.height * Math.sin(angle))
    const height =
      Math.abs(element.width * Math.sin(angle)) + Math.abs(element.height * Math.cos(angle))
    return {
      x: element.x + element.width / 2 - width / 2,
      y: element.y + element.height / 2 - height / 2,
      width,
      height,
    }
  })
  const left = Math.min(...boxes.map((b) => b.x))
  const top = Math.min(...boxes.map((b) => b.y))
  const right = Math.max(...boxes.map((b) => b.x + b.width))
  const bottom = Math.max(...boxes.map((b) => b.y + b.height))
  const scale = Math.max(
    minimumScale,
    Math.min(
      1,
      Math.max(1, viewport.width - padding * 2) / (right - left),
      Math.max(1, viewport.height - padding * 2) / (bottom - top),
    ),
  )
  return {
    x: viewport.width / 2 - ((left + right) / 2) * scale,
    y: viewport.height / 2 - ((top + bottom) / 2) * scale,
    scale,
  }
}

export interface PinchPose {
  center: { x: number; y: number }
  distance: number
}

export function pinchDesignAt(
  camera: Camera,
  start: PinchPose,
  current: PinchPose,
  minimumScale = MIN_DESIGN_ZOOM,
): Camera {
  const next = zoomDesignAt(
    camera,
    start.center,
    (camera.scale * current.distance) / Math.max(1, start.distance),
    minimumScale,
  )
  return {
    ...next,
    x: next.x + current.center.x - start.center.x,
    y: next.y + current.center.y - start.center.y,
  }
}

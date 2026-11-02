import type { DesignRect } from '~/utils/designCamera'
import { fitDesignElements, zoomDesignAt, MIN_DESIGN_ZOOM } from '~/utils/designCamera'

export function useDesignCanvas(elements: DesignRect[]) {
  const { selectedId, hoveredId } = useDesignSelection()
  const viewport = ref<HTMLElement>()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const minimumZoom = computed(() => (isMobile.value ? 0.03 : MIN_DESIGN_ZOOM))
  const size = reactive({ width: 0, height: 0 })
  const camera = ref({ x: 32, y: 32, scale: 0.5 })
  const tool = ref<'select' | 'hand'>('select')
  const spaceHeld = ref(false)
  const dragging = ref(false)
  const initialized = ref(false)
  const isHand = computed(() => tool.value === 'hand' || spaceHeld.value)
  let observer: ResizeObserver | undefined
  let gesture:
    { id: number; x: number; y: number; startX: number; startY: number; moved: boolean } | undefined
  let suppressClick = false
  let refitOnResize = false
  watch(isMobile, () => {
    refitOnResize = true
  })

  const pinch = useCanvasPinch({
    viewport,
    camera,
    minimumZoom,
    onStart: () => {
      gesture = undefined
      dragging.value = true
      suppressClick = true
      hoveredId.value = null
    },
    onEnd: () => {
      gesture = undefined
      dragging.value = false
      suppressClick = true
    },
  })

  function fit() {
    camera.value = fitDesignElements(elements, size, size.width < 500 ? 28 : 50, minimumZoom.value)
  }
  function zoomBy(factor: number) {
    camera.value = zoomDesignAt(
      camera.value,
      { x: size.width / 2, y: size.height / 2 },
      camera.value.scale * factor,
      minimumZoom.value,
    )
  }
  function onWheel(event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      const rect = viewport.value!.getBoundingClientRect()
      camera.value = zoomDesignAt(
        camera.value,
        { x: event.clientX - rect.left, y: event.clientY - rect.top },
        camera.value.scale * Math.exp(-event.deltaY * 0.008),
        minimumZoom.value,
      )
    } else {
      camera.value = {
        ...camera.value,
        x: camera.value.x - event.deltaX,
        y: camera.value.y - event.deltaY,
      }
    }
  }
  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0 && event.button !== 1) return
    suppressClick = false
    if (pinch.onPointerDown(event)) {
      event.preventDefault()
      return
    }
    const fromElement = (event.target as HTMLElement).closest('[data-design-element]')
    if (fromElement && !isHand.value && event.button === 0) return
    event.preventDefault()
    viewport.value!.focus({ preventScroll: true })
    viewport.value!.setPointerCapture(event.pointerId)
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: camera.value.x,
      startY: camera.value.y,
      moved: false,
    }
  }
  function onPointerMove(event: PointerEvent) {
    if (pinch.onPointerMove(event)) return
    if (!gesture || gesture.id !== event.pointerId) return
    const dx = event.clientX - gesture.x
    const dy = event.clientY - gesture.y
    if (Math.hypot(dx, dy) > 3) {
      gesture.moved = true
      dragging.value = true
      hoveredId.value = null
    }
    if (gesture.moved)
      camera.value = { ...camera.value, x: gesture.startX + dx, y: gesture.startY + dy }
  }
  function endGesture(event: PointerEvent) {
    if (pinch.onPointerEnd(event)) return
    if (!gesture || gesture.id !== event.pointerId) return
    suppressClick = gesture.moved
    if (!gesture.moved && tool.value === 'select' && !spaceHeld.value) {
      selectedId.value = null
      hoveredId.value = null
    }
    gesture = undefined
    dragging.value = false
    if (viewport.value?.hasPointerCapture(event.pointerId))
      viewport.value.releasePointerCapture(event.pointerId)
  }
  function selectElement(id: string) {
    if (suppressClick || isHand.value) return
    selectedId.value = id
    hoveredId.value = null
  }
  function previewElement(id: string) {
    if (!dragging.value && !isHand.value) hoveredId.value = id
  }
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      selectedId.value = null
      hoveredId.value = null
      viewport.value?.focus({ preventScroll: true })
      return
    }
    if (event.target !== event.currentTarget) return
    if (event.key === ' ') {
      event.preventDefault()
      spaceHeld.value = true
    } else if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      zoomBy(1.2)
    } else if (event.key === '-') {
      event.preventDefault()
      zoomBy(1 / 1.2)
    } else if (event.key === '0') {
      event.preventDefault()
      fit()
    } else if (event.key.toLowerCase() === 'h') tool.value = 'hand'
    else if (event.key.toLowerCase() === 'v') tool.value = 'select'
    else if (event.key.startsWith('Arrow')) {
      event.preventDefault()
      const delta = event.shiftKey ? 80 : 25
      camera.value = {
        ...camera.value,
        x:
          camera.value.x +
          (event.key === 'ArrowLeft' ? delta : event.key === 'ArrowRight' ? -delta : 0),
        y:
          camera.value.y +
          (event.key === 'ArrowUp' ? delta : event.key === 'ArrowDown' ? -delta : 0),
      }
    }
  }

  function resetZoom() {
    camera.value = zoomDesignAt(camera.value, { x: size.width / 2, y: size.height / 2 }, 1)
  }
  function cancelGesture() {
    pinch.cancel()
    gesture = undefined
    dragging.value = false
  }
  function onLostPointerCapture(event: PointerEvent) {
    if (!viewport.value?.hasPointerCapture(event.pointerId)) cancelGesture()
  }
  function clearPreview() {
    hoveredId.value = null
  }
  function onKeyUp(event: KeyboardEvent) {
    if (event.key === ' ') spaceHeld.value = false
  }
  function onBlur() {
    spaceHeld.value = false
  }

  onMounted(() => {
    observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const previous = { ...size }
      size.width = entry.contentRect.width
      size.height = entry.contentRect.height
      if (
        !initialized.value ||
        refitOnResize ||
        (isMobile.value && previous.width !== size.width)
      ) {
        fit()
        initialized.value = true
        refitOnResize = false
      } else {
        camera.value = {
          ...camera.value,
          x: camera.value.x + (size.width - previous.width) / 2,
          y: camera.value.y + (size.height - previous.height) / 2,
        }
      }
    })
    if (viewport.value) observer.observe(viewport.value)
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    hoveredId.value = null
  })
  return {
    viewport,
    minimumZoom,
    camera,
    tool,
    dragging,
    initialized,
    isHand,
    fit,
    zoomBy,
    resetZoom,
    onWheel,
    onPointerDown,
    onPointerMove,
    endGesture,
    selectElement,
    previewElement,
    clearPreview,
    onLostPointerCapture,
    onKeyDown,
    onKeyUp,
    onBlur,
  }
}

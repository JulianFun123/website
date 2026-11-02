import { useSpring, useReducedMotion } from 'motion-v'
import type { Polaroid } from '~/data/photography'

export type PolaroidMagnet = { x: ReturnType<typeof useSpring>; y: ReturnType<typeof useSpring> }

export function useMagneticPolaroids(polaroids: Polaroid[]) {
  const reduceMotion = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const container = ref<HTMLElement | null>(null)
  const activeIndex = ref<number | null>(null)
  const draggingIndex = ref<number | null>(null)

  const springConfig = {
    stiffness: 180,
    damping: 18,
    mass: 0.8,
  }

  const magnets = polaroids.map(() => ({
    x: useSpring(0, springConfig),
    y: useSpring(0, springConfig),
  }))

  const MAGNET_RADIUS = 200
  const MAGNET_STRENGTH = 0.55

  function handleMouseMove(event: PointerEvent) {
    if (!container.value || reduceMotion.value || isMobile.value) return
    if (
      event.target instanceof Element &&
      event.target.closest('.peeking-friends, .wandering-friend, .adventure-dialog')
    )
      return

    const bounds = container.value.getBoundingClientRect()

    const mouseX = event.clientX - bounds.left
    const mouseY = event.clientY - bounds.top

    polaroids.forEach((img, i) => {
      const magnet = magnets[i]
      if (!magnet || draggingIndex.value === i) return

      const centerX = (img.x / 100) * bounds.width
      const centerY = (img.y / 100) * bounds.height

      const dx = mouseX - centerX
      const dy = mouseY - centerY

      const distance = Math.hypot(dx, dy)

      if (distance < MAGNET_RADIUS) {
        const strength = Math.pow(1 - distance / MAGNET_RADIUS, 2)

        magnet.x.set(dx * strength * MAGNET_STRENGTH)
        magnet.y.set(dy * strength * MAGNET_STRENGTH)
      } else {
        magnet.x.set(0)
        magnet.y.set(0)
      }
    })
  }

  function resetMagnets() {
    magnets.forEach((magnet) => {
      magnet.x.set(0)
      magnet.y.set(0)
    })
  }

  function handleDragStart(i: number) {
    const magnet = magnets[i]
    if (!magnet) return

    draggingIndex.value = i
    activeIndex.value = i

    magnet.x.set(0)
    magnet.y.set(0)
  }

  function handleDragEnd() {
    draggingIndex.value = null
  }

  function handlePointerDown(i: number) {
    activeIndex.value = i
  }

  useEventListener('pointermove', handleMouseMove)
  watch(isMobile, (mobile) => {
    if (mobile) resetMagnets()
  })

  return {
    container,
    isMobile,
    activeIndex,
    magnets,
    resetMagnets,
    handleDragStart,
    handleDragEnd,
    handlePointerDown,
    reduceMotion,
  }
}

import type { Polaroid } from '~/data/photography'

export function useWanderingPhotoFriend(
  enabled: Readonly<Ref<boolean>>,
  reduceMotion: Readonly<Ref<boolean | null>>,
  photos: Polaroid[],
) {
  const stops = [0, 3, 4, 3]
  const stop = ref(0)
  const hopping = ref(false)
  const held = ref(false)
  const visible = ref(false)
  const visibility = useDocumentVisibility()
  let timer: ReturnType<typeof setTimeout> | undefined
  let mounted = false
  let firstVisit = true
  let hops = 0
  const position = computed(() => {
    const photo = photos[stops[stop.value] ?? 0] ?? photos[0]!
    return { left: `${photo.x}%`, top: `${photo.y - 28}%` }
  })

  function later(callback: () => void, duration: number) {
    clearTimeout(timer)
    timer = setTimeout(callback, duration)
  }

  function schedule() {
    clearTimeout(timer)
    hopping.value = false
    if (!mounted || !enabled.value || visibility.value !== 'visible') {
      visible.value = false
      return
    }
    if (reduceMotion.value) {
      visible.value = true
      return
    }
    if (held.value) return
    if (!visible.value) {
      later(
        () => {
          visible.value = true
          firstVisit = false
          hops = 0
          schedule()
        },
        firstVisit ? 2600 : 13000 + Math.random() * 13000,
      )
      return
    }
    later(
      () => {
        if (hops >= 2 || (hops > 0 && Math.random() < 0.4)) {
          visible.value = false
          schedule()
          return
        }
        hopping.value = true
        stop.value = (stop.value + 1) % stops.length
        hops++
        later(() => {
          hopping.value = false
          schedule()
        }, 1200)
      },
      3500 + Math.random() * 4000,
    )
  }

  onMounted(() => {
    mounted = true
    schedule()
  })
  watch([enabled, reduceMotion, held, visibility], schedule)
  onBeforeUnmount(() => clearTimeout(timer))
  return { position, hopping, held, visible }
}

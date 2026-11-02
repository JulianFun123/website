type PeekScene = 'hidden' | 'peek' | 'meet' | 'wave'

export function usePeekingFriends(enabled: Readonly<Ref<boolean>>, delay: number) {
  const scene = ref<PeekScene>('hidden')
  const interactive = ref(false)
  const visibility = useDocumentVisibility()
  let timer: ReturnType<typeof setTimeout> | undefined
  let mounted = false

  function later(callback: () => void, duration: number) {
    clearTimeout(timer)
    timer = setTimeout(callback, duration)
  }

  function rest() {
    interactive.value = false
    scene.value = 'hidden'
    later(visit, 13000 + Math.random() * 11000)
  }

  function visit() {
    scene.value = 'peek'
    later(() => {
      interactive.value = true
      later(() => {
        scene.value = 'meet'
        later(() => {
          scene.value = 'wave'
          later(rest, 2300)
        }, 1500)
      }, 1000)
    }, 900)
  }

  function greet() {
    if (!enabled.value || visibility.value !== 'visible') return
    scene.value = 'wave'
    later(rest, 2800)
  }

  function reset() {
    clearTimeout(timer)
    interactive.value = false
    scene.value = 'hidden'
    if (mounted && enabled.value && visibility.value === 'visible') later(visit, delay)
  }

  onMounted(() => {
    mounted = true
    reset()
  })
  watch([enabled, visibility], reset)
  onBeforeUnmount(() => clearTimeout(timer))

  return { scene, interactive, greet }
}

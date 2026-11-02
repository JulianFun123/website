import { loadYouTubeApi, disableYouTubeCaptions, type YouTubePlayer } from '~/utils/youtubeApi'
import { getYouTubeEmbedUrl } from '~/utils/youtube'
import type { PlayerRole } from '~/utils/juflixSync'

export function useJuflixPlayer(
  props: { readonly videoId: string; readonly role: PlayerRole },
  onPlaying: () => void,
) {
  const frame = ref<HTMLIFrameElement>()
  const container = ref<HTMLElement>()
  const revealed = ref(false)
  const ambientScale = ref(1)
  const origin = useRequestURL().origin
  const nuxtApp = useNuxtApp()
  const src = computed(() =>
    getYouTubeEmbedUrl(props.videoId, { autoplay: props.role === 'primary', origin }),
  )

  let player: YouTubePlayer | undefined
  let detach: (() => void) | undefined
  let disposed = false
  let resizeObserver: ResizeObserver | undefined

  function revealWhenPlaying(target: YouTubePlayer) {
    if (!disposed && !revealed.value && target.getPlayerState() === 1) {
      revealed.value = true
      onPlaying()
    }
  }

  onMounted(async () => {
    if (props.role === 'ambient' && container.value) {
      resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry) return
        ambientScale.value = Math.max(entry.contentRect.width / 384, entry.contentRect.height / 216)
      })
      resizeObserver.observe(container.value)
    }
    try {
      const api = await loadYouTubeApi()
      if (disposed || !frame.value) return
      player = new api.Player(frame.value, {
        events: {
          onReady: ({ target }) => {
            if (disposed) return
            disableYouTubeCaptions(target)
            detach = nuxtApp.$juflixSync.attach(props.role, target, props.videoId)
            revealWhenPlaying(target)
          },
          onStateChange: ({ target, data }) => {
            if (disposed) return
            nuxtApp.$juflixSync.onStateChange(target)
            if (data === 1) {
              disableYouTubeCaptions(target)
              revealWhenPlaying(target)
            }
          },
          onApiChange: ({ target }) => {
            if (!disposed) disableYouTubeCaptions(target)
          },
        },
      })
    } catch {
      // Keep the thumbnail and external YouTube link if the API is blocked.
    }
  })

  onBeforeUnmount(() => {
    disposed = true
    resizeObserver?.disconnect()
    detach?.()
    player?.destroy()
  })
  return { frame, container, revealed, ambientScale, src }
}

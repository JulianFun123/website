import { videos } from '~/data/videos'
import { getYouTubeWatchUrl } from '~/utils/youtube'

export function useJuflixVideo() {
  // Shared by the foreground player and the ambient layer, including during SSR.
  const selectedId = useState('juflix-selected-video', () => videos[0]!.id)
  const selectedVideo = computed(
    () => videos.find((video) => video.id === selectedId.value) ?? videos[0]!,
  )
  const watchUrl = computed(() => getYouTubeWatchUrl(selectedVideo.value.id))

  return { selectedId, selectedVideo, watchUrl }
}

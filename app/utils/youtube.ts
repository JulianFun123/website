export function getYouTubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function getYouTubeThumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export function getYouTubeEmbedUrl(
  videoId: string,
  options: { autoplay: boolean; origin: string },
) {
  const params = new URLSearchParams({
    autoplay: options.autoplay ? '1' : '0',
    mute: '1',
    controls: '0',
    playsinline: '1',
    disablekb: '1',
    rel: '0',
    enablejsapi: '1',
    cc_load_policy: '0',
    origin: options.origin,
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`
}

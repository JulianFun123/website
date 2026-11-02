import type { GalleryResponse } from '~~/shared/types/photos'

export async function usePhotoGallery() {
  const request = useFetch<GalleryResponse>('/api/photos')
  const { data, error, status, refresh } = request
  const photos = computed(() => data.value?.photos ?? [])
  const loadingMore = ref(false)
  const loadMoreError = ref(false)

  async function loadMore() {
    if (loadingMore.value || !data.value?.hasMore) return
    loadingMore.value = true
    loadMoreError.value = false
    try {
      const next = await $fetch<GalleryResponse>('/api/photos', {
        query: { page: data.value.page + 1 },
      })
      const existing = new Set(photos.value.map((photo) => photo.id))
      data.value = {
        ...next,
        photos: [...photos.value, ...next.photos.filter((photo) => !existing.has(photo.id))],
      }
    } catch {
      loadMoreError.value = true
    } finally {
      loadingMore.value = false
    }
  }

  await request
  return { data, error, status, refresh, photos, loadingMore, loadMoreError, loadMore }
}

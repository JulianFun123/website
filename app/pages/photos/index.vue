<script setup lang="ts">
import PhotoGrid from '~/components/photography/PhotoGrid.vue'

definePageMeta({ layout: false, leftPanel: 'photography' })
useSeoMeta({ title: 'Photography · Julian Gojani', description: 'Fotografien von Julian Gojani.' })

const { data, error, status, refresh, photos, loadingMore, loadMoreError, loadMore } =
  await usePhotoGallery()
</script>

<template>
  <section class="photo-page p-4 md:p-6 pt-0 md:pt-0" aria-label="Photography">
    <div v-if="status === 'pending'" role="status" class="py-12 text-center text-black/60">
      Loading
    </div>
    <div v-else-if="error" role="alert" class="rounded-2xl bg-gray-50 p-6 text-center">
      <p>Die Fotos sind gerade nicht verfügbar. Bitte versuche es später erneut.</p>
      <button class="mt-4 rounded-full border px-5 py-2 hover:bg-white" @click="refresh()">
        Erneut versuchen
      </button>
    </div>
    <p v-else-if="!photos.length" class="py-12 text-center text-black/60">
      Noch keine Fotos vorhanden.
    </p>

    <PhotoGrid v-else :photos="photos" :loading="loadingMore" />

    <div v-if="data?.hasMore" class="mt-6 text-center">
      <p v-if="loadMoreError" role="alert" class="mb-3 text-sm">
        Weitere Fotos konnten nicht geladen werden. Versuche es erneut.
      </p>
      <button
        :disabled="loadingMore"
        class="rounded-full border border-gray-200 px-6 py-3 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-50"
        @click="loadMore"
      >
        {{ loadingMore ? 'Wird geladen …' : 'Mehr Fotos laden' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
@media (max-width: 767px) {
  .photo-page {
    padding: 0 12px 16px;
  }
  .photo-page button {
    min-height: 44px;
  }
}
</style>

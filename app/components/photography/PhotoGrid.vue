<script setup lang="ts">
import type { GalleryPhoto } from '~~/shared/types/photos'

defineProps<{ photos: GalleryPhoto[]; loading: boolean }>()
</script>

<template>
  <div class="gallery" :aria-busy="loading">
    <figure v-for="(photo, index) in photos" :key="photo.id" class="mb-4 break-inside-avoid">
      <a
        :href="photo.href"
        target="_blank"
        rel="noopener noreferrer"
        class="group block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <img
          :src="photo.src"
          :srcset="photo.srcset"
          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, (min-width: 360px) calc((100vw - 58px) / 2), calc(100vw - 50px)"
          :width="photo.width"
          :height="photo.height"
          :alt="photo.alt"
          :loading="index < 2 ? 'eager' : 'lazy'"
          decoding="async"
          :style="{ backgroundColor: photo.color ?? '#f3f4f6' }"
          class="block h-auto w-full transition-opacity group-hover:opacity-90"
        />
      </a>
    </figure>
  </div>
</template>

<style scoped>
.gallery {
  columns: 16rem;
  column-gap: 1rem;
}
@media (min-width: 360px) and (max-width: 767px) {
  .gallery {
    column-count: 2;
    column-width: auto;
    column-gap: 8px;
  }
  .gallery figure {
    margin-bottom: 8px;
  }
}
</style>

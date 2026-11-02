<script setup lang="ts">
import { videos } from '~/data/videos'
import VideoPreview from '~/components/video/VideoPreview.vue'
import VideoFilmstrip from '~/components/video/VideoFilmstrip.vue'
import PocketCompanion from '~/components/site/PocketCompanion.vue'

definePageMeta({ layout: false, leftPanel: 'video' })
useSeoMeta({ title: 'Juflix · Julian Gojani', description: 'Videography von Julian Gojani.' })
const { selectedId, selectedVideo } = useJuflixVideo()
</script>

<template>
  <section aria-label="Juflix Videoplayer">
    <VideoPreview :key="selectedVideo.id" :video="selectedVideo" />
    <VideoFilmstrip :videos="videos" :selected="selectedId" @select="selectedId = $event" />
    <footer class="cinema-signoff"><PocketCompanion kind="ticket" /></footer>
  </section>
</template>

<style scoped>
.cinema-signoff {
  display: flex;
  justify-content: flex-end;
  padding: 0 24px 20px;
}
@media (max-width: 767px) {
  .cinema-signoff {
    padding: 0 16px 12px;
  }
}
</style>

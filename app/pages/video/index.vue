<script setup lang="ts">
import { videos } from '~/data/videos'
import VideoPreview from '~/components/video/VideoPreview.vue'
import VideoFilmstrip from '~/components/video/VideoFilmstrip.vue'

definePageMeta({ layout: false, leftPanel: 'video' })
useSeoMeta({ title: 'Juflix · Julian Gojani', description: 'Videography von Julian Gojani.' })
const { selectedId, selectedVideo } = useJuflixVideo()
</script>

<template>
  <section aria-label="Juflix Videoplayer">
    <VideoPreview :key="selectedVideo.id" :video="selectedVideo" />
    <VideoFilmstrip :videos="videos" :selected="selectedId" @select="selectedId = $event" />
  </section>
</template>

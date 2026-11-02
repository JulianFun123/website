<script setup lang="ts">
import type { PortfolioVideo } from '~/data/videos'
import { getYouTubeWatchUrl } from '~/utils/youtube'

defineProps<{ video: PortfolioVideo }>()
const showIntro = ref(true)
const playerReady = ref(false)
</script>

<template>
  <div class="video-preview group relative aspect-[21/9] w-full overflow-hidden bg-black">
    <JuflixPlayer
      :video-id="video.id"
      role="primary"
      @playing="playerReady = true"
      :title="`${video.title} – stumme Vorschau`"
      class="pointer-events-none absolute inset-0 block size-full border-0"
    />
    <a
      :href="getYouTubeWatchUrl(video.id)"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="`${video.title} auf YouTube ansehen (öffnet einen neuen Tab)`"
      class="video-overlay absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
    >
      <span
        class="flex size-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition-transform duration-300 group-hover:scale-110"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" class="ml-1 size-7" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span class="text-sm font-medium text-white">Auf YouTube ansehen ↗</span>
    </a>
    <Transition name="intro-overlay">
      <JuflixIntro v-if="showIntro" :ready="playerReady" @complete="showIntro = false" />
    </Transition>
  </div>
</template>

<style scoped>
.intro-overlay-leave-active {
  transition: opacity 350ms ease;
}
.intro-overlay-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .intro-overlay-leave-active {
    transition: none;
  }
}

@media (hover: none) {
  .video-overlay {
    opacity: 1;
    background-color: rgb(0 0 0 / 0.15);
  }
}
@media (prefers-reduced-motion: reduce) {
  .video-overlay,
  .video-overlay span {
    transition: none;
  }
}
@media (max-width: 767px) {
  .video-preview {
    aspect-ratio: 16 / 9;
    min-height: 200px;
  }
  .video-overlay {
    opacity: 1;
    gap: 10px;
    background-color: rgb(0 0 0 / 0.15);
  }
  .video-overlay > span:first-child {
    width: 48px;
    height: 48px;
  }
  .video-overlay > span:last-child {
    font-size: 12px;
  }
}
</style>

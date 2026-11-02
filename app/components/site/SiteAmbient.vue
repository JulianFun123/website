<script setup lang="ts">
import { useReducedMotion } from 'motion-v'

defineProps<{ active: boolean }>()
const reduceMotion = useReducedMotion()
const { selectedVideo } = useJuflixVideo()
</script>

<template>
  <Transition name="ambient">
    <div v-if="active && !reduceMotion" class="cinema-ambient" aria-hidden="true" inert>
      <JuflixPlayer
        :key="selectedVideo.id"
        :video-id="selectedVideo.id"
        role="ambient"
        class="ambient-player"
        title="Dekorativer Juflix-Ambient-Hintergrund"
      />
    </div>
  </Transition>
</template>

<style scoped>
.cinema-ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.cinema-ambient .ambient-player {
  position: absolute;
  top: 50%;
  left: 50%;
  width: max(100vw, 177.78vh);
  height: max(100vh, 56.25vw);
  border: 0;
  transform: translate(-50%, -50%) scale(1.15);
  filter: blur(70px) saturate(1.65);
  opacity: 0.6;
}

.cinema-ambient::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(rgb(8 9 11 / 0.3), rgb(8 9 11 / 0.7));
}

.ambient-enter-active,
.ambient-leave-active {
  transition: opacity 600ms ease;
}
.ambient-enter-from,
.ambient-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .ambient-enter-active,
  .ambient-leave-active {
    transition: none;
  }
}
@media (max-width: 767px) {
  .cinema-ambient .ambient-player {
    width: 120%;
    height: 120%;
    filter: blur(40px) saturate(1.4);
    opacity: 0.45;
  }
}
</style>

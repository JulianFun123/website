<script setup lang="ts">
import type { PlayerRole } from '~/utils/juflixSync'
import { getYouTubeThumbnailUrl } from '~/utils/youtube'

const props = defineProps<{ videoId: string; role: PlayerRole; title: string }>()
const emit = defineEmits<{ playing: [] }>()
const { frame, container, revealed, ambientScale, src } = useJuflixPlayer(props, () =>
  emit('playing'),
)
</script>

<template>
  <div ref="container" :data-player-role="role" :data-revealed="revealed">
    <img
      v-if="role === 'primary'"
      :src="getYouTubeThumbnailUrl(videoId)"
      alt=""
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full object-cover"
    />
    <iframe
      ref="frame"
      :src="src"
      :title="title"
      class="player-frame block border-0"
      :class="[role === 'ambient' ? 'ambient-frame' : 'primary-frame', { 'is-revealed': revealed }]"
      :style="
        role === 'ambient'
          ? { transform: `translate(-50%, -50%) scale(${ambientScale})` }
          : undefined
      "
      tabindex="-1"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      referrerpolicy="strict-origin-when-cross-origin"
    />
  </div>
</template>

<style scoped>
.player-frame {
  opacity: 0;
  transition: opacity 150ms ease;
}

.player-frame.is-revealed {
  opacity: 1;
}

.primary-frame {
  position: relative;
  width: 100%;
  height: 100%;
}

.ambient-frame {
  position: absolute;
  top: 50%;
  left: 50%;
  /* A small intrinsic viewport hints at a lower automatic quality. YouTube
     no longer honors setPlaybackQuality or suggestedQuality. */
  width: 384px;
  height: 216px;
}

@media (prefers-reduced-motion: reduce) {
  .player-frame {
    transition: none;
  }
}
</style>

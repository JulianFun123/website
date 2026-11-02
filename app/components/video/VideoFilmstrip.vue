<script setup lang="ts">
import type { PortfolioVideo } from '~/data/videos'
import { getYouTubeThumbnailUrl } from '~/utils/youtube'

defineProps<{ videos: PortfolioVideo[]; selected: string }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="filmstrip-section p-4 md:p-6">
    <div
      class="filmstrip max-h-80 overflow-y-auto overscroll-contain rounded-xl border border-white/10 bg-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
      role="region"
      aria-label="Video selection"
      tabindex="0"
    >
      <div class="filmstrip-reel relative px-7 py-4 md:px-9">
        <ul class="space-y-4">
          <li v-for="(video, index) in videos" :key="video.id">
            <button
              type="button"
              :aria-pressed="selected === video.id"
              :aria-label="`${video.title} als Vorschau abspielen`"
              class="film-frame group/frame flex w-full flex-col gap-3 rounded-lg border p-2 text-left transition-colors sm:flex-row sm:items-center sm:gap-5"
              :class="
                selected === video.id
                  ? 'border-red-500/70 bg-red-500/10'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/5'
              "
              @click="emit('select', video.id)"
            >
              <span
                class="film-thumbnail relative block aspect-video w-full shrink-0 overflow-hidden rounded bg-black sm:w-48 md:w-56"
              >
                <img
                  :src="getYouTubeThumbnailUrl(video.id)"
                  :alt="`Thumbnail: ${video.title}`"
                  width="480"
                  height="360"
                  loading="lazy"
                  class="absolute inset-0 size-full object-cover"
                />
                <span
                  class="film-status absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white"
                >
                  {{ selected === video.id ? 'Aktuelle Vorschau' : 'Vorschau abspielen' }}
                </span>
              </span>
              <span class="film-meta min-w-0 px-1 py-2">
                <span class="mb-2 block text-[10px] tabular-nums tracking-widest text-white/35">{{
                  String(index + 1).padStart(2, '0')
                }}</span>
                <span class="block text-base font-medium text-white">{{ video.title }}</span>
                <span class="mt-1 block text-sm text-white/45">{{ video.category }}</span>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filmstrip {
  scrollbar-width: thin;
  scrollbar-color: #52525b transparent;
  scrollbar-gutter: stable;
}

.filmstrip-reel::before,
.filmstrip-reel::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8px;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0 8px,
    #33343b 8px 20px,
    transparent 20px 28px
  );
}

.filmstrip-reel::before {
  left: 9px;
}
.filmstrip-reel::after {
  right: 9px;
}

.film-frame:focus-visible {
  outline: 2px solid #ef4444;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .film-frame {
    transition: none;
  }
}
@media (max-width: 767px) {
  .filmstrip-section {
    padding: 12px;
  }
  .filmstrip {
    max-height: min(44dvh, 380px);
  }
  .filmstrip-reel {
    padding: 12px 18px;
  }
  .filmstrip-reel::before,
  .filmstrip-reel::after {
    width: 5px;
  }
  .filmstrip-reel::before {
    left: 6px;
  }
  .filmstrip-reel::after {
    right: 6px;
  }
  .film-frame {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    min-height: 80px;
  }
  .film-thumbnail {
    width: clamp(88px, 26vw, 112px);
  }
  .film-status {
    display: none;
  }
  .film-meta {
    padding: 3px 0;
  }
  .film-meta > span:first-child {
    margin-bottom: 4px;
    font-size: 9px;
  }
  .film-meta > span:nth-child(2) {
    font-size: 13px;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .film-meta > span:last-child {
    font-size: 10px;
    line-height: 1.4;
  }
}
</style>

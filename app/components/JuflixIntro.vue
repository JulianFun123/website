<script setup lang="ts">
import { useReducedMotion } from 'motion-v'

const props = defineProps<{ ready: boolean }>()
const emit = defineEmits<{ complete: [] }>()
const reduceMotion = useReducedMotion()
const clipId = `juflix-j-${useId()}`
const animationDone = ref(false)
let animationTimer: ReturnType<typeof setTimeout> | undefined
let fallbackTimer: ReturnType<typeof setTimeout> | undefined
let completed = false

function complete() {
  if (completed) return
  completed = true
  emit('complete')
}

watch(
  () => animationDone.value && props.ready,
  (done) => {
    if (done) complete()
  },
)

onMounted(() => {
  animationTimer = setTimeout(
    () => {
      animationDone.value = true
    },
    reduceMotion.value ? 150 : 2800,
  )
  // Autoplay or network failures must never leave the page behind an overlay.
  fallbackTimer = setTimeout(complete, 5500)
})

onBeforeUnmount(() => {
  clearTimeout(animationTimer)
  clearTimeout(fallbackTimer)
})

const colors = [
  '#e30914',
  '#ff2738',
  '#ff5731',
  '#ffb54f',
  '#ef4caa',
  '#9a5bff',
  '#426aff',
  '#53c6ff',
]
</script>

<template>
  <div class="juflix-intro" :class="{ 'intro-finished': animationDone }" aria-hidden="true" inert>
    <div class="intro-glow" />
    <img class="intro-wordmark" src="/images/design/juflix.svg" alt="" aria-hidden="true" />
    <svg class="intro-monogram" viewBox="0 0 11 28" fill="none" aria-hidden="true">
      <defs>
        <clipPath :id="clipId">
          <path
            d="M2.45309 27.0752C1.49067 27.157 0.67327 27.1785 0 27.1345C0 25.8424 0 24.5502 0 23.2581C0.515959 23.3339 1.0963 23.3538 1.74135 23.3198C2.80563 23.2636 3.59687 23.0215 4.11571 22.5974C4.6346 22.1477 4.89729 21.5027 4.90197 20.6517C4.93848 13.9294 4.94771 7.04551 4.9297 0C6.71937 0 8.509 0 10.2987 0C10.3339 7.1085 10.3161 13.9032 10.2454 20.3842C10.2224 22.4705 9.55302 24.0141 8.25241 25.1051C6.98333 26.1901 5.05104 26.8519 2.45309 27.0752Z"
          />
        </clipPath>
      </defs>
      <g :clip-path="`url(#${clipId})`">
        <path
          d="M2.45309 27.0752C1.49067 27.157 0.67327 27.1785 0 27.1345C0 25.8424 0 24.5502 0 23.2581C0.515959 23.3339 1.0963 23.3538 1.74135 23.3198C2.80563 23.2636 3.59687 23.0215 4.11571 22.5974C4.6346 22.1477 4.89729 21.5027 4.90197 20.6517C4.93848 13.9294 4.94771 7.04551 4.9297 0C6.71937 0 8.509 0 10.2987 0C10.3339 7.1085 10.3161 13.9032 10.2454 20.3842C10.2224 22.4705 9.55302 24.0141 8.25241 25.1051C6.98333 26.1901 5.05104 26.8519 2.45309 27.0752Z"
          fill="#e30914"
        />
        <g class="monogram-ribbons">
          <rect
            v-for="i in 12"
            :key="i"
            :x="(i - 1) * 0.95"
            y="0"
            width="0.55"
            height="28"
            :fill="i % 3 === 0 ? '#ff6748' : '#97000a'"
          />
        </g>
        <rect class="monogram-sheen" x="-4" y="0" width="2" height="28" fill="#ffb2a0" />
      </g>
    </svg>
    <div class="intro-beams">
      <span
        v-for="i in 36"
        :key="i"
        :style="{
          '--beam-position': `${((i - 1) / 35) * 100}%`,
          '--beam-delay': `${1.35 + ((i * 7) % 9) * 0.025}s`,
          '--beam-width': `${1 + (i % 4) * 0.45}%`,
          '--beam-color': colors[(i * 3) % colors.length],
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.juflix-intro {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #000;
  perspective: 800px;
  pointer-events: none;
}

.intro-wordmark {
  position: absolute;
  width: min(65%, 30rem);
  height: auto;
  animation: wordmark 1100ms ease both;
}

.intro-monogram {
  position: absolute;
  height: 52%;
  width: auto;
  filter: drop-shadow(0 0 12px rgb(227 9 20 / 0.25));
  animation: monogram 2300ms cubic-bezier(0.65, 0, 0.35, 1) 450ms both;
}

.monogram-ribbons {
  animation: ribbons 1400ms ease 700ms both;
}
.monogram-sheen {
  animation: sheen 950ms ease 750ms both;
}

.intro-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgb(180 0 18 / 0.24), transparent 60%);
  animation: glow 2600ms ease both;
}

.intro-beams {
  position: absolute;
  inset: -15% -5%;
  animation: beam-zoom 1200ms cubic-bezier(0.5, 0, 0.3, 1) 1450ms both;
}

.intro-beams span {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--beam-position);
  width: var(--beam-width);
  background: linear-gradient(90deg, transparent, var(--beam-color), transparent);
  box-shadow: 0 0 16px var(--beam-color);
  animation: beam 1100ms ease var(--beam-delay) both;
}

.intro-finished .intro-glow {
  opacity: 0;
  animation: none;
}

@keyframes wordmark {
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  25%,
  55% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.04);
  }
}

@keyframes monogram {
  0%,
  10% {
    opacity: 0;
    transform: scale(0.75);
  }
  25%,
  45% {
    opacity: 1;
    transform: scale(1);
  }
  65% {
    opacity: 1;
    transform: scale(1.12);
  }
  100% {
    opacity: 0;
    transform: scale(9);
    filter: blur(10px);
  }
}

@keyframes ribbons {
  0% {
    opacity: 0;
    transform: translateY(100%);
  }
  45%,
  100% {
    opacity: 0.85;
    transform: translateY(0);
  }
}

@keyframes sheen {
  0% {
    opacity: 0;
    transform: translateX(0);
  }
  30% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateX(18px);
  }
}

@keyframes glow {
  0%,
  100% {
    opacity: 0;
  }
  40%,
  70% {
    opacity: 1;
  }
}

@keyframes beam {
  0% {
    opacity: 0;
    transform: scaleY(0.45);
  }
  25%,
  60% {
    opacity: 0.8;
    transform: scaleY(1);
  }
  100% {
    opacity: 0;
    transform: scaleY(1.2);
  }
}

@keyframes beam-zoom {
  0% {
    transform: scaleX(0.08);
    filter: blur(0);
  }
  65% {
    transform: scaleX(1);
    filter: blur(1px);
  }
  100% {
    transform: scaleX(1.7);
    filter: blur(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .juflix-intro *,
  .juflix-intro .intro-glow {
    animation: none;
  }
  .intro-monogram,
  .intro-beams,
  .intro-glow {
    display: none;
  }
  .intro-wordmark {
    opacity: 1;
  }
}
</style>

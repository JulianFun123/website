<script setup lang="ts">
type Companion = 'folder' | 'camera' | 'pencil' | 'ticket'
const props = defineProps<{ kind: Companion }>()
const greetings = {
  folder: ['Filed with care.', 'Big ideas. Tiny folder.', 'Okay, one more side project.'],
  camera: ['Chasing good light.', 'Say little cheese.', 'A good day to notice things.'],
  pencil: ['A little room to doodle.', 'Happy little accidents welcome.', 'Still a work in play.'],
  ticket: ['Saving you a seat.', 'You bring the popcorn.', 'Shh. The good bit is coming.'],
} satisfies Record<Companion, string[]>
const hello = ref(0)
const message = computed(() => greetings[props.kind][hello.value % greetings[props.kind].length])
</script>

<template>
  <div class="pocket-companion" :class="`is-${kind}`">
    <button
      type="button"
      class="companion-button"
      :aria-label="`Say hello to the little ${kind}`"
      @click="hello++"
    >
      <svg
        :key="hello"
        viewBox="0 0 100 90"
        fill="none"
        aria-hidden="true"
        :class="{ greeted: hello > 0 }"
      >
        <ellipse cx="50" cy="81" rx="24" ry="3" fill="currentColor" opacity=".06" />
        <g
          class="companion-body"
          stroke="#797160"
          stroke-width="1.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        >
          <path d="M38 69L35 78H29M62 69L65 78H71" />
          <g v-if="kind === 'folder'">
            <path
              d="M17 27Q17 22 22 22H40L48 30H78Q83 30 83 35V64Q83 69 78 69H22Q17 69 17 64Z"
              fill="#E4D39A"
            />
            <path d="M25 31L73 27L76 58L28 62Z" fill="#FFFDF6" stroke="#CFC8B4" />
            <path
              d="M15 39Q15 35 20 35H80Q85 35 85 39L82 65Q81 70 76 70H24Q19 70 18 65Z"
              fill="#F2E3B5"
            />
          </g>
          <g v-else-if="kind === 'camera'">
            <path d="M30 30L35 22H50L55 30" fill="#DDD9CD" />
            <rect x="14" y="30" width="72" height="40" rx="8" fill="#EAE7DF" />
            <path d="M20 42H80" stroke="#CEC9BD" />
            <circle cx="50" cy="51" r="15" fill="#FFFDF7" />
            <circle cx="75" cy="37" r="2" fill="#B8AD8C" stroke="none" />
            <path class="camera-spark" d="M85 18V10M90 22L97 19M79 18L75 12" stroke="#BAA369" />
          </g>
          <g v-else-if="kind === 'pencil'">
            <path d="M36 17Q36 12 41 12H59Q64 12 64 17V58L50 74L36 58Z" fill="#F2E3B5" />
            <path d="M36 23V17Q36 12 41 12H59Q64 12 64 17V23Z" fill="#E8CEC4" />
            <path d="M36 27H64M44 30V38M56 30V38" stroke="#BAAD87" />
            <path d="M36 58L50 74L64 58L57 60L50 57L43 60Z" fill="#F7EFE0" />
            <path d="M46 69L50 74L54 69" fill="#797160" />
            <path class="pencil-doodle" d="M69 74Q93 55 88 69Q82 85 93 77" stroke="#B6A77D" />
          </g>
          <g v-else>
            <path d="M18 27H82V39Q72 44 82 49V65H18V49Q28 44 18 39Z" fill="#E8DBC3" />
            <path d="M69 31V36M69 42V47M69 53V60" stroke="#BAAA8E" />
            <path d="M24 21L28 16M75 20L79 15" stroke="#A8946E" />
          </g>
          <g class="companion-eyes" stroke="#514C41" stroke-width="2.6">
            <path :d="kind === 'pencil' ? 'M44 44V46M56 44V46' : 'M42 49V51M58 49V51'" />
          </g>
          <path
            :d="kind === 'pencil' ? 'M47 52Q50 55 53 52' : 'M47 57Q50 60 53 57'"
            stroke="#514C41"
          />
          <path v-if="kind === 'folder'" d="M15 48L9 44M84 47L91 42" />
        </g>
      </svg>
    </button>
    <span class="companion-note" aria-live="polite" aria-atomic="true">{{ message }}</span>
  </div>
</template>

<style scoped>
.pocket-companion {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #756e60;
  max-width: 100%;
}
.companion-button {
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  border: 0;
  padding: 0;
  background: none;
  cursor: pointer;
  border-radius: 16px;
  -webkit-tap-highlight-color: transparent;
}
.companion-button svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.companion-button:focus-visible {
  outline: 1px dashed #aa9a76;
  outline-offset: 2px;
}
.companion-body {
  transform-origin: 50px 76px;
  transition: transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.companion-button:hover .companion-body,
.companion-button:focus-visible .companion-body {
  transform: rotate(-7deg) translateY(-3px);
}
.greeted .companion-body {
  animation: tiny-hello 600ms ease both;
}
.companion-eyes {
  transform-origin: 50px 49px;
  animation: tiny-blink 11s infinite;
}
.companion-note {
  max-width: 170px;
  font:
    10px/1.7 'Google Sans Code',
    monospace;
  color: #a09a8d;
  text-wrap: pretty;
}
.camera-spark,
.pencil-doodle {
  opacity: 0;
  transition: opacity 250ms;
}
.companion-button:hover .camera-spark,
.greeted .camera-spark,
.greeted .pencil-doodle {
  opacity: 1;
}
.is-ticket .companion-note {
  color: #88847d;
}
@keyframes tiny-hello {
  0%,
  100% {
    transform: rotate(0);
  }
  30% {
    transform: translateY(-7px) rotate(-9deg);
  }
  65% {
    transform: translateY(-2px) rotate(6deg);
  }
}
@keyframes tiny-blink {
  0%,
  43%,
  46%,
  100% {
    transform: scaleY(1);
  }
  44%,
  45% {
    transform: scaleY(0.1);
  }
}
@media (max-width: 767px) {
  .companion-button {
    flex-basis: 64px;
    width: 64px;
    height: 64px;
  }
  .companion-note {
    font-size: 9px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .companion-eyes,
  .greeted .companion-body {
    animation: none;
  }
  .companion-body,
  .camera-spark,
  .pencil-doodle {
    transition: none;
  }
  .companion-button:hover .companion-body,
  .companion-button:focus-visible .companion-body {
    transform: none;
  }
}
</style>

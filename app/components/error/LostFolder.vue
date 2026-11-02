<script setup lang="ts">
const awake = ref(false)
const look = reactive({ x: 0, y: 0 })

function resetLook() {
  look.x = 0
  look.y = 0
}

function follow(event: PointerEvent) {
  const rect =
    event.currentTarget instanceof HTMLElement
      ? event.currentTarget.getBoundingClientRect()
      : undefined
  if (!rect) return
  look.x = ((event.clientX - rect.left) / rect.width - 0.5) * 8
  look.y = ((event.clientY - rect.top) / rect.height - 0.5) * 6
}
</script>

<template>
  <div class="folder-scene">
    <span class="folder-whisper" aria-live="polite">{{
      awake ? 'Oh, hi. Are you lost too?' : 'I swear it was here…'
    }}</span>
    <button
      class="little-folder"
      :class="{ awake }"
      :aria-label="awake ? 'Let the little folder rest' : 'Say hello to the little folder'"
      :aria-pressed="awake"
      @click="awake = !awake"
      @pointermove="follow"
      @pointerleave="resetLook"
    >
      <svg viewBox="0 0 260 250" fill="none" aria-hidden="true">
        <ellipse
          class="folder-shadow"
          cx="130"
          cy="222"
          rx="66"
          ry="9"
          fill="#242424"
          opacity=".07"
        />
        <g class="folder-body">
          <path
            d="M93 190L88 210M167 190L172 210"
            stroke="#444138"
            stroke-width="5"
            stroke-linecap="round"
          />
          <path
            d="M76 211H89M171 211H184"
            stroke="#444138"
            stroke-width="5"
            stroke-linecap="round"
          />
          <path
            d="M42 107L28 119M218 106L231 94"
            stroke="#444138"
            stroke-width="4"
            stroke-linecap="round"
          />
          <path
            d="M44 65C44 57 50 51 58 51H96L113 68H201C209 68 215 74 215 82V174C215 183 208 190 199 190H60C51 190 44 183 44 174V65Z"
            fill="#E4D39A"
            stroke="#BFAE77"
            stroke-width="2"
          />
          <path
            d="M57 76L193 65L201 155L65 166L57 76Z"
            fill="#FFFEF9"
            stroke="#D8D2BD"
            stroke-width="1.5"
          />
          <path
            d="M79 91L146 86M80 102L168 95"
            stroke="#DAD6C9"
            stroke-width="3"
            stroke-linecap="round"
          />
          <path
            d="M38 107C37 99 43 93 51 93H209C217 93 223 99 222 107L215 177C214 185 208 191 200 191H60C52 191 46 185 45 177L38 107Z"
            fill="#F2E3B5"
            stroke="#BFAE77"
            stroke-width="2"
          />
          <path d="M51 101H207" stroke="#FFF7DF" stroke-width="3" stroke-linecap="round" />
          <g :style="{ transform: `translate(${look.x}px, ${look.y}px)` }" class="folder-face">
            <g class="sleepy-eyes" stroke="#4D473A" stroke-width="3" stroke-linecap="round">
              <path d="M99 132Q105 138 111 132M149 132Q155 138 161 132" />
            </g>
            <g class="open-eyes" fill="#4D473A">
              <ellipse cx="106" cy="132" rx="3.5" ry="5" />
              <ellipse cx="154" cy="132" rx="3.5" ry="5" />
            </g>
            <ellipse cx="91" cy="145" rx="8" ry="4" fill="#D7A789" opacity=".45" />
            <ellipse cx="169" cy="145" rx="8" ry="4" fill="#D7A789" opacity=".45" />
            <path
              d="M123 149Q130 155 137 149"
              stroke="#4D473A"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </g>
          <path
            d="M182 168L204 166L205 178L183 180Z"
            fill="#FFF9E8"
            transform="rotate(-8 194 173)"
          />
          <path
            d="M189 172L199 171M190 176L196 175"
            stroke="#C8BC99"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </g>
      </svg>
    </button>
    <span class="folder-caption">{{ awake ? 'a little company helps.' : 'tap to say hello' }}</span>
  </div>
</template>

<style scoped>
.folder-scene {
  position: relative;
  width: clamp(180px, 27vw, 280px);
  flex: 0 0 auto;
  text-align: center;
}
.little-folder {
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.little-folder:focus-visible {
  outline: 1px dashed #80704b;
  outline-offset: 4px;
  border-radius: 35%;
}
svg {
  width: 100%;
  overflow: visible;
}
.folder-body {
  transform-origin: 130px 210px;
  animation: folder-rock 5s ease-in-out infinite;
}
.folder-face {
  transition: transform 180ms ease-out;
}
.open-eyes {
  opacity: 0;
}
.little-folder:hover .open-eyes,
.little-folder:focus-visible .open-eyes,
.awake .open-eyes {
  opacity: 1;
}
.little-folder:hover .sleepy-eyes,
.little-folder:focus-visible .sleepy-eyes,
.awake .sleepy-eyes {
  opacity: 0;
}
.awake .folder-body {
  animation: folder-hello 650ms ease-in-out both;
}
.folder-whisper {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translate(-50%, -55%) rotate(-7deg);
  width: 230px;
  font-size: 13px;
  color: #7e796e;
}
.folder-caption {
  display: block;
  margin-top: -10px;
  font:
    10px 'Google Sans Code',
    monospace;
  color: #a09c92;
}
@keyframes folder-rock {
  0%,
  100% {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg) translateY(-4px);
  }
}
@keyframes folder-hello {
  0%,
  100% {
    transform: rotate(0);
  }
  25% {
    transform: translateY(-12px) rotate(-7deg);
  }
  60% {
    transform: translateY(-5px) rotate(6deg);
  }
}
@media (max-width: 480px) {
  .folder-scene {
    width: 160px;
  }
  .folder-whisper {
    font-size: 11px;
    width: 190px;
  }
  .folder-caption {
    font-size: 9px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .folder-body,
  .awake .folder-body {
    animation: none;
  }
  .folder-face {
    transition: none;
  }
}
</style>

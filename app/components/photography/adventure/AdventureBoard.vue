<script setup lang="ts">
import PhotoFriendSprite from '../PhotoFriendSprite.vue'
import AdventurePal from './AdventurePal.vue'
import {
  tiles,
  mothPositions,
  platesReady,
  neighbours,
  ADVENTURE_COLUMNS,
  ADVENTURE_ROWS,
  type AdventureLevel,
  type AdventureState,
} from '~/utils/photoAdventure'
const props = defineProps<{
  level: AdventureLevel
  state: AdventureState
  ready: boolean
  flash: boolean
}>()
const emit = defineEmits<{ move: [tile: number] }>()
const map = computed(() => [...props.level.rows.join('')])
const stars = ['❧', '♢', '☾', '☀']
function label(tile: string, index: number) {
  if (props.state.position === index) return 'Pip is here'
  if (props.state.crates.includes(index)) return 'Paperweight: push onto a brass switch'
  if (tile === '*')
    return props.state.collected.includes(index) ? 'A remembered place' : 'Memory spark'
  if (tile === 'N') return props.level.friend
  if (tile === 'X')
    return `${['Leaf', 'Raindrop', 'Moon', 'Sun'][tiles(props.level, 'X').indexOf(index)]} memory: E to wake`
  return (
    {
      '#': 'Tree',
      '~': 'River',
      '=': 'Paper bridge',
      P: 'Brass switch',
      L: 'Lantern: E to light',
      G: 'Little door to the next photograph',
      V: 'Camera mark: Space to photograph the sky',
      I: 'Ice: keep sliding until dry paper',
      O: 'Paper portal: step through to the other ring',
      T: 'Tide crossing: wait for low water or use the camera',
      '>': 'Breeze: carries Pip right',
      '<': 'Breeze: carries Pip left',
      '^': 'Breeze: carries Pip up',
      v: 'Breeze: carries Pip down',
    }[tile] || 'Path'
  )
}
</script>

<template>
  <div
    class="adventure-map"
    data-game-focus
    tabindex="0"
    :class="[`theme-${level.theme}`, { 'camera-flash': flash }]"
    role="group"
    aria-label="Adventure map. Arrow keys or WASD move Pip. E interacts. Space takes a photo."
  >
    <button
      v-for="(cell, index) in map"
      :key="index"
      type="button"
      tabindex="-1"
      class="map-tile"
      :class="{
        tree: cell === '#',
        river: cell === '~',
        bridge: cell === '=',
        'bridge-open': cell === '=' && platesReady(state, level),
        nearby: neighbours(state.position, index) && !['#', '~', 'N'].includes(cell),
        ice: cell === 'I',
        tide: cell === 'T',
        'tide-low': cell === 'T' && (state.stun > 0 || state.turn % 4 >= 2),
      }"
      :aria-label="`${label(cell, index)}, row ${Math.floor(index / ADVENTURE_COLUMNS) + 1}, column ${(index % ADVENTURE_COLUMNS) + 1}`"
      @click="emit('move', index)"
    >
      <span v-if="cell === '#'" class="tree-crown" aria-hidden="true" />
      <span v-else-if="['>', '<', '^', 'v'].includes(cell)" class="wind-arrow" aria-hidden="true">{{
        { '>': '→', '<': '←', '^': '↑', v: '↓' }[cell]
      }}</span>
      <span v-else-if="cell === 'O'" class="paper-portal" aria-hidden="true">◎</span>
      <span
        v-else-if="cell === 'P'"
        class="brass-switch"
        :class="{ pressed: state.crates.includes(index) }"
        aria-hidden="true"
      />
      <span
        v-else-if="cell === '*' && !state.collected.includes(index)"
        class="memory-spark"
        aria-hidden="true"
        >✧</span
      >
      <span v-else-if="cell === 'G'" class="little-door" :class="{ ready }" aria-hidden="true"
        ><i
      /></span>
      <svg
        v-else-if="cell === 'L'"
        class="lantern"
        :class="{ lit: state.lanterns.includes(index) }"
        viewBox="0 0 50 60"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 16V11Q25 2 30 11V16M15 19H35L32 47H18Z"
          stroke="currentColor"
          stroke-width="2"
        />
        <path d="M17 22H33L30 43H20Z" fill="currentColor" opacity=".5" />
        <path
          d="M12 18H38M17 50H33"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
      <span
        v-else-if="cell === 'X'"
        class="memory-star"
        :class="{ awakened: tiles(level, 'X').indexOf(index) < state.sequence }"
        aria-hidden="true"
        >{{ stars[tiles(level, 'X').indexOf(index)] }}</span
      >
      <span v-else-if="cell === 'V'" class="camera-mark" aria-hidden="true">⌑</span>
      <div v-else-if="cell === 'N'" class="map-npc" aria-hidden="true">
        <AdventurePal :kind="level.theme" /><span>…</span>
      </div>
      <svg
        v-if="state.crates.includes(index)"
        class="paperweight"
        viewBox="0 0 60 60"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="9"
          y="13"
          width="42"
          height="36"
          rx="6"
          fill="#cdbb91"
          stroke="#a9956e"
          stroke-width="2"
        />
        <path d="M9 25H51M30 14V48" stroke="#efe1b9" stroke-width="6" />
        <path
          d="M18 37V39M42 37V39M27 42Q30 45 33 42"
          stroke="#837152"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
    <div
      v-for="(moth, index) in mothPositions(state, level)"
      :key="index"
      class="map-moth"
      :class="{ stunned: state.stun > 0 }"
      :style="{
        left: `${((moth % ADVENTURE_COLUMNS) / ADVENTURE_COLUMNS) * 100}%`,
        top: `${(Math.floor(moth / ADVENTURE_COLUMNS) / ADVENTURE_ROWS) * 100}%`,
      }"
      aria-hidden="true"
    >
      <svg viewBox="0 0 70 70" fill="none">
        <ellipse cx="22" cy="35" rx="16" ry="12" fill="#a8a5bb" transform="rotate(-30 22 35)" />
        <ellipse cx="48" cy="35" rx="16" ry="12" fill="#c0b6ca" transform="rotate(30 48 35)" />
        <path d="M33 22L26 13M37 22L44 13" stroke="#d9d0b6" stroke-width="2" />
        <ellipse cx="35" cy="35" rx="6" ry="14" fill="#ded3ad" />
        <path d="M33 29V31M37 29V31" stroke="#6b6478" stroke-width="2" /></svg
      ><span v-if="state.stun">✧</span>
    </div>
    <div
      class="map-pip"
      :style="{
        left: `${((state.position % ADVENTURE_COLUMNS) / ADVENTURE_COLUMNS) * 100}%`,
        top: `${(Math.floor(state.position / ADVENTURE_COLUMNS) / ADVENTURE_ROWS) * 100}%`,
      }"
      aria-hidden="true"
    >
      <PhotoFriendSprite :key="state.position" /><span class="camera-strap" />
    </div>
    <span class="sr-only" aria-live="polite"
      >Pip: row {{ Math.floor(state.position / ADVENTURE_COLUMNS) + 1 }}, column
      {{ (state.position % ADVENTURE_COLUMNS) + 1 }}.</span
    >
  </div>
</template>

<style scoped>
.adventure-map {
  --ground: #edf0df;
  --tree: #b6c7a2;
  --tree-dark: #a6ba94;
  position: relative;
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  aspect-ratio: 9/7;
  overflow: hidden;
  background: var(--ground);
  border-radius: 20px;
  isolation: isolate;
  background-image: radial-gradient(#91a27833 0.8px, transparent 0.8px);
  background-size: 13px 13px;
}
.theme-rain {
  --ground: #dfe9e5;
  --tree: #a8c0b9;
  --tree-dark: #95b2a8;
}
.theme-night {
  --ground: #2c3344;
  --tree: #41495d;
  --tree-dark: #363e52;
  background-image: radial-gradient(#a3b0b11f 0.8px, transparent 0.8px);
}
.theme-dawn {
  --ground: #ede5d9;
  --tree: #cfbaa5;
  --tree-dark: #c2ad96;
}
.map-tile {
  position: relative;
  min-width: 0;
  width: 100%;
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.map-tile:not(.tree):not(.river):nth-child(3n)::before {
  content: '';
  position: absolute;
  width: 35%;
  height: 8%;
  border-radius: 50%;
  background: #b4bf9c24;
  bottom: 12%;
  left: 20%;
}
.map-tile.nearby::after {
  content: '';
  position: absolute;
  inset: 16%;
  border: 1px dashed #a99a694a;
  border-radius: 50%;
}
.map-tile:hover:not(.tree):not(.river) {
  background: #fff2;
}
.tree-crown {
  width: 87%;
  height: 85%;
  border-radius: 44% 52% 40% 54%;
  background: var(--tree);
  box-shadow: inset -7px -7px 0 #00000006;
  transform: rotate(-15deg);
}
.tree:nth-child(even) .tree-crown {
  transform: rotate(25deg) scale(0.9);
  background: var(--tree-dark);
}
.tree-crown::after {
  content: '';
  display: block;
  width: 2px;
  height: 25%;
  margin: 45% auto 0;
  background: #75856055;
  border-radius: 50%;
}
.river,
.bridge {
  background: #a8c5ca;
  background-image: repeating-linear-gradient(
    170deg,
    transparent 0 14px,
    #ffffff24 15px 16px,
    transparent 18px 26px
  );
}
.ice {
  background: linear-gradient(135deg, #d0e5e7, #e8f2ef 47%, #bbd9dd 49%, #dfedeb);
  box-shadow: inset 0 0 0 1px #ffffff55;
}
.wind-arrow {
  color: #9eae7e;
  font-size: clamp(18px, 3vw, 30px);
  opacity: 0.8;
}
.paper-portal {
  color: #c2adc9;
  font-size: clamp(26px, 4vw, 43px);
  filter: drop-shadow(0 0 9px #cbb5cb66);
}
.tide {
  background: repeating-linear-gradient(170deg, #98bdc4 0 12px, #b1ced1 13px 16px);
}
.tide-low {
  background: repeating-linear-gradient(170deg, #ddd0ad 0 12px, #d4c39b 13px 16px);
}
.bridge {
  background-color: #a8c5ca;
}
.bridge-open {
  background: repeating-linear-gradient(0deg, #dbcaa1 0 9px, #bba77e 10px 11px);
  box-shadow:
    inset 4px 0 #a48e65,
    inset -4px 0 #a48e65;
}
.brass-switch {
  width: 54%;
  height: 54%;
  border: 2px solid #b8a56c;
  border-radius: 50%;
  background: #c8b16c22;
  box-shadow: 0 0 0 5px #b6a06911;
}
.brass-switch.pressed {
  box-shadow: 0 0 16px #d8ba66;
  background: #ead38f;
}
.memory-spark {
  font-size: clamp(18px, 3vw, 35px);
  color: #b89442;
  filter: drop-shadow(0 0 7px #edd08c);
  animation: spark-breathe 3s ease-in-out infinite;
}
.theme-night .memory-spark {
  color: #f0d68f;
}
.little-door {
  position: relative;
  width: 48%;
  height: 66%;
  border: 2px solid #a49c7f;
  border-radius: 50% 50% 3px 3px;
  background: #beb9a1;
}
.little-door i {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #807762;
  right: 15%;
  top: 55%;
}
.little-door.ready {
  background: #eee0a8;
  box-shadow: 0 0 25px #e8d79a;
  border-color: #c6b576;
}
.lantern {
  width: 65%;
  height: 80%;
  color: #8b8b92;
}
.lantern.lit {
  color: #f1d291;
  filter: drop-shadow(0 0 15px #ead18bcc);
}
.memory-star {
  color: #ad9b8c;
  font-size: clamp(20px, 4vw, 40px);
}
.memory-star.awakened {
  color: #a98032;
  filter: drop-shadow(0 0 10px #e4c074);
}
.camera-mark {
  color: #b69f83;
  font-size: 38px;
  border: 1px dashed #b9a783;
  border-radius: 50%;
  width: 66%;
  height: 66%;
  display: grid;
  place-items: center;
}
.paperweight {
  position: absolute;
  inset: 7%;
  width: 86%;
  height: 86%;
}
.map-npc {
  width: 80%;
  height: 92%;
  position: relative;
}
.map-npc svg {
  width: 100%;
  height: 100%;
}
.map-npc span {
  position: absolute;
  top: -5%;
  right: -12%;
  background: #fffef2;
  color: #8c826e;
  border-radius: 8px;
  padding: 0 6px;
  font: 12px monospace;
}
.map-pip,
.map-moth {
  position: absolute;
  width: calc(100% / 9);
  height: calc(100% / 7);
  pointer-events: none;
  transition:
    left 180ms ease,
    top 180ms ease;
}
.map-pip {
  padding: 1px 5px 3px;
  z-index: 4;
  filter: drop-shadow(0 3px 2px #3c38291c);
}
.map-pip svg {
  width: 100%;
  height: 100%;
  animation: pip-hop 180ms ease-out;
}
.map-moth {
  z-index: 3;
  padding: 8px;
}
.map-moth svg {
  width: 100%;
  height: 100%;
  animation: moth-flutter 800ms ease-in-out infinite alternate;
}
.map-moth.stunned svg {
  animation-play-state: paused;
  opacity: 0.65;
}
.map-moth span {
  position: absolute;
  top: -4px;
  left: 40%;
  color: #e8d798;
  font-size: 18px;
}
.adventure-map::after {
  content: '';
  pointer-events: none;
  position: absolute;
  inset: 0;
  background: #fff8d4;
  z-index: 10;
  opacity: 0;
  transition: opacity 300ms;
}
.camera-flash::after {
  animation: camera-click 300ms ease-out;
}
@keyframes camera-click {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 0;
  }
}
@keyframes spark-breathe {
  0%,
  100% {
    transform: scale(0.9) rotate(-8deg);
  }
  50% {
    transform: scale(1.1) rotate(8deg);
  }
}
@keyframes pip-hop {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-9px) rotate(-4deg);
  }
}
@keyframes moth-flutter {
  from {
    transform: scaleX(0.8) translateY(2px);
  }
  to {
    transform: scaleX(1) translateY(-2px);
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::after {
    animation: none !important;
    transition: none !important;
  }
  .camera-flash::after {
    opacity: 0.12;
  }
}
</style>

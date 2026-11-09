<script setup lang="ts">
import { CART_TRACKS, trackPoint } from '~~/shared/cart/tracks'
import { CART_COLOURS, CART_ITEMS, RACE_LAPS, formatCartTime } from '~~/shared/cart/race'
import { createPipCartScene } from '~/utils/pipCartScene'
import PhotoFriendSprite from '~/components/photography/PhotoFriendSprite.vue'
const game = usePipCart()
const {
  selected,
  colour,
  name,
  difficulty,
  phase,
  track,
  race,
  standings,
  position,
  player,
  countdown,
  records,
  autoGas,
} = game
const canvas = ref<HTMLCanvasElement>(),
  ready = ref(false),
  error = ref(''),
  touch = ref(false)
const keys = new Set<string>()
const touchSteer = ref(0),
  touchBrake = ref(false),
  touchDrift = ref(false),
  touchGas = ref(false)
const minimap = computed(
  () =>
    track.value.samples
      .filter((_, i) => i % 4 === 0)
      .map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.z.toFixed(1)}`)
      .join(' ') + ' Z',
)
const wrongWay = computed(() => {
  if (!player.value) return false
  const p = trackPoint(track.value, player.value.progress)
  return (
    player.value.speed > 3 &&
    Math.sin(player.value.yaw) * p.tx + Math.cos(player.value.yaw) * p.tz < -0.2
  )
})
const placeSuffix = (n: number) => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th')
let scene: ReturnType<typeof createPipCartScene> | undefined,
  animation = 0,
  last = 0
function resetControls() {
  keys.clear()
  touchSteer.value = 0
  touchBrake.value = false
  touchDrift.value = false
  touchGas.value = false
  Object.assign(game.input, { throttle: 0, steer: 0, brake: false, drift: false })
}
function buildScene() {
  scene?.dispose()
  ready.value = false
  try {
    scene = createPipCartScene(canvas.value!, track.value)
    ready.value = true
    error.value = ''
  } catch {
    error.value = 'This browser couldn’t open the 3D racetrack. Try a browser with WebGL 2 enabled.'
  }
}
function start() {
  resetControls()
  buildScene()
  if (ready.value) game.start()
}
function pause() {
  resetControls()
  game.pause()
}
function menu() {
  resetControls()
  game.menu()
}
function keyDown(event: KeyboardEvent) {
  if (['KeyP', 'Escape'].includes(event.code) && ['race', 'paused'].includes(phase.value)) {
    event.preventDefault()
    if (!event.repeat) {
      if (phase.value === 'paused') game.resume()
      else pause()
    }
    return
  }
  if (!['race', 'countdown'].includes(phase.value)) return
  if (
    [
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowLeft',
      'ArrowDown',
      'ArrowRight',
      'Space',
      'ShiftLeft',
      'ShiftRight',
      'KeyE',
      'KeyR',
    ].includes(event.code)
  )
    event.preventDefault()
  keys.add(event.code)
  if (event.code === 'KeyE' && !event.repeat) game.item()
  if (event.code === 'KeyR' && !event.repeat) game.rescue()
}
function hold(event: PointerEvent, action: 'left' | 'right' | 'brake' | 'drift' | 'gas') {
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  if (action === 'left') touchSteer.value = -1
  if (action === 'right') touchSteer.value = 1
  if (action === 'brake') touchBrake.value = true
  if (action === 'drift') touchDrift.value = true
  if (action === 'gas') touchGas.value = true
}
function release(action: 'steer' | 'brake' | 'drift' | 'gas') {
  if (action === 'steer') touchSteer.value = 0
  if (action === 'brake') touchBrake.value = false
  if (action === 'drift') touchDrift.value = false
  if (action === 'gas') touchGas.value = false
}
function frame(now: number) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016
  last = now
  const active = phase.value === 'race'
  game.input.brake = active && (keys.has('KeyS') || keys.has('ArrowDown') || touchBrake.value)
  game.input.throttle =
    active &&
    !game.input.brake &&
    (autoGas.value || keys.has('KeyW') || keys.has('ArrowUp') || touchGas.value)
      ? 1
      : 0
  game.input.steer = active
    ? Math.max(
        -1,
        Math.min(
          1,
          Number(keys.has('KeyD') || keys.has('ArrowRight')) -
            Number(keys.has('KeyA') || keys.has('ArrowLeft')) +
            touchSteer.value,
        ),
      )
    : 0
  game.input.drift =
    active &&
    (keys.has('Space') || keys.has('ShiftLeft') || keys.has('ShiftRight') || touchDrift.value)
  game.update(dt)
  scene?.draw(race.value, dt, now / 1000)
  animation = requestAnimationFrame(frame)
}
onMounted(() => {
  touch.value = window.matchMedia('(pointer:coarse)').matches
  autoGas.value = touch.value
  buildScene()
  animation = requestAnimationFrame(frame)
})
watch(selected, () => {
  if (canvas.value) {
    game.menu()
    resetControls()
    buildScene()
  }
})
useEventListener('keydown', keyDown)
useEventListener('keyup', (event) => keys.delete(event.code))
useEventListener('blur', pause)
useEventListener(document, 'visibilitychange', () => {
  if (document.hidden) pause()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(animation)
  scene?.dispose()
})
</script>

<template>
  <main
    class="pip-cart"
    :class="{
      moon: track.config.theme === 'moon',
      'is-racing': phase === 'race',
      'touch-mode': touch,
    }"
  >
    <canvas
      ref="canvas"
      class="cart-canvas"
      aria-label="Pip's Little Grand Prix, a 3D kart racing game"
    />
    <header class="cart-header">
      <NuxtLink to="/" class="home-link">↖ Julian Gojani</NuxtLink>
      <div class="cart-brand">
        <span>⚑</span>
        <div>PIP’S LITTLE GRAND PRIX<small>little wheels. very big feelings.</small></div>
      </div>
      <button v-if="phase === 'race'" class="pause-button" @click="pause">Ⅱ <kbd>P</kbd></button
      ><span v-else class="race-type">{{
        phase === 'menu' ? '3 tracks · 7 AI friends' : 'a friendly bit of chaos'
      }}</span>
    </header>
    <section v-if="phase === 'menu'" class="cart-menu">
      <div class="menu-intro">
        <p class="eyebrow">A POCKET-SIZED KART ADVENTURE</p>
        <h1>Little wheels.<br /><span>Big feelings.</span></h1>
        <p>
          Seven little rivals. Three very different roads.<br />Keep your corners soft and your
          snacks secure.
        </p>
      </div>
      <div class="track-selection" role="group" aria-label="Choose a racetrack">
        <button
          v-for="(config, index) in CART_TRACKS"
          :key="config.id"
          class="track-card"
          :class="{ selected: selected === index }"
          :aria-pressed="selected === index"
          @click="selected = index"
        >
          <div class="track-thumbnail" :style="{ '--track-tint': config.colour }">
            <svg viewBox="-65 -55 130 115" aria-hidden="true">
              <path
                :d="config.points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ') + ' Z'"
                fill="none"
                stroke="#fff9e8"
                stroke-width="9"
                stroke-linejoin="round"
              />
              <path
                :d="config.points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ') + ' Z'"
                fill="none"
                stroke="#b7aa88"
                stroke-width="1.1"
                stroke-dasharray="2 2"
              /></svg
            ><span>{{ ['❧', '♢', '☾'][index] }}</span>
          </div>
          <p class="eyebrow">{{ config.subtitle }}</p>
          <h2>{{ config.name }}</h2>
          <p class="track-description">{{ config.description }}</p>
          <small>{{
            records[config.id]
              ? `best ${formatCartTime(records[config.id]!.time)} · ${records[config.id]!.place}${placeSuffix(records[config.id]!.place)}`
              : 'a fresh little page'
          }}</small>
        </button>
      </div>
      <div class="race-options">
        <div class="driver-preview" :style="{ background: CART_COLOURS[colour] }">
          <PhotoFriendSprite />
        </div>
        <div class="driver-name">
          <label for="cart-driver">Your little driver</label
          ><input id="cart-driver" v-model="name" maxlength="20" placeholder="Pip" />
          <div class="kart-colours" aria-label="Kart colour" role="group">
            <button
              v-for="(tint, index) in CART_COLOURS"
              :key="tint"
              :aria-label="`Kart colour ${index + 1}`"
              :aria-pressed="colour === index"
              :class="{ chosen: colour === index }"
              :style="{ background: tint }"
              @click="colour = index"
            />
          </div>
        </div>
        <div class="driver-options">
          <label
            >Pace
            <select v-model="difficulty">
              <option value="gentle">Gentle company</option>
              <option value="peppy">A little competitive</option>
            </select></label
          ><label class="gas-option"
            ><input v-model="autoGas" type="checkbox" />Auto-accelerate</label
          >
        </div>
        <button class="start-race" :disabled="!ready" @click="start">
          {{ ready ? 'A little race, then' : 'Unfolding the road…' }} <span>↗</span>
        </button>
      </div>
      <p v-if="error" class="graphics-error" role="alert">{{ error }}</p>
      <footer class="menu-controls">
        <span
          >W / ↑ accelerate · S / ↓ brake · A D / ← → steer · Space / Shift drift · E item · R
          rescue · P pause</span
        ><span>Single player · 3 laps · records saved in this browser</span>
      </footer>
    </section>
    <template v-else>
      <div class="race-top">
        <div class="position-pill">
          <strong
            >{{ position || 1 }}<small>{{ placeSuffix(position || 1) }}</small></strong
          ><span>of 8 little racers</span>
        </div>
        <div class="lap-pill">
          <span>lap</span
          ><strong
            >{{ Math.min(RACE_LAPS, Math.floor((player?.gates ?? 0) / 12) + 1) }}
            <small>/ {{ RACE_LAPS }}</small></strong
          ><span>{{ race ? formatCartTime(race.elapsed) : '0:00.00' }}</span>
        </div>
        <button
          class="item-slot"
          :disabled="!player?.item || phase !== 'race'"
          :aria-label="
            player?.item
              ? `Use ${CART_ITEMS[player.item].name}`
              : 'No item. Drive through a postcard box.'
          "
          @click="game.item"
        >
          <span>{{ player?.item ? CART_ITEMS[player.item].icon : '?' }}</span
          ><small>{{ player?.item ? CART_ITEMS[player.item].name : 'a little surprise' }}</small
          ><kbd>E</kbd>
        </button>
      </div>
      <aside class="race-minimap" aria-label="Racetrack minimap">
        <svg viewBox="-66 -58 132 120">
          <path
            :d="minimap"
            fill="none"
            stroke="#c1b497"
            stroke-width="5"
            stroke-linejoin="round"
          />
          <circle
            v-for="racer in race?.racers.filter((r) => r.id !== 0)"
            :key="racer.id"
            :cx="racer.x"
            :cy="racer.z"
            r="2.2"
            :fill="CART_COLOURS[racer.colour]"
            stroke="#8b7e66"
            stroke-width=".4"
          />
          <circle
            v-if="player"
            :cx="player.x"
            :cy="player.z"
            r="3"
            fill="#fff8de"
            stroke="#897346"
            stroke-width="1.1"
          /></svg
        ><span>{{ track.config.name }}</span>
      </aside>
      <div class="speed-card">
        <strong>{{ Math.round((player?.speed ?? 0) * 4) }}<small>tiny km/h</small></strong>
        <div class="drift-track" :class="{ charged: (player?.drift ?? 0) > 0.55 }">
          <i :style="{ width: `${Math.min(100, ((player?.drift ?? 0) / 2.8) * 100)}%` }" />
        </div>
        <span>{{
          (player?.boostUntil ?? 0) > (race?.elapsed ?? 0)
            ? '✧ a little extra sunshine'
            : player?.wasDrifting
              ? 'hold the drift. release for a boost.'
              : 'Space / Shift to drift'
        }}</span>
      </div>
      <div
        v-if="race && race.noticeUntil > race.elapsed && phase === 'race'"
        class="race-toast"
        role="status"
      >
        {{ race.notice }}
      </div>
      <div v-if="wrongWay && phase === 'race'" class="wrong-way">
        ↶ The little road goes the other way.
        <button @click="game.rescue">R · a helping ribbon</button>
      </div>
      <div v-if="phase === 'countdown'" class="countdown-card">
        <span>READY, LITTLE DRIVER?</span><strong :key="countdown">{{ countdown }}</strong>
        <p>Hold W or ↑. A little adventure is about to happen.</p>
      </div>
      <div v-if="phase === 'paused'" class="cart-overlay">
        <section class="pause-card">
          <PhotoFriendSprite />
          <p class="eyebrow">A VERY IMPORTANT PIT STOP</p>
          <h2>Even little engines<br />need a snack break.</h2>
          <button class="warm-button" @click="game.resume">Back to the lovely chaos ↗</button
          ><button class="quiet-button" @click="start">Restart this little race</button
          ><button class="quiet-button" @click="menu">Back to the three roads</button>
        </section>
      </div>
      <div v-if="phase === 'finished'" class="cart-overlay finish-overlay">
        <section class="results-card">
          <p class="eyebrow">A LITTLE RACE, WELL RUN.</p>
          <h2>
            {{
              position === 1
                ? 'A very tiny champion.'
                : position <= 3
                  ? 'A pocket-sized podium.'
                  : 'A lovely bit of mischief.'
            }}
          </h2>
          <div class="result-summary">
            <PhotoFriendSprite />
            <div>
              <strong
                >{{ position }}<small>{{ placeSuffix(position) }}</small></strong
              >
              <p>{{ player?.finishedAt ? formatCartTime(player.finishedAt) : '' }}</p>
              <span>{{ track.config.name }}</span>
            </div>
          </div>
          <ol class="race-results">
            <li
              v-for="(racer, index) in standings"
              :key="racer.id"
              :class="{ self: racer.id === 0 }"
            >
              <span
                ><i :style="{ background: CART_COLOURS[racer.colour] }" />{{ index + 1 }}.
                {{ racer.name }}</span
              ><span>{{
                racer.finishedAt !== null
                  ? formatCartTime(racer.finishedAt)
                  : 'still enjoying the scenery'
              }}</span>
            </li>
          </ol>
          <div class="result-actions">
            <button class="warm-button" @click="start">One more little lap? ↻</button
            ><button class="quiet-button" @click="menu">Choose another road ↗</button>
          </div>
          <small>Your fastest time stays on the little trophy shelf in this browser.</small>
        </section>
      </div>
      <template v-if="touch && phase === 'race'"
        ><div class="touch-steering">
          <button
            aria-label="Steer left"
            @pointerdown.prevent="hold($event, 'left')"
            @pointerup="release('steer')"
            @pointercancel="release('steer')"
          >
            ←</button
          ><button
            aria-label="Steer right"
            @pointerdown.prevent="hold($event, 'right')"
            @pointerup="release('steer')"
            @pointercancel="release('steer')"
          >
            →
          </button>
        </div>
        <div class="touch-pedals">
          <button
            aria-label="Brake"
            @pointerdown.prevent="hold($event, 'brake')"
            @pointerup="release('brake')"
            @pointercancel="release('brake')"
          >
            Brake</button
          ><button
            aria-label="Hold to drift, release to boost"
            @pointerdown.prevent="hold($event, 'drift')"
            @pointerup="release('drift')"
            @pointercancel="release('drift')"
          >
            Drift ✧</button
          ><button
            v-if="!autoGas"
            aria-label="Accelerate"
            @pointerdown.prevent="hold($event, 'gas')"
            @pointerup="release('gas')"
            @pointercancel="release('gas')"
          >
            Go ↑
          </button>
        </div></template
      >
      <button v-if="phase === 'race'" class="rescue-button" @click="game.rescue">
        R · a helping ribbon ↗
      </button>
    </template>
  </main>
</template>

<style scoped>
.pip-cart {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #e9eddf;
  color: #7c6c4f;
  font-family: 'Google Sans', sans-serif;
}
.cart-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.cart-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 18px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  z-index: 10;
  pointer-events: none;
}
.cart-header > a,
.cart-header > button {
  pointer-events: auto;
}
.home-link {
  font-size: 12px;
  min-height: 44px;
  display: flex;
  align-items: center;
  color: #897c60;
  text-decoration: none;
}
.cart-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font:
    10px 'Google Sans Code',
    monospace;
  letter-spacing: 0.07em;
}
.cart-brand > span {
  font-size: 28px;
  color: #af9a6c;
}
.cart-brand small {
  display: block;
  font-size: 8px;
  letter-spacing: 0;
  margin-top: 5px;
  color: #aa9e85;
}
.race-type {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #a49a82;
}
.pause-button {
  min-width: 50px;
  min-height: 44px;
  border: 1px solid #ded3b7;
  background: #fff9e5c9;
  border-radius: 10px;
  color: #a48c60;
}
kbd {
  font:
    9px 'Google Sans Code',
    monospace;
  color: #bba782;
  margin-left: 8px;
}
.cart-menu {
  position: absolute;
  inset: 85px max(28px, calc((100vw - 1100px) / 2)) 20px;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 12px 20px 18px;
  background: #fffdf0e8;
  border: 1px solid #e0d7bf;
  border-radius: 24px;
  box-shadow: 0 16px 65px #5c55321a;
  backdrop-filter: blur(9px);
}
.menu-intro {
  text-align: center;
  margin: 12px auto 24px;
}
.eyebrow {
  font:
    8px/1.8 'Google Sans Code',
    monospace;
  color: #b2a383;
  letter-spacing: 0.08em;
}
h1 {
  font-size: clamp(35px, 4.7vw, 61px);
  font-weight: 400;
  letter-spacing: -0.065em;
  line-height: 1;
  margin: 15px 0;
}
h1 > span {
  color: #b39b6d;
}
.menu-intro > p:last-child {
  font-size: 12px;
  line-height: 1.8;
  color: #ad9e80;
}
.track-selection {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.track-card {
  text-align: left;
  border: 1px solid #e0d6be;
  border-radius: 16px;
  padding: 12px;
  background: #fffaf0aa;
  color: #9a8969;
  transition:
    transform 180ms,
    border-color 180ms;
}
.track-card.selected {
  border-color: #baa16d;
  background: #f7eed7;
  transform: translateY(-3px);
}
.track-thumbnail {
  height: 110px;
  position: relative;
  overflow: hidden;
  border-radius: 9px;
  background: var(--track-tint);
  opacity: 0.85;
}
.track-thumbnail svg {
  width: 100%;
  height: 100%;
  transform: rotate(-9deg);
}
.track-thumbnail > span {
  position: absolute;
  right: 12px;
  top: 8px;
  color: #fff8dd;
  font-size: 25px;
}
.track-card > .eyebrow {
  font-size: 6px;
  margin-top: 13px;
}
.track-card h2 {
  font-size: 23px;
  line-height: 1.15;
  font-weight: 400;
  letter-spacing: -0.045em;
  margin-top: 7px;
}
.track-description {
  font-size: 10px;
  line-height: 1.75;
  color: #b0a083;
  margin-top: 10px;
  min-height: 50px;
}
.track-card small {
  display: block;
  border-top: 1px solid #e5dbc3;
  margin-top: 12px;
  padding-top: 10px;
  font:
    8px 'Google Sans Code',
    monospace;
  color: #af9c76;
}
.race-options {
  display: flex;
  gap: 18px;
  align-items: center;
  margin: 26px 8px 0;
}
.driver-preview {
  width: 60px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 40%;
  transform: rotate(-7deg);
}
.driver-preview svg {
  width: 100%;
  height: 100%;
}
.driver-name {
  width: 190px;
  max-width: 100%;
  flex-shrink: 0;
}
.driver-name label,
.driver-options > label:first-child {
  display: block;
  font:
    8px 'Google Sans Code',
    monospace;
  color: #b5a27d;
}
.driver-name > input {
  width: 100%;
  font-size: 14px;
  color: #a18b61;
  border: 0;
  border-bottom: 1px solid #dcd0b2;
  background: transparent;
  padding: 6px 0;
}
.kart-colours {
  display: flex;
  gap: 7px;
  margin-top: 10px;
}
.kart-colours button {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #ddd0ae;
}
.kart-colours .chosen {
  box-shadow: 0 0 0 2px #a68e5b;
}
.driver-options {
  flex: 1;
  min-width: 140px;
}
.driver-options select {
  display: block;
  background: transparent;
  border: 0;
  color: #a18a62;
  font:
    11px 'Google Sans',
    sans-serif;
  margin-top: 8px;
  min-height: 28px;
}
.gas-option {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  color: #b29d78;
  margin-top: 7px;
  min-height: 26px;
}
.gas-option input {
  accent-color: #b4a078;
}
.start-race,
.warm-button {
  min-height: 47px;
  background: #eddfba;
  border: 1px solid #d8c497;
  color: #8e7546;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 12px;
  white-space: nowrap;
}
.start-race {
  display: flex;
  justify-content: space-between;
  gap: 25px;
  min-width: 210px;
}
.start-race:disabled {
  opacity: 0.5;
  cursor: wait;
}
.menu-controls {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin: 22px 8px 0;
  font:
    7px/1.9 'Google Sans Code',
    monospace;
  color: #b8aa8d;
}
.graphics-error {
  font-size: 12px;
  color: #ac8966;
  margin: 15px;
}
.race-top {
  position: absolute;
  top: 95px;
  left: 28px;
  right: 28px;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
  pointer-events: none;
  z-index: 8;
}
.position-pill,
.lap-pill,
.item-slot {
  background: #fffceddf;
  border: 1px solid #e0d4b9;
  backdrop-filter: blur(6px);
  border-radius: 17px;
  color: #a48a5c;
  padding: 14px 20px;
}
.position-pill strong {
  font-size: 43px;
  font-weight: 400;
  letter-spacing: -0.07em;
  line-height: 1;
}
.position-pill strong small {
  font-size: 17px;
  letter-spacing: -0.04em;
}
.position-pill > span {
  display: block;
  font:
    7px 'Google Sans Code',
    monospace;
  color: #b3a183;
  margin-top: 6px;
}
.lap-pill {
  text-align: center;
  display: flex;
  gap: 16px;
  align-items: center;
  font:
    9px 'Google Sans Code',
    monospace;
  color: #b4a07e;
}
.lap-pill strong {
  font:
    25px 'Google Sans',
    sans-serif;
  color: #a08858;
}
.lap-pill strong small {
  font:
    10px 'Google Sans Code',
    monospace;
  color: #baa986;
}
.item-slot {
  position: relative;
  pointer-events: auto;
  width: 135px;
  min-height: 94px;
  padding: 10px 12px;
}
.item-slot:disabled {
  opacity: 0.7;
}
.item-slot > span {
  display: block;
  font-size: 31px;
  line-height: 1;
  color: #ae925c;
}
.item-slot small {
  display: block;
  margin-top: 8px;
  font:
    7px/1.5 'Google Sans Code',
    monospace;
  color: #b09a72;
}
.item-slot kbd {
  position: absolute;
  top: 10px;
  right: 12px;
}
.race-minimap {
  position: absolute;
  right: 28px;
  bottom: 38px;
  width: 170px;
  padding: 10px;
  background: #fffcedd9;
  border: 1px solid #ded2b7;
  border-radius: 16px;
  pointer-events: none;
}
.race-minimap svg {
  width: 100%;
  height: 150px;
  display: block;
}
.race-minimap > span {
  display: block;
  text-align: center;
  color: #b29b72;
  font:
    7px 'Google Sans Code',
    monospace;
  margin-top: 5px;
}
.speed-card {
  position: absolute;
  left: 28px;
  bottom: 40px;
  background: #fffcedda;
  border: 1px solid #e1d4b6;
  border-radius: 17px;
  padding: 16px 20px;
  min-width: 190px;
  backdrop-filter: blur(5px);
}
.speed-card strong {
  font-size: 36px;
  font-weight: 400;
  letter-spacing: -0.06em;
  line-height: 1;
}
.speed-card strong small {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #bba886;
  letter-spacing: 0;
  margin-left: 10px;
}
.drift-track {
  height: 4px;
  background: #e8dfca;
  overflow: hidden;
  border-radius: 4px;
  margin-top: 12px;
}
.drift-track i {
  display: block;
  background: #c5bc94;
  height: 100%;
}
.drift-track.charged i {
  background: #d9b668;
}
.speed-card > span {
  font:
    7px 'Google Sans Code',
    monospace;
  color: #b39f77;
  display: block;
  margin-top: 9px;
}
.race-toast {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff7e4e8;
  border: 1px solid #dfcea6;
  border-radius: 12px;
  padding: 12px 17px;
  font:
    10px 'Google Sans Code',
    monospace;
  color: #aa8c53;
  max-width: 45%;
  text-align: center;
  pointer-events: none;
}
.wrong-way {
  position: absolute;
  top: 210px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: #a78950;
  background: #fff6e1df;
  border: 1px solid #d7c79f;
  border-radius: 12px;
  padding: 14px 20px;
  text-align: center;
}
.wrong-way button {
  display: block;
  margin: 8px auto 0;
  font:
    8px 'Google Sans Code',
    monospace;
  min-height: 30px;
  color: #ad9870;
}
.countdown-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: #ede6d21a;
}
.countdown-card > span {
  font:
    10px 'Google Sans Code',
    monospace;
  color: #bba16f;
  background: #fff9e8da;
  padding: 10px;
  border-radius: 10px;
}
.countdown-card strong {
  font-size: 140px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.07em;
  color: #b99c5f;
  text-shadow: 0 2px 15px #fff5dd;
  animation: count-pop 500ms ease both;
  margin: 20px;
}
.countdown-card p {
  font:
    9px 'Google Sans Code',
    monospace;
  color: #a48b5c;
  background: #fff9e8c9;
  padding: 10px;
  border-radius: 10px;
}
.cart-overlay {
  position: absolute;
  inset: 0;
  background: #eee9d574;
  backdrop-filter: blur(8px);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}
.pause-card,
.results-card {
  max-width: 510px;
  width: 100%;
  background: #fffdf2f2;
  border: 1px solid #e3d6b9;
  border-radius: 24px;
  box-shadow: 0 15px 60px #72613d20;
  padding: 30px;
  text-align: center;
}
.pause-card > svg {
  width: 85px;
  height: 100px;
  margin: 0 auto 20px;
  transform: rotate(-8deg);
}
.pause-card h2,
.results-card h2 {
  font-size: 32px;
  line-height: 1.15;
  font-weight: 400;
  letter-spacing: -0.05em;
  margin: 15px 0 25px;
}
.quiet-button {
  display: block;
  min-height: 40px;
  margin: 5px auto 0;
  color: #ad9973;
  font-size: 11px;
}
.result-summary {
  display: flex;
  justify-content: center;
  gap: 18px;
  align-items: center;
  margin: 22px auto;
}
.result-summary > svg {
  width: 80px;
  height: 96px;
  transform: rotate(-7deg);
}
.result-summary strong {
  font-size: 55px;
  font-weight: 400;
  color: #b69a5f;
  letter-spacing: -0.065em;
  line-height: 1;
}
.result-summary strong small {
  font-size: 20px;
}
.result-summary p {
  font:
    13px 'Google Sans Code',
    monospace;
  color: #b79c6a;
  margin-top: 10px;
}
.result-summary span {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #b7a17b;
  display: block;
  margin-top: 6px;
}
.race-results {
  list-style: none;
  padding: 0;
  margin: 20px 0;
  text-align: left;
}
.race-results li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  font-size: 11px;
  color: #b19e7c;
  padding: 8px 0;
  border-bottom: 1px solid #ede3cb;
}
.race-results li.self {
  color: #927748;
}
.race-results i {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 7px;
}
.race-results li > span:last-child {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #bbab8d;
}
.results-card > small {
  display: block;
  color: #b9a786;
  font:
    7px/1.7 'Google Sans Code',
    monospace;
  margin-top: 15px;
}
.result-actions {
  display: flex;
  justify-content: center;
  gap: 18px;
  align-items: center;
}
.rescue-button {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 20px;
  min-height: 34px;
  font:
    8px 'Google Sans Code',
    monospace;
  color: #a38c61;
  background: #fff9e0ad;
  border: 1px solid #e6d5b2;
  border-radius: 10px;
  padding: 5px 12px;
}
.touch-steering,
.touch-pedals {
  position: absolute;
  z-index: 9;
  display: flex;
  gap: 10px;
  bottom: 195px;
}
.touch-steering {
  left: 16px;
}
.touch-pedals {
  right: 16px;
}
.touch-steering button,
.touch-pedals button {
  min-width: 52px;
  min-height: 52px;
  border-radius: 50%;
  background: #fff9e6b8;
  border: 1px solid #d7c49b;
  color: #9b8051;
  font-size: 10px;
  touch-action: none;
}
.touch-steering button {
  font-size: 22px;
}
.moon .cart-header {
  color: #ebe0bc;
}
.moon .home-link,
.moon .race-type {
  color: #c4bda5;
}
.moon .cart-brand small {
  color: #a6a3b8;
}
.moon .cart-overlay {
  background: #393a5277;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid #b29b69;
  outline-offset: 4px;
}
@keyframes count-pop {
  from {
    transform: scale(0.8);
    opacity: 0.3;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@media (max-height: 800px) and (min-width: 801px) {
  .menu-intro {
    margin: 5px auto 15px;
  }
  .menu-intro h1 {
    font-size: 44px;
    margin: 10px 0;
  }
  .menu-intro > p:last-child {
    font-size: 11px;
  }
  .track-thumbnail {
    height: 80px;
  }
  .track-card h2 {
    font-size: 21px;
  }
  .track-description {
    font-size: 9px;
    min-height: 46px;
  }
  .race-options {
    margin-top: 18px;
  }
  .cart-menu {
    padding-top: 12px;
  }
  .results-card {
    padding: 22px 28px;
  }
  .results-card h2 {
    font-size: 28px;
    margin: 10px 0 15px;
  }
  .result-summary {
    margin: 15px auto;
  }
  .race-results li {
    padding: 6px 0;
  }
}
@media (max-width: 800px) {
  .cart-header {
    padding: 10px 16px;
    flex-wrap: wrap;
    gap: 6px;
  }
  .home-link {
    font-size: 10px;
  }
  .cart-brand {
    font-size: 8px;
    gap: 7px;
  }
  .cart-brand small {
    font-size: 6px;
  }
  .cart-brand > span {
    font-size: 23px;
  }
  .race-type {
    display: none;
  }
  .cart-menu {
    inset: 85px 12px 12px;
    padding: 18px 15px;
  }
  .menu-intro h1 {
    font-size: 40px;
  }
  .menu-intro > p:last-child {
    font-size: 11px;
  }
  .track-selection {
    gap: 9px;
  }
  .track-card {
    padding: 8px;
    border-radius: 12px;
  }
  .track-thumbnail {
    height: 75px;
  }
  .track-thumbnail > span {
    font-size: 17px;
    right: 6px;
    top: 3px;
  }
  .track-card h2 {
    font-size: 16px;
  }
  .track-card > .eyebrow {
    font-size: 5px;
    min-height: 22px;
  }
  .track-description {
    display: none;
  }
  .track-card small {
    font-size: 6px;
    line-height: 1.6;
    min-height: 35px;
  }
  .race-options {
    flex-wrap: wrap;
    gap: 12px;
    margin: 20px 0 0;
  }
  .driver-preview {
    width: 50px;
    height: 62px;
  }
  .driver-name {
    width: calc(100% - 65px);
  }
  .driver-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  .start-race {
    width: 100%;
    min-height: 48px;
    justify-content: center;
  }
  .menu-controls {
    font-size: 6px;
    gap: 9px;
    margin: 16px 0 0;
  }
  .race-top {
    top: 85px;
    left: 12px;
    right: 12px;
    gap: 8px;
  }
  .position-pill {
    padding: 10px 12px;
  }
  .position-pill strong {
    font-size: 32px;
  }
  .position-pill > span {
    font-size: 6px;
  }
  .lap-pill {
    gap: 7px;
    padding: 10px;
    font-size: 7px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 130px;
  }
  .lap-pill strong {
    font-size: 22px;
  }
  .item-slot {
    width: 88px;
    min-height: 83px;
    padding: 10px 7px;
  }
  .item-slot small {
    font-size: 6px;
  }
  .item-slot kbd {
    font-size: 7px;
    right: 6px;
    top: 6px;
  }
  .race-minimap {
    right: 12px;
    bottom: 43px;
    width: 115px;
    padding: 6px;
  }
  .race-minimap svg {
    height: 100px;
  }
  .race-minimap > span {
    font-size: 5px;
  }
  .speed-card {
    left: 12px;
    bottom: 43px;
    padding: 12px;
    min-width: 155px;
  }
  .speed-card strong {
    font-size: 30px;
  }
  .speed-card strong small {
    font-size: 6px;
  }
  .speed-card > span {
    font-size: 6px;
    max-width: 140px;
  }
  .race-toast {
    bottom: 280px;
    max-width: 85%;
    font-size: 8px;
    white-space: normal;
    min-width: 210px;
  }
  .rescue-button {
    bottom: 5px;
    font-size: 7px;
    min-height: 30px;
  }
  .cart-overlay {
    padding: 14px;
    align-items: flex-start;
    padding-top: 70px;
  }
  .pause-card,
  .results-card {
    padding: 24px 20px;
  }
  .pause-card h2,
  .results-card h2 {
    font-size: 28px;
  }
  .race-results li {
    font-size: 10px;
  }
  .race-results li > span:last-child {
    font-size: 6px;
  }
  .result-actions {
    flex-direction: column;
    gap: 0;
  }
  .result-summary {
    margin: 15px auto;
  }
  .wrong-way {
    top: 200px;
    min-width: 250px;
    font-size: 12px;
  }
  .countdown-card p {
    font-size: 7px;
    max-width: 90%;
    text-align: center;
  }
  .touch-steering,
  .touch-pedals {
    gap: 7px;
    bottom: 200px;
  }
  .touch-pedals button {
    min-width: 46px;
    min-height: 46px;
    font-size: 8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .track-card {
    transition: none;
  }
  .countdown-card strong {
    animation: none;
  }
}
</style>

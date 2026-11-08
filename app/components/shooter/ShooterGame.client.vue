<script setup lang="ts">
import { createPipShooterScene } from '~/utils/pipShooterScene'
import { MAX_PLAYERS, PIP_COLOURS } from '~~/shared/shooter/arena'
import PhotoFriendSprite from '~/components/photography/PhotoFriendSprite.vue'

const game = usePipShooter()
const { status, snapshot, wanted, error, ping, player, id, hit, damaged } = game
const canvas = ref<HTMLCanvasElement>()
const ready = ref(false)
const graphicsError = ref('')
const name = ref('Little Pip')
const colour = ref(0)
const locked = ref(false)
const touch = ref(false)
const scores = ref(false)
const copied = ref(false)
const lookError = ref('')
const keys = new Set<string>()
const colours = ['Honey', 'Sage', 'Cloud', 'Rose', 'Biscuit', 'Mint']
const ranking = computed(() =>
  [...(snapshot.value?.players ?? [])].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths),
)
const seconds = computed(() =>
  Math.max(0, Math.ceil(((snapshot.value?.endsAt ?? 0) - (snapshot.value?.now ?? 0)) / 1000)),
)
const clock = computed(
  () => `${Math.floor(seconds.value / 60)}:${String(seconds.value % 60).padStart(2, '0')}`,
)
const intermission = computed(() => !!snapshot.value?.intermissionUntil)
const countdown = computed(() =>
  Math.max(
    1,
    Math.ceil(
      ((intermission.value ? snapshot.value?.intermissionUntil : player.value?.respawnAt) ?? 0) /
        1000 -
        (snapshot.value?.now ?? 0) / 1000,
    ),
  ),
)
const playing = computed(
  () => wanted.value && (locked.value || touch.value) && status.value === 'online',
)
let scene: ReturnType<typeof createPipShooterScene> | undefined
let animation = 0,
  last = 0,
  yaw = 0,
  pitch = 0,
  firing = false
let touchForward = 0,
  touchStrafe = 0
let touchLook: { id: number; x: number; y: number } | null = null
let copyTimer: ReturnType<typeof setTimeout> | undefined
function reset() {
  scores.value = false
  touchLook = null
  keys.clear()
  touchForward = 0
  touchStrafe = 0
  firing = false
  game.clearInput()
}
async function capture() {
  if (touch.value) return
  try {
    await canvas.value?.requestPointerLock()
    lookError.value = ''
  } catch {
    lookError.value = 'Mouse capture was declined. Click “Resume” to try again.'
  }
}
function join() {
  try {
    localStorage.setItem(
      'pip-shooter-identity',
      JSON.stringify({ name: name.value, colour: colour.value }),
    )
  } catch {
    /* The lobby also works without storage. */
  }
  game.join(name.value, colour.value)
  capture()
}
function leave() {
  reset()
  game.leave()
}
function pointerLockChanged() {
  locked.value = document.pointerLockElement === canvas.value
  if (!locked.value) reset()
}
function mouseMove(event: MouseEvent) {
  if (locked.value) {
    yaw -= event.movementX * 0.0022
    pitch = Math.max(-1.35, Math.min(1.35, pitch - event.movementY * 0.0022))
  }
}
function keyDown(event: KeyboardEvent) {
  if (!playing.value) return
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
      'Tab',
    ].includes(event.code)
  )
    event.preventDefault()
  keys.add(event.code)
  if (event.code === 'Space' && !event.repeat) game.input.jump = true
  if (event.code === 'Tab') scores.value = true
}
function keyUp(event: KeyboardEvent) {
  keys.delete(event.code)
  if (event.code === 'Tab') scores.value = false
}
function pointerDown(event: PointerEvent) {
  if (event.pointerType === 'touch' || !wanted.value || event.button !== 0) return
  if (!locked.value) capture()
  else firing = true
}
function beginLook(event: PointerEvent) {
  if (!touch.value || !wanted.value) return
  touchLook = { id: event.pointerId, x: event.clientX, y: event.clientY }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function moveLook(event: PointerEvent) {
  if (!touchLook || touchLook.id !== event.pointerId) return
  yaw -= (event.clientX - touchLook.x) * 0.005
  pitch = Math.max(-1.35, Math.min(1.35, pitch - (event.clientY - touchLook.y) * 0.005))
  touchLook.x = event.clientX
  touchLook.y = event.clientY
}
function stopTouch() {
  touchForward = 0
  touchStrafe = 0
}
function moveTouch(event: PointerEvent, forward: number, strafe: number) {
  touchForward = forward
  touchStrafe = strafe
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/shooter`)
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    lookError.value = 'Share this page’s URL to invite a friend.'
  }
}
function render(now: number) {
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016)
  last = now
  const alive = player.value && player.value.health > 0
  game.input.forward =
    playing.value && alive
      ? touchForward +
        Number(keys.has('KeyW') || keys.has('ArrowUp')) -
        Number(keys.has('KeyS') || keys.has('ArrowDown'))
      : 0
  game.input.strafe =
    playing.value && alive
      ? touchStrafe +
        Number(keys.has('KeyD') || keys.has('ArrowRight')) -
        Number(keys.has('KeyA') || keys.has('ArrowLeft'))
      : 0
  game.input.yaw = yaw
  game.input.pitch = pitch
  game.input.sprint = playing.value && (keys.has('ShiftLeft') || keys.has('ShiftRight'))
  game.input.fire = !!(playing.value && alive && firing)
  scene?.draw(
    snapshot.value,
    id.value,
    yaw,
    pitch,
    dt,
    now / 1000,
    game.consumeShots(),
    playing.value,
  )
  animation = requestAnimationFrame(render)
}
onMounted(() => {
  touch.value = window.matchMedia('(pointer: coarse)').matches
  try {
    const saved = JSON.parse(localStorage.getItem('pip-shooter-identity') || 'null')
    if (saved && typeof saved.name === 'string') name.value = saved.name.slice(0, 20)
    if (Number.isInteger(saved?.colour) && saved.colour >= 0 && saved.colour < 6)
      colour.value = saved.colour
  } catch {
    /* A fresh little identity is fine. */
  }
  try {
    scene = createPipShooterScene(canvas.value!)
    ready.value = true
    animation = requestAnimationFrame(render)
  } catch {
    graphicsError.value =
      'This browser couldn’t open the 3D garden. Please try a browser with WebGL 2 enabled.'
  }
})
useEventListener(document, 'pointerlockchange', pointerLockChanged)
useEventListener('mousemove', mouseMove)
useEventListener('keydown', keyDown)
useEventListener('keyup', keyUp)
useEventListener('pointerup', (event: PointerEvent) => {
  if (event.pointerType !== 'touch') firing = false
})
useEventListener('blur', reset)
useEventListener(document, 'visibilitychange', () => {
  if (document.hidden) reset()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(animation)
  clearTimeout(copyTimer)
  scene?.dispose()
})
</script>

<template>
  <main class="shooter-game" :class="{ 'is-playing': playing, damaged, 'touch-mode': touch }">
    <canvas
      ref="canvas"
      class="arena-canvas"
      aria-label="The Paper Garden, a 3D multiplayer free-for-all"
      @pointerdown="pointerDown"
      @contextmenu.prevent
    />
    <header class="garden-header">
      <NuxtLink to="/" class="back-home" @click="leave">↖ Julian Gojani</NuxtLink>
      <div class="garden-brand">
        <span class="brand-flower">✳</span>
        <div>THE PAPER GARDEN<small>public lobby · free-for-all</small></div>
      </div>
      <span class="connection" :class="status"
        ><i />{{
          status === 'online'
            ? `${snapshot?.players.length ?? 0} / ${MAX_PLAYERS} in the garden`
            : status === 'connecting'
              ? 'finding the garden…'
              : 'reconnecting…'
        }}</span
      >
    </header>
    <div v-if="!wanted" class="lobby-layout">
      <section class="lobby-card">
        <p class="eyebrow">A VERY SMALL MULTIPLAYER SHOOTER</p>
        <h1>Pip, pip.<br /><span>Flash.</span></h1>
        <p class="lobby-copy">
          A paper garden. A pocket-sized camera.<br />Everyone is a friend. Everyone is also a
          target.
        </p>
        <div class="identity">
          <div class="identity-pip" :style="{ '--pip-tint': PIP_COLOURS[colour] }">
            <PhotoFriendSprite />
          </div>
          <div>
            <label for="pip-name">Your little name</label
            ><input
              id="pip-name"
              v-model="name"
              maxlength="20"
              autocomplete="nickname"
              placeholder="Little Pip"
              @keydown.enter="ready && status === 'online' && join()"
            />
            <div class="colour-picker" role="group" aria-label="Pip colour">
              <button
                v-for="(tint, index) in PIP_COLOURS"
                :key="tint"
                :style="{ background: tint }"
                :aria-label="colours[index]"
                :aria-pressed="colour === index"
                :class="{ selected: colour === index }"
                @click="colour = index"
              />
            </div>
          </div>
        </div>
        <button
          class="join-button"
          :disabled="
            !ready || status !== 'online' || (snapshot?.players.length ?? 0) >= MAX_PLAYERS
          "
          @click="join"
        >
          {{
            graphicsError
              ? 'The 3D garden is unavailable'
              : !ready
                ? 'Unfolding the garden…'
                : status !== 'online'
                  ? 'Connecting to the garden…'
                  : (snapshot?.players.length ?? 0) >= MAX_PLAYERS
                    ? 'The garden is full. A little patience.'
                    : 'Unfold into the garden'
          }}
          <span>↗</span>
        </button>
        <p v-if="error || graphicsError" class="lobby-error" role="alert">
          {{ graphicsError || error }}
        </p>
        <footer>
          <span>3-minute rounds · {{ MAX_PLAYERS }} places · instant respawns</span
          ><button @click="copyLink">
            {{ copied ? 'Link copied. Bring a friend ♡' : 'Invite a friend ↗' }}
          </button>
        </footer>
      </section>
      <aside class="lobby-notes">
        <span class="note-pin" />
        <p class="eyebrow">A NOTE BEFORE YOU HOP IN</p>
        <h2>Keep the good light.<br />Share the little chaos.</h2>
        <dl>
          <div>
            <dt>W A S D</dt>
            <dd>Wander around</dd>
          </div>
          <div>
            <dt>Mouse</dt>
            <dd>Look around</dd>
          </div>
          <div>
            <dt>Click / hold</dt>
            <dd>Send a little flash</dd>
          </div>
          <div>
            <dt>Space</dt>
            <dd>Hop onto the paper stacks</dd>
          </div>
          <div>
            <dt>Shift</dt>
            <dd>Hurry a little</dd>
          </div>
          <div>
            <dt>Tab · Esc</dt>
            <dd>Scores · release the mouse</dd>
          </div>
        </dl>
        <p>
          Four flashes make a tag.<br />A tiny tumble, then you’re back.<br />Health grows back
          after a quiet moment.
        </p>
        <small v-if="!snapshot?.players.length"
          >The garden is quiet. Be its first little visitor,<br />then share the link to start the
          mischief.</small
        ><small v-else>{{ snapshot?.players.map((p) => p.name).join(' · ') }}</small>
      </aside>
    </div>
    <template v-else>
      <div class="round-pill">
        round {{ snapshot?.round ?? 1 }} <span>{{ clock }}</span
        ><button aria-label="Show scoreboard" @click="scores = !scores">▤</button>
      </div>
      <div
        v-if="playing && player?.health && !intermission"
        class="crosshair"
        :class="{ hit }"
        aria-hidden="true"
      >
        <i /><i /><i /><i /><b v-if="hit">×</b>
      </div>
      <div class="player-hud">
        <div>
          <span class="hud-label">{{ player?.name ?? name }}</span
          ><strong>{{ Math.ceil(player?.health ?? 100) }}<small>/ 100</small></strong>
          <div class="health-track"><i :style="{ width: `${player?.health ?? 100}%` }" /></div>
        </div>
        <div class="tags">
          <strong>{{ player?.kills ?? 0 }}</strong
          ><span>little tags</span>
        </div>
        <button @click="leave">Pack the camera ↗</button>
      </div>
      <div class="event-feed" aria-live="polite">
        <p v-for="event in snapshot?.events.slice(-3)" :key="event.id">{{ event.text }}</p>
      </div>
      <div class="network-note">
        {{ ping }} ms <span>·</span>
        {{ touch ? 'drag the right side to look' : 'WASD · Space · Shift · Tab' }}
      </div>
      <div v-if="status !== 'online'" class="centre-card" role="status">
        <span>⌁</span>
        <h2>A little connection hiccup.</h2>
        <p>Finding the public garden again…</p>
      </div>
      <div v-else-if="intermission" class="centre-card">
        <span>✧</span>
        <p class="eyebrow">A MOMENT TO DEVELOP THE PHOTOS</p>
        <h2>{{ ranking[0]?.name ?? 'The garden' }} kept<br />the brightest little album.</h2>
        <p>A new round unfolds in {{ countdown }}…</p>
      </div>
      <div v-else-if="player && player.health <= 0" class="centre-card respawn-card" role="status">
        <PhotoFriendSprite />
        <h2>A very tiny tumble.</h2>
        <p>Back on your little feet in {{ countdown }}…</p>
      </div>
      <div v-else-if="!locked && !touch" class="centre-card">
        <span>⌑</span>
        <h2>The garden is still going.</h2>
        <p>Your Pip is still in the arena.</p>
        <button class="resume-button" @click="capture">Resume with the mouse ↗</button
        ><button class="quiet-button" @click="leave">Back to the lobby</button
        ><small v-if="lookError">{{ lookError }}</small>
      </div>
      <div
        v-if="player && player.shieldUntil > (snapshot?.now ?? 0) && !intermission"
        class="spawn-note"
      >
        A little breathing room. Your camera wakes up in a moment.
      </div>
      <aside v-if="scores || intermission" class="scoreboard">
        <h2>
          The little leaderboard <span>round {{ snapshot?.round }}</span>
        </h2>
        <div class="score-head"><span>Visitor</span><span>Tags</span><span>Tumbles</span></div>
        <div
          v-for="(visitor, index) in ranking"
          :key="visitor.id"
          class="score-row"
          :class="{ self: visitor.id === id }"
        >
          <span
            ><i :style="{ background: PIP_COLOURS[visitor.colour] }" />{{ index + 1 }}.
            {{ visitor.name }}</span
          ><b>{{ visitor.kills }}</b
          ><span>{{ visitor.deaths }}</span>
        </div>
        <button @click="scores = false">
          {{ intermission ? 'The next page is coming…' : 'Close the little album' }}
        </button>
      </aside>
      <template v-if="touch && !intermission"
        ><div
          class="touch-look"
          aria-label="Drag to look around"
          @pointerdown.prevent="beginLook"
          @pointermove.prevent="moveLook"
          @pointerup="touchLook = null"
          @pointercancel="touchLook = null"
        />
        <div class="touch-movement">
          <button
            aria-label="Move forward"
            @pointerdown.prevent="moveTouch($event, 1, 0)"
            @pointerup="stopTouch()"
            @pointercancel="stopTouch()"
          >
            ↑</button
          ><button
            aria-label="Move left"
            @pointerdown.prevent="moveTouch($event, 0, -1)"
            @pointerup="stopTouch()"
            @pointercancel="stopTouch()"
          >
            ←</button
          ><button
            aria-label="Move backward"
            @pointerdown.prevent="moveTouch($event, -1, 0)"
            @pointerup="stopTouch()"
            @pointercancel="stopTouch()"
          >
            ↓</button
          ><button
            aria-label="Move right"
            @pointerdown.prevent="moveTouch($event, 0, 1)"
            @pointerup="stopTouch()"
            @pointercancel="stopTouch()"
          >
            →
          </button>
        </div>
        <div class="touch-actions">
          <button aria-label="Jump" @pointerdown.prevent="game.input.jump = true">Hop ↑</button
          ><button
            class="touch-fire"
            aria-label="Hold to shoot"
            @pointerdown.prevent="firing = true"
            @pointerup="firing = false"
            @pointerleave="firing = false"
            @pointercancel="firing = false"
          >
            ⌑<small>flash</small>
          </button>
        </div></template
      >
    </template>
  </main>
</template>

<style scoped>
.shooter-game {
  position: fixed;
  inset: 0;
  overflow: hidden;
  color: #70624b;
  background: #e9e9dc;
  font-family: 'Google Sans', sans-serif;
}
.arena-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  outline: none;
}
.garden-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 28px;
  z-index: 12;
  pointer-events: none;
}
.garden-header a,
.garden-header button {
  pointer-events: auto;
}
.back-home {
  min-height: 44px;
  display: flex;
  align-items: center;
  color: #81735a;
  font-size: 13px;
  text-decoration: none;
}
.garden-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font:
    10px 'Google Sans Code',
    monospace;
  letter-spacing: 0.09em;
}
.brand-flower {
  font-size: 30px;
  color: #a89667;
}
.garden-brand small {
  display: block;
  margin-top: 5px;
  color: #9e9278;
  font-size: 8px;
  letter-spacing: 0.02em;
}
.connection {
  font:
    9px 'Google Sans Code',
    monospace;
  color: #a1957c;
  display: flex;
  align-items: center;
  gap: 7px;
}
.connection i {
  width: 5px;
  height: 5px;
  background: #b6a98b;
  border-radius: 50%;
}
.connection.online i {
  background: #91a67b;
}
.lobby-layout {
  position: absolute;
  inset: 90px 5vw 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 36px;
  pointer-events: none;
}
.lobby-card {
  pointer-events: auto;
  width: 440px;
  max-width: 100%;
  background: #fffdf2ed;
  border: 1px solid #e4dcc6;
  border-radius: 23px;
  box-shadow: 0 15px 60px #6c62451a;
  padding: 32px;
  backdrop-filter: blur(10px);
}
.eyebrow {
  font:
    8px/1.8 'Google Sans Code',
    monospace;
  letter-spacing: 0.08em;
  color: #b1a17e;
}
h1 {
  font-size: clamp(56px, 6.5vw, 94px);
  font-weight: 400;
  letter-spacing: -0.075em;
  line-height: 0.94;
  margin: 22px 0;
}
h1 span {
  color: #baa06c;
}
.lobby-copy {
  font-size: 13px;
  line-height: 1.85;
  color: #a3967b;
}
.identity {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 22px 0;
}
.identity-pip {
  width: 72px;
  height: 86px;
  flex-shrink: 0;
  border-radius: 45%;
  background: var(--pip-tint);
  transform: rotate(-6deg);
}
.identity-pip svg {
  width: 100%;
  height: 100%;
}
.identity > div:last-child {
  flex: 1;
  min-width: 0;
}
.identity label {
  display: block;
  font:
    9px 'Google Sans Code',
    monospace;
  color: #ab9b7c;
  margin-bottom: 8px;
}
.identity input {
  width: 100%;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #ded2b7;
  color: #8e7a57;
  padding: 7px 0;
  font-size: 16px;
  border-radius: 0;
  outline-offset: 4px;
}
.colour-picker {
  display: flex;
  gap: 10px;
  margin-top: 13px;
}
.colour-picker button {
  width: 22px;
  height: 22px;
  border: 2px solid #fff9ee;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #d9cfb9;
}
.colour-picker .selected {
  box-shadow: 0 0 0 2px #a99872;
  transform: scale(1.12);
}
.join-button,
.resume-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  min-height: 48px;
  padding: 12px 16px;
  border: 1px solid #d9c69c;
  border-radius: 12px;
  background: #eddfba;
  color: #8e764d;
  font-size: 13px;
}
.join-button:disabled {
  opacity: 0.55;
  cursor: wait;
}
.lobby-card footer {
  margin-top: 18px;
  font:
    8px/1.9 'Google Sans Code',
    monospace;
  color: #b1a185;
}
.lobby-card footer button {
  display: block;
  min-height: 35px;
  font-size: 10px;
  color: #a18b60;
}
.lobby-error {
  font-size: 11px;
  line-height: 1.8;
  color: #a17e61;
  margin-top: 12px;
}
.lobby-notes {
  pointer-events: auto;
  position: relative;
  background: #fffdf0dd;
  border: 1px solid #dfd6bf;
  box-shadow: 0 7px 30px #70644814;
  padding: 30px;
  transform: rotate(3deg);
  width: 290px;
  margin-right: 2vw;
  align-self: flex-end;
  margin-bottom: 40px;
  backdrop-filter: blur(6px);
}
.note-pin {
  position: absolute;
  top: -8px;
  left: 46%;
  width: 55px;
  height: 19px;
  background: #e5d7b577;
  transform: rotate(-10deg);
}
.lobby-notes h2 {
  font-size: 23px;
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 1.25;
  margin: 15px 0 20px;
}
.lobby-notes dl > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 12px 0;
}
.lobby-notes dt {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #ab9a78;
}
.lobby-notes dd {
  font-size: 11px;
  color: #ac9c80;
}
.lobby-notes > p:not(.eyebrow) {
  margin-top: 24px;
  font-size: 11px;
  line-height: 1.9;
  color: #a7977a;
}
.lobby-notes small {
  display: block;
  margin-top: 22px;
  font:
    8px/1.9 'Google Sans Code',
    monospace;
  color: #b3a68a;
}
.round-pill {
  position: absolute;
  top: 90px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 18px;
  align-items: center;
  background: #fffdf0e6;
  border: 1px solid #dfd5bd;
  border-radius: 100px;
  padding: 9px 18px;
  font:
    9px 'Google Sans Code',
    monospace;
  z-index: 8;
}
.round-pill > span {
  font-size: 17px;
  color: #998254;
}
.round-pill button {
  min-width: 28px;
  min-height: 28px;
}
.player-hud {
  position: absolute;
  bottom: 34px;
  left: 32px;
  display: flex;
  gap: 25px;
  align-items: end;
  z-index: 8;
  background: #fffdf0da;
  backdrop-filter: blur(5px);
  padding: 18px 22px;
  border: 1px solid #e0d6bd;
  border-radius: 16px;
}
.hud-label {
  display: block;
  font:
    9px 'Google Sans Code',
    monospace;
  color: #a89979;
  margin-bottom: 8px;
}
.player-hud strong {
  font-size: 30px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.05em;
}
.player-hud strong small {
  font:
    10px 'Google Sans Code',
    monospace;
  color: #bbad91;
  margin-left: 7px;
}
.health-track {
  width: 130px;
  height: 3px;
  background: #e5ddc8;
  border-radius: 3px;
  margin-top: 10px;
}
.health-track i {
  display: block;
  height: 100%;
  background: #b2be8c;
  transition: width 150ms;
}
.tags {
  text-align: center;
}
.tags span {
  display: block;
  font:
    8px 'Google Sans Code',
    monospace;
  margin-top: 8px;
  color: #b5a587;
}
.player-hud > button {
  min-height: 36px;
  font-size: 9px;
  color: #ad9a74;
}
.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 6;
}
.crosshair i {
  position: absolute;
  background: #70664cc9;
  box-shadow: 0 0 2px #fff8e8;
}
.crosshair i:nth-child(1),
.crosshair i:nth-child(2) {
  width: 1px;
  height: 6px;
  left: 12px;
}
.crosshair i:nth-child(1) {
  top: 0;
}
.crosshair i:nth-child(2) {
  bottom: 0;
}
.crosshair i:nth-child(3),
.crosshair i:nth-child(4) {
  height: 1px;
  width: 6px;
  top: 12px;
}
.crosshair i:nth-child(3) {
  left: 0;
}
.crosshair i:nth-child(4) {
  right: 0;
}
.crosshair b {
  position: absolute;
  inset: -4px;
  display: grid;
  place-items: center;
  color: #a47c36;
  font-weight: 400;
  font-size: 31px;
}
.event-feed {
  position: absolute;
  right: 28px;
  bottom: 55px;
  text-align: right;
  max-width: 330px;
  pointer-events: none;
}
.event-feed p {
  font:
    8px/1.8 'Google Sans Code',
    monospace;
  color: #8e8065;
  margin-top: 7px;
  background: #fffdf0c9;
  padding: 5px 10px;
  border-radius: 7px;
}
.network-note {
  position: absolute;
  bottom: 15px;
  right: 28px;
  font:
    8px 'Google Sans Code',
    monospace;
  color: #a0957e;
}
.network-note span {
  margin: 0 8px;
}
.centre-card {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 15;
  width: 370px;
  max-width: calc(100vw - 32px);
  padding: 26px 30px;
  text-align: center;
  background: #fffdf0ee;
  border: 1px solid #e2d5b8;
  border-radius: 20px;
  backdrop-filter: blur(9px);
  box-shadow: 0 10px 50px #7c6a441a;
}
.centre-card > span {
  display: block;
  font-size: 38px;
  color: #baa36f;
  margin-bottom: 14px;
}
.centre-card h2 {
  font-size: 28px;
  line-height: 1.2;
  font-weight: 400;
  letter-spacing: -0.05em;
}
.centre-card p:not(.eyebrow) {
  font-size: 12px;
  line-height: 1.8;
  color: #aa9878;
  margin-top: 13px;
}
.centre-card .eyebrow {
  margin-bottom: 13px;
}
.resume-button {
  margin-top: 22px;
  justify-content: center;
}
.quiet-button {
  font-size: 11px;
  color: #ac9a76;
  display: block;
  margin: 8px auto 0;
  min-height: 35px;
}
.centre-card small {
  display: block;
  font-size: 10px;
  line-height: 1.8;
  color: #b09771;
  margin-top: 12px;
}
.respawn-card > svg {
  width: 65px;
  height: 80px;
  margin: 0 auto 15px;
  transform: rotate(-20deg);
}
.spawn-note {
  position: absolute;
  bottom: 155px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 80%;
  text-align: center;
  font:
    9px/1.8 'Google Sans Code',
    monospace;
  color: #aa9970;
  background: #fffdf0b8;
  padding: 8px 15px;
  border-radius: 10px;
  pointer-events: none;
}
.scoreboard {
  position: absolute;
  right: 30px;
  top: 150px;
  z-index: 20;
  width: 340px;
  max-width: calc(100vw - 32px);
  padding: 20px;
  background: #fffdf0f2;
  border: 1px solid #dfd4b9;
  border-radius: 18px;
  backdrop-filter: blur(8px);
}
.scoreboard h2 {
  font-size: 18px;
  font-weight: 400;
  letter-spacing: -0.04em;
  margin-bottom: 20px;
}
.scoreboard h2 > span {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #b8a581;
  float: right;
  margin-top: 6px;
}
.score-head,
.score-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px 48px;
  gap: 10px;
  align-items: center;
}
.score-head {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #b9aa8e;
  margin-bottom: 10px;
}
.score-row {
  padding: 10px 0;
  border-bottom: 1px solid #eee6d2;
  font-size: 11px;
  color: #ab9978;
}
.score-row > span:first-child {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.score-row i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.score-row b {
  font:
    11px 'Google Sans Code',
    monospace;
  font-weight: 400;
}
.score-row.self {
  color: #8b784d;
}
.scoreboard > button {
  display: block;
  margin: 15px auto 0;
  min-height: 30px;
  color: #b09d79;
  font-size: 10px;
}
.shooter-game::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 7;
  box-shadow: inset 0 0 140px #c7916940;
  opacity: 0;
  transition: opacity 100ms;
}
.damaged::after {
  opacity: 1;
}
.touch-look {
  position: absolute;
  right: 0;
  top: 110px;
  bottom: 140px;
  width: 60%;
  touch-action: none;
  z-index: 4;
}
.touch-movement {
  position: absolute;
  bottom: 155px;
  left: 20px;
  display: grid;
  grid-template-columns: repeat(3, 46px);
  gap: 5px;
  z-index: 10;
}
.touch-movement button,
.touch-actions button {
  background: #fffdf1b8;
  border: 1px solid #d8cbae;
  border-radius: 50%;
  color: #9f8b62;
  min-width: 46px;
  min-height: 46px;
  touch-action: none;
}
.touch-movement button:first-child {
  grid-column: 2;
}
.touch-movement button:nth-child(2) {
  grid-column: 1;
}
.touch-actions {
  position: absolute;
  right: 20px;
  bottom: 150px;
  display: flex;
  gap: 14px;
  align-items: center;
  z-index: 10;
}
.touch-actions .touch-fire {
  width: 72px;
  height: 72px;
  font-size: 28px;
}
.touch-fire small {
  display: block;
  font:
    8px 'Google Sans Code',
    monospace;
}
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid #b09b6c;
  outline-offset: 4px;
}
@media (max-height: 760px) and (min-width: 801px) {
  .lobby-layout {
    top: 80px;
    bottom: 20px;
  }
  .lobby-card {
    padding: 24px 28px;
  }
  .lobby-card h1 {
    font-size: 68px;
    margin: 16px 0;
  }
  .identity {
    margin: 14px 0;
  }
  .lobby-card footer {
    margin-top: 10px;
  }
  .lobby-notes {
    margin-bottom: 15px;
    padding: 24px;
  }
}
@media (max-width: 800px) {
  .garden-header {
    padding: 10px 16px;
    flex-wrap: wrap;
    gap: 5px;
  }
  .garden-brand {
    order: 1;
  }
  .back-home {
    order: 0;
    font-size: 11px;
  }
  .connection {
    order: 2;
    width: 100%;
    justify-content: center;
    font-size: 8px;
  }
  .lobby-layout {
    inset: 95px 16px 18px;
    justify-content: center;
    overflow-y: auto;
    align-items: start;
  }
  .lobby-card {
    width: 420px;
    padding: 24px;
  }
  .lobby-card h1 {
    font-size: 65px;
    margin: 18px 0;
  }
  .lobby-notes {
    display: none;
  }
  .lobby-copy {
    font-size: 12px;
  }
  .player-hud {
    bottom: 30px;
    left: 12px;
    right: 12px;
    padding: 12px 16px;
    gap: 20px;
    justify-content: space-between;
  }
  .player-hud strong {
    font-size: 25px;
  }
  .health-track {
    width: 100px;
  }
  .event-feed {
    right: 12px;
    bottom: 105px;
    max-width: 250px;
  }
  .event-feed p {
    font-size: 7px;
  }
  .network-note {
    right: 12px;
    bottom: 10px;
    font-size: 7px;
  }
  .round-pill {
    top: 100px;
  }
  .scoreboard {
    right: 16px;
    top: 145px;
  }
  .touch-mode .event-feed {
    display: none;
  }
  .spawn-note {
    bottom: 245px;
    font-size: 8px;
  }
  .centre-card h2 {
    font-size: 25px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .health-track i,
  .shooter-game::after {
    transition: none;
  }
}
</style>

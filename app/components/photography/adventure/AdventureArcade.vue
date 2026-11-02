<script setup lang="ts">
import type { MiniKind } from '~/data/adventureJourney'
import type { MiniResult } from '~/utils/adventureProgress'
import {
  createCatchRound,
  catchDuration,
  stepCatch,
  shuffledPostcards,
  createRhythmRound,
  stepRhythm,
  tapFirefly,
  FIREFLY_BEATS,
  FIREFLY_DURATION,
} from '~/utils/adventureArcade'
import PhotoFriendSprite from '../PhotoFriendSprite.vue'
const props = defineProps<{ kind: MiniKind; title: string }>()
const emit = defineEmits<{
  complete: [result: MiniResult]
  record: [result: MiniResult]
  back: []
}>()
const phase = ref<'intro' | 'playing' | 'paused' | 'won' | 'lost'>('intro')
const gentle = ref(false)
const sky = ref(createCatchRound())
const rhythm = ref(createRhythmRound())
const cards = ref<string[]>([])
const flipped = ref<number[]>([])
const matched = ref<string[]>([])
const attempts = ref(0)
const root = ref<HTMLElement>()
const direction = ref(0)
const target = ref(50)
const visibility = useDocumentVisibility()
let animation = 0
let last = 0
let mismatch: ReturnType<typeof setTimeout> | undefined
const instructions = {
  catch:
    'The sky has spilled its pockets. Catch at least 7 sunbeams in Pip’s little basket. Let the rainclouds fall past: they cost one sunbeam.',
  pairs:
    'Gust mixed up six pairs of postcards. Turn over two at a time and find all the matching memories. There is no timer. Take a little look, then remember.',
  rhythm:
    'The fireflies are dancing into the camera frame. Press Space or tap the camera just as each glow reaches the centre. Photograph at least 6 of the 12 fireflies.',
}
const result = computed<MiniResult>(() =>
  props.kind === 'catch'
    ? { score: sky.value.score, stars: sky.value.score >= 16 ? 3 : sky.value.score >= 11 ? 2 : 1 }
    : props.kind === 'pairs'
      ? {
          score: Math.max(10, 200 - attempts.value * 5),
          stars: attempts.value <= 8 ? 3 : attempts.value <= 13 ? 2 : 1,
        }
      : {
          score: rhythm.value.hits * 100 + rhythm.value.maxCombo * 10,
          stars: rhythm.value.hits >= 11 ? 3 : rhythm.value.hits >= 9 ? 2 : 1,
        },
)
const remaining = computed(() =>
  Math.max(
    0,
    Math.ceil(
      ((props.kind === 'catch' ? catchDuration(gentle.value) : FIREFLY_DURATION) -
        (props.kind === 'catch' ? sky.value.elapsed : rhythm.value.elapsed)) /
        1000,
    ),
  ),
)

function tick(now: number) {
  if (phase.value !== 'playing') return
  const dt = last ? Math.min(100, now - last) : 0
  last = now
  if (props.kind === 'catch') {
    if (direction.value)
      target.value = Math.max(9, Math.min(91, target.value + direction.value * dt * 0.075))
    sky.value = stepCatch(sky.value, dt, target.value, gentle.value)
    if (sky.value.elapsed >= catchDuration(gentle.value))
      phase.value = sky.value.score >= 7 ? 'won' : 'lost'
  } else if (props.kind === 'rhythm') {
    rhythm.value = stepRhythm(rhythm.value, dt, gentle.value)
    if (rhythm.value.elapsed >= FIREFLY_DURATION)
      phase.value = rhythm.value.hits >= 6 ? 'won' : 'lost'
  }
  if (phase.value === 'playing') animation = requestAnimationFrame(tick)
}
watch(phase, (value) => {
  cancelAnimationFrame(animation)
  last = 0
  direction.value = 0
  if (value === 'won') emit('record', result.value)
  if (value === 'playing' && props.kind !== 'pairs') animation = requestAnimationFrame(tick)
  nextTick(() => root.value?.focus())
})
watch(visibility, (value) => {
  if (value === 'hidden' && phase.value === 'playing') phase.value = 'paused'
})
onBeforeUnmount(() => {
  cancelAnimationFrame(animation)
  clearTimeout(mismatch)
})

function start() {
  clearTimeout(mismatch)
  sky.value = createCatchRound()
  rhythm.value = createRhythmRound()
  cards.value = shuffledPostcards(Date.now())
  flipped.value = []
  matched.value = []
  attempts.value = 0
  target.value = 50
  phase.value = 'playing'
}
function flip(index: number) {
  if (
    phase.value !== 'playing' ||
    flipped.value.length >= 2 ||
    flipped.value.includes(index) ||
    matched.value.includes(cards.value[index]!)
  )
    return
  flipped.value = [...flipped.value, index]
  if (flipped.value.length < 2) return
  attempts.value++
  const [a, b] = flipped.value
  if (cards.value[a!] === cards.value[b!]) {
    matched.value = [...matched.value, cards.value[a!]!]
    flipped.value = []
    if (matched.value.length === 6) phase.value = 'won'
  } else
    mismatch = setTimeout(
      () => {
        flipped.value = []
      },
      gentle.value ? 1300 : 850,
    )
}
function steer(event: PointerEvent) {
  if (phase.value !== 'playing' || !(event.currentTarget instanceof HTMLElement)) return
  const rect = event.currentTarget.getBoundingClientRect()
  target.value = Math.max(9, Math.min(91, ((event.clientX - rect.left) / rect.width) * 100))
  root.value?.focus()
}
function photograph() {
  if (phase.value === 'playing') rhythm.value = tapFirefly(rhythm.value, gentle.value)
}
function onKey(event: KeyboardEvent) {
  const key = event.key.toLowerCase()
  if (key === 'p' && ['playing', 'paused'].includes(phase.value)) {
    event.preventDefault()
    if (!event.repeat) phase.value = phase.value === 'paused' ? 'playing' : 'paused'
    return
  }
  if (phase.value !== 'playing') return
  if (props.kind === 'catch' && ['arrowleft', 'a', 'arrowright', 'd'].includes(key)) {
    event.preventDefault()
    direction.value = ['arrowleft', 'a'].includes(key) ? -1 : 1
  }
  if (props.kind === 'rhythm' && key === ' ' && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault()
    if (!event.repeat) photograph()
  }
}
</script>

<template>
  <section
    ref="root"
    class="arcade"
    data-game-focus
    tabindex="0"
    @keydown="onKey"
    @keyup="direction = 0"
    @focusout="direction = 0"
  >
    <header>
      <p class="arcade-label">A LITTLE DIFFERENT KIND OF ADVENTURE</p>
      <h1 id="adventure-title">{{ title }}</h1>
    </header>
    <div v-if="phase === 'intro'" class="arcade-intro">
      <div class="arcade-mascot">
        <PhotoFriendSprite /><span>{{
          kind === 'catch' ? '✧' : kind === 'pairs' ? '▧' : '♫'
        }}</span>
      </div>
      <p>{{ instructions[kind] }}</p>
      <label class="gentle-option"
        ><input v-model="gentle" type="checkbox" /> A gentler pace
        {{ kind === 'pairs' ? '(more time to look)' : '(a little more room to breathe)' }}</label
      ><button class="arcade-action" @click="start">
        {{
          kind === 'catch'
            ? 'Pockets ready'
            : kind === 'pairs'
              ? 'Shuffle the little album'
              : 'Follow the fireflies'
        }}
        ↗</button
      ><small
        >{{
          kind === 'catch'
            ? '← / → or A / D · move your mouse or finger'
            : kind === 'pairs'
              ? 'Click / tap · Tab and Enter work too'
              : 'Space or tap the camera · follow the glowing frame'
        }}<br />P pauses. Quick rounds restart when you leave; completed scores are kept.</small
      >
    </div>
    <template v-else-if="phase === 'playing' || phase === 'paused'">
      <div class="arcade-stats">
        <span v-if="kind === 'catch'" role="status"
          >✧ {{ sky.score }} / 7 <i>clouds {{ sky.clouds }}</i></span
        ><span v-else-if="kind === 'pairs'" role="status"
          >{{ matched.length }} / 6 pairs <i>{{ attempts }} turns</i></span
        ><span v-else role="status"
          >{{ rhythm.hits }} / 6 photos <i>best streak {{ rhythm.maxCombo }}</i></span
        ><span>{{ kind === 'pairs' ? 'take your time' : `${remaining}s` }}</span
        ><button @click="phase = phase === 'playing' ? 'paused' : 'playing'">
          {{ phase === 'paused' ? 'Resume' : 'Pause' }} <kbd>P</kbd>
        </button>
      </div>
      <div
        class="arcade-field"
        :class="[`mode-${kind}`, { paused: phase === 'paused' }]"
        :inert="phase === 'paused'"
      >
        <div
          v-if="kind === 'catch'"
          class="sky-field"
          @pointermove.prevent="steer"
          @pointerdown.prevent="steer"
        >
          <span class="sky-hill" /><span class="sky-hill far" /><span
            v-for="drop in sky.drops"
            :key="drop.id"
            class="sky-drop"
            :class="{ cloud: drop.cloud }"
            :style="{ left: `${drop.x}%`, top: `${drop.y}%` }"
            aria-hidden="true"
            >{{ drop.cloud ? '☁' : '✧' }}</span
          >
          <div class="catching-pip" :style="{ left: `${sky.x}%` }" aria-hidden="true">
            <PhotoFriendSprite /><span class="little-basket" />
          </div>
          <span class="catching-floor" />
        </div>
        <div v-else-if="kind === 'pairs'" class="postcard-deck">
          <button
            v-for="(symbol, index) in cards"
            :key="index"
            class="memory-postcard"
            :class="{
              revealed: flipped.includes(index) || matched.includes(symbol),
              matched: matched.includes(symbol),
            }"
            :disabled="matched.includes(symbol) || phase !== 'playing'"
            :aria-label="`${matched.includes(symbol) ? 'Matched' : flipped.includes(index) ? symbol : 'Face-down postcard'}, card ${index + 1}`"
            @click="flip(index)"
          >
            <span v-if="flipped.includes(index) || matched.includes(symbol)">{{ symbol }}</span
            ><span v-else class="postcard-back">to Pip,<i>♡</i></span>
          </button>
        </div>
        <div v-else class="firefly-field">
          <div class="firefly-moon" />
          <div class="firefly-hill" />
          <span class="firefly-guide" /><span
            class="camera-window"
            :class="{
              glowing: FIREFLY_BEATS.some(
                (beat, i) =>
                  rhythm.notes[i] === 0 && Math.abs(beat - rhythm.elapsed) < (gentle ? 320 : 190),
              ),
            }"
            aria-hidden="true"
            >⌑</span
          ><template v-for="(beat, i) in FIREFLY_BEATS" :key="i"
            ><span
              v-if="rhythm.notes[i] === 0 && Math.abs(beat - rhythm.elapsed) < 1900"
              class="dancing-firefly"
              :style="{ left: `${50 + (beat - rhythm.elapsed) / 32}%` }"
              aria-hidden="true"
              >✧</span
            ></template
          >
          <div class="firefly-photographer"><PhotoFriendSprite /></div>
          <div class="rhythm-dots" :aria-label="`${rhythm.hits} fireflies photographed`">
            <i
              v-for="(note, index) in rhythm.notes"
              :key="index"
              :class="{ hit: note === 1, missed: note === -1 }"
            />
          </div>
        </div>
      </div>
      <template v-if="phase === 'paused'"
        ><div class="arcade-pause">
          <h2>A little breath.</h2>
          <p>The sky can wait. So can the fireflies.</p>
          <button class="arcade-action" @click="phase = 'playing'">
            Ready for another little moment ↗
          </button>
        </div></template
      >
      <template v-else
        ><p v-if="kind === 'rhythm'" class="rhythm-feedback" role="status">{{ rhythm.feedback }}</p>
        <div v-if="kind === 'rhythm'" class="arcade-touch-controls">
          <button class="arcade-action" @click="photograph">
            ⌑ Take a little photo <kbd>Space</kbd>
          </button>
        </div>
        <div v-if="kind === 'catch'" class="arcade-touch-controls">
          <button
            aria-label="Move basket left"
            @pointerdown.prevent="direction = -1"
            @pointerup="direction = 0"
            @pointerleave="direction = 0"
            @click="target = Math.max(9, target - 15)"
          >
            ←</button
          ><button
            aria-label="Move basket right"
            @pointerdown.prevent="direction = 1"
            @pointerup="direction = 0"
            @pointerleave="direction = 0"
            @click="target = Math.min(91, target + 15)"
          >
            →</button
          ><span>Catch the glows. Leave the clouds.</span>
        </div></template
      >
    </template>
    <div v-else class="arcade-result">
      <div class="result-pip"><PhotoFriendSprite /></div>
      <p class="result-stars">
        {{ phase === 'won' ? '✦'.repeat(result.stars) + '✧'.repeat(3 - result.stars) : '✧ ✧ ✧' }}
      </p>
      <h2>
        {{ phase === 'won' ? 'A little memory, well kept.' : 'Even little skies take practice.' }}
      </h2>
      <p>
        {{
          kind === 'catch'
            ? `${sky.score} sunbeams in your pockets.`
            : kind === 'pairs'
              ? `Six pairs found in ${attempts} turns.`
              : `${rhythm.hits} fireflies photographed. Best streak: ${rhythm.maxCombo}.`
        }}
      </p>
      <p v-if="phase === 'lost'">
        {{
          gentle
            ? 'There is always another little try.'
            : 'Try a gentler pace from the instructions if you like.'
        }}
      </p>
      <button v-if="phase === 'won'" class="arcade-action" @click="emit('complete', result)">
        Keep this memory &amp; return to the atlas ↗</button
      ><button class="arcade-secondary" @click="start">
        {{ phase === 'won' ? 'One more little round' : 'Let’s try again' }}</button
      ><button v-if="phase === 'lost'" class="arcade-secondary" @click="phase = 'intro'">
        Back to the instructions
      </button>
    </div>
    <button class="return-atlas" @click="emit('back')">← Back to the little atlas</button>
  </section>
</template>

<style scoped>
.arcade {
  outline: none;
  max-width: 760px;
  margin: 0 auto;
  position: relative;
}
.arcade > header {
  text-align: center;
  margin: 6px 0 24px;
}
.arcade-label {
  font:
    9px/1.8 'Google Sans Code',
    monospace;
  letter-spacing: 0.05em;
  color: #b0a080;
}
h1 {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 400;
  letter-spacing: -0.055em;
  color: #8a7552;
  margin-top: 8px;
}
.arcade-intro,
.arcade-result {
  text-align: center;
  max-width: 510px;
  margin: 0 auto;
}
.arcade-mascot {
  position: relative;
  width: 100px;
  height: 125px;
  margin: 14px auto 20px;
}
.arcade-mascot span {
  position: absolute;
  right: -20px;
  top: 10px;
  font-size: 32px;
  color: #b69b5f;
}
.arcade-intro > p,
.arcade-result > p {
  font-size: 14px;
  line-height: 1.9;
  color: #a18e70;
}
.gentle-option {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  color: #ad9a7a;
  min-height: 46px;
  margin: 16px 0 4px;
}
.gentle-option input {
  width: 16px;
  height: 16px;
  accent-color: #b5a16e;
}
.arcade-action {
  min-height: 46px;
  border-radius: 12px;
  border: 1px solid #d9c8a1;
  background: #f0e3c4;
  padding: 12px 20px;
  color: #8b7249;
  font-size: 13px;
  margin-top: 12px;
}
.arcade-intro small {
  display: block;
  font:
    9px/1.9 'Google Sans Code',
    monospace;
  color: #b2a286;
  margin: 22px auto 0;
  max-width: 430px;
}
.arcade-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  font:
    11px 'Google Sans Code',
    monospace;
  color: #a89162;
}
.arcade-stats i {
  display: inline-block;
  margin-left: 12px;
  font-style: normal;
  color: #c1b49b;
  font-size: 9px;
}
.arcade-stats button {
  min-height: 44px;
  font:
    11px 'Google Sans',
    sans-serif;
}
kbd {
  font:
    9px 'Google Sans Code',
    monospace;
  margin-left: 8px;
  color: #b6a98d;
}
.arcade-field {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid #e5dfcd;
}
.sky-field {
  height: min(400px, 48dvh);
  min-height: 260px;
  background: #e5ece3;
  position: relative;
  overflow: hidden;
  touch-action: none;
  cursor: none;
}
.sky-hill {
  position: absolute;
  width: 130%;
  height: 45%;
  bottom: -32%;
  left: -30%;
  border-radius: 50%;
  background: #c2d0b1;
}
.sky-hill.far {
  bottom: -29%;
  left: 25%;
  background: #d0dbc1;
}
.sky-drop {
  position: absolute;
  transform: translate(-50%, -50%);
  color: #b69b4c;
  text-shadow: 0 0 12px #e7d48b;
  font-size: 32px;
}
.sky-drop.cloud {
  color: #a7bfc0;
  text-shadow: none;
  font-size: 35px;
}
.catching-pip {
  position: absolute;
  top: 75%;
  width: 65px;
  height: 85px;
  transform: translateX(-50%);
}
.catching-pip > svg {
  width: 100%;
  height: 100%;
}
.little-basket {
  position: absolute;
  top: 25%;
  left: -15%;
  width: 130%;
  height: 27%;
  background: repeating-linear-gradient(90deg, #caba91 0 5px, #d9ccac 6px 8px);
  border: 2px solid #aa9772;
  border-radius: 4px 4px 20px 20px;
  transform: rotate(-5deg);
}
.catching-floor {
  position: absolute;
  left: 5%;
  right: 5%;
  top: 95%;
  height: 1px;
  background: #acb99577;
}
.postcard-deck {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  padding: 24px;
  background: #eeeadd;
  perspective: 800px;
}
.memory-postcard {
  aspect-ratio: 4/4.5;
  border: 6px solid #fffdf6;
  border-bottom-width: 14px;
  background: #d7dfcf;
  box-shadow: 0 3px 8px #8c80521a;
  display: grid;
  place-items: center;
  color: #a59972;
  transform: rotate(-3deg);
  transition:
    transform 220ms,
    background 220ms;
}
.memory-postcard:nth-child(even) {
  transform: rotate(3deg);
}
.memory-postcard.revealed {
  transform: rotate(0) rotateY(0);
  background: #f2e5ba;
  color: #ac8f45;
}
.memory-postcard > span {
  font-size: 38px;
}
.memory-postcard.matched {
  background: #e2e7d0;
  opacity: 0.6;
}
.memory-postcard .postcard-back {
  font:
    10px 'Google Sans Code',
    monospace;
}
.postcard-back i {
  display: block;
  margin-top: 10px;
  font-style: normal;
  font-size: 22px;
}
.firefly-field {
  height: min(340px, 42dvh);
  min-height: 260px;
  position: relative;
  background: #2c3547;
  overflow: hidden;
}
.firefly-moon {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ded5b0;
  right: 14%;
  top: 12%;
  box-shadow: 0 0 40px #e5ddab18;
}
.firefly-hill {
  position: absolute;
  width: 140%;
  height: 50%;
  border-radius: 50%;
  background: #394452;
  bottom: -30%;
  left: -20%;
}
.firefly-guide {
  position: absolute;
  top: 46%;
  left: 0;
  right: 0;
  height: 1px;
  background: #b9b18b22;
}
.camera-window {
  position: absolute;
  top: 46%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 66px;
  height: 68px;
  border: 1px dashed #b4ac8266;
  border-radius: 12px;
  color: #bcb18a55;
  display: grid;
  place-items: center;
  font-size: 40px;
}
.camera-window.glowing {
  border-color: #e6d08c;
  box-shadow: 0 0 25px #e7d48922;
}
.dancing-firefly {
  position: absolute;
  top: 46%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  color: #ebd792;
  text-shadow: 0 0 14px #eedb94;
}
.firefly-photographer {
  position: absolute;
  bottom: 8%;
  left: calc(50% - 30px);
  width: 60px;
  height: 72px;
}
.rhythm-dots {
  position: absolute;
  display: flex;
  justify-content: center;
  gap: 8px;
  left: 0;
  right: 0;
  bottom: 12px;
}
.rhythm-dots i {
  width: 5px;
  height: 5px;
  border: 1px solid #8f91a3;
  border-radius: 50%;
}
.rhythm-dots .hit {
  background: #dbc994;
  border-color: #dbc994;
}
.rhythm-dots .missed {
  opacity: 0.25;
}
.rhythm-feedback {
  text-align: center;
  color: #b0a080;
  font:
    10px/1.9 'Google Sans Code',
    monospace;
  min-height: 25px;
  margin-top: 16px;
}
.arcade-touch-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 14px;
}
.arcade-touch-controls > button:not(.arcade-action) {
  min-width: 48px;
  min-height: 44px;
  border: 1px solid #ded2b6;
  border-radius: 10px;
  color: #a78f60;
}
.arcade-touch-controls > span {
  color: #b6a587;
  font:
    9px 'Google Sans Code',
    monospace;
}
.arcade-pause {
  text-align: center;
  position: absolute;
  inset: 125px 0 60px;
  background: #fffdf3ed;
  backdrop-filter: blur(4px);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}
.arcade-pause h2,
.arcade-result h2 {
  font-size: 28px;
  font-weight: 400;
  letter-spacing: -0.04em;
  color: #9a835a;
  margin: 10px 0;
}
.arcade-pause p {
  font-size: 13px;
  color: #b19e7c;
}
.result-pip {
  width: 90px;
  height: 110px;
  margin: 12px auto;
}
.arcade-result .result-stars {
  font-size: 28px;
  color: #baa05c;
  margin-bottom: 16px;
}
.arcade-secondary,
.return-atlas {
  display: block;
  min-height: 44px;
  margin: 9px auto 0;
  font-size: 12px;
  color: #b3a17d;
}
.return-atlas {
  margin-top: 24px;
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid #ae9767;
  outline-offset: 4px;
}
@media (max-width: 600px) {
  .postcard-deck {
    gap: 10px;
    padding: 16px;
  }
  .memory-postcard {
    border-width: 4px;
    border-bottom-width: 10px;
  }
  .memory-postcard > span {
    font-size: 28px;
  }
  .memory-postcard .postcard-back {
    font-size: 7px;
  }
  .arcade-stats {
    flex-wrap: wrap;
    font-size: 10px;
  }
  .arcade-stats i {
    font-size: 8px;
  }
  .arcade-pause {
    inset: 130px 0 70px;
  }
  .arcade-intro > p {
    font-size: 13px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .memory-postcard {
    transition: none;
  }
}
</style>

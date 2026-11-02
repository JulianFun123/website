<script setup lang="ts">
import { adventureJourney } from '~/data/adventureJourney'
import { stageUnlocked, type JourneyProgress } from '~/utils/adventureProgress'
import PhotoFriendSprite from '../PhotoFriendSprite.vue'
const props = defineProps<{ progress: JourneyProgress }>()
const emit = defineEmits<{ select: [index: number, replay: boolean] }>()
const selected = ref(props.progress.stage)
const stop = computed(() => adventureJourney[selected.value]!)
const unlocked = computed(() => stageUnlocked(selected.value, props.progress))
const finished = computed(() => props.progress.completed.includes(stop.value.id))
const pendingEnding = computed(() => props.progress.checkpoints[stop.value.id]?.screen === 'ending')
const resumable = computed(() => {
  const checkpoint = props.progress.checkpoints[stop.value.id]
  return !!checkpoint && checkpoint.screen !== 'credits'
})
function onKey(event: KeyboardEvent) {
  const keys: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }
  if (event.key in keys) {
    event.preventDefault()
    selected.value = Math.max(
      0,
      Math.min(adventureJourney.length - 1, selected.value + keys[event.key]!),
    )
  }
  if (event.key === 'Enter' && event.target === event.currentTarget && unlocked.value) {
    event.preventDefault()
    emit('select', selected.value, finished.value && !resumable.value)
  }
}
</script>

<template>
  <section
    class="overworld"
    data-game-focus
    tabindex="0"
    @keydown="onKey"
    aria-label="The little atlas. Arrow keys select a place; Enter visits it."
  >
    <header>
      <div>
        <p class="atlas-label">THE OTHER SIDE OF THE ALBUM</p>
        <h1 id="adventure-title">A little atlas of everywhere.</h1>
      </div>
      <span class="atlas-count"
        >{{ progress.completed.length }} / {{ adventureJourney.length }} places remembered</span
      >
    </header>
    <div class="atlas-layout">
      <div class="paper-world">
        <svg class="atlas-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            :points="adventureJourney.map((node) => `${node.x},${node.y}`).join(' ')"
            fill="none"
            stroke="#c5b894"
            stroke-width=".4"
            stroke-dasharray="1 1.2"
          />
        </svg>
        <span class="atlas-cloud cloud-a" aria-hidden="true" /><span
          class="atlas-cloud cloud-b"
          aria-hidden="true"
        /><span class="atlas-compass" aria-hidden="true">N<br />✧</span>
        <button
          v-for="(node, index) in adventureJourney"
          :key="node.id"
          class="world-island"
          :class="{
            selected: selected === index,
            locked: !stageUnlocked(index, progress),
            complete: progress.completed.includes(node.id),
            arcade: node.kind !== 'level',
          }"
          :style="{ left: `${node.x}%`, top: `${node.y}%`, '--tilt': `${index % 2 ? 7 : -7}deg` }"
          :aria-label="`${node.title}. ${progress.completed.includes(node.id) ? 'Completed. Replay available.' : stageUnlocked(index, progress) ? 'Unlocked.' : 'Locked. Complete the previous place first.'}`"
          :aria-pressed="selected === index"
          @click="selected = index"
        >
          <span class="island-surface"
            ><i>{{ stageUnlocked(index, progress) ? node.icon : '·' }}</i
            ><b>{{
              progress.completed.includes(node.id) ? '✓' : String(index + 1).padStart(2, '0')
            }}</b></span
          ><span v-if="selected === index" class="atlas-pip"><PhotoFriendSprite /></span
          ><span v-if="progress.best[node.id]" class="island-stars">{{
            '✦'.repeat(progress.best[node.id]!.stars)
          }}</span>
        </button>
        <span class="world-caption">a few places worth getting a little lost in.</span>
      </div>
      <aside class="destination-card">
        <span class="destination-icon">{{ stop.icon }}</span>
        <p class="atlas-label">
          {{ stop.kind === 'level' ? `PHOTOGRAPH ${stop.level + 1} / 8` : 'A SMALL ARCADE DETOUR' }}
        </p>
        <h2>{{ stop.title }}</h2>
        <p>{{ stop.description }}</p>
        <template v-if="unlocked"
          ><p v-if="progress.best[stop.id]" class="best-score">
            {{ '✦'.repeat(progress.best[stop.id]!.stars) }} · best
            {{ progress.best[stop.id]!.score }}
          </p>
          <button class="visit-button" @click="emit('select', selected, finished && !resumable)">
            {{
              pendingEnding
                ? 'Finish this little story'
                : resumable
                  ? 'Continue here'
                  : finished
                    ? 'Visit again'
                    : progress.checkpoints[stop.id]
                      ? 'Continue here'
                      : 'Let’s go here'
            }}
            ↗</button
          ><button
            v-if="resumable && !pendingEnding"
            class="restart-place"
            @click="emit('select', selected, true)"
          >
            Start this photograph over
          </button></template
        >
        <p v-else class="locked-note">
          A little further down the path.<br />Remember the previous place to unlock this one.
        </p>
        <small
          >Every visit and arcade high score stays in this browser. Earlier places can always be
          replayed.</small
        >
      </aside>
    </div>
  </section>
</template>

<style scoped>
.overworld {
  outline: none;
}
.overworld > header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  margin-bottom: 20px;
}
.atlas-label {
  color: #b0a184;
  font:
    9px/1.7 'Google Sans Code',
    monospace;
  letter-spacing: 0.06em;
}
h1 {
  font-size: clamp(25px, 3.5vw, 38px);
  font-weight: 400;
  letter-spacing: -0.055em;
  margin-top: 8px;
  color: #7b6a4d;
}
.atlas-count {
  font:
    9px/1.8 'Google Sans Code',
    monospace;
  color: #baac92;
  text-align: right;
}
.atlas-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 230px;
  gap: 26px;
}
.paper-world {
  position: relative;
  height: clamp(390px, calc(100dvh - 235px), 590px);
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid #e8dfc9;
  background:
    radial-gradient(ellipse at 20% 22%, #e1e7d5, transparent 45%),
    radial-gradient(ellipse at 80% 72%, #e3dcca, transparent 45%), #f0edde;
  box-shadow: inset 0 0 40px #e4dcc033;
  perspective: 600px;
}
.atlas-path {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.9;
}
.world-island {
  position: absolute;
  width: 74px;
  height: 65px;
  transform: translate(-50%, -50%);
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}
.island-surface {
  position: absolute;
  inset: 3px;
  background: #fffcf1;
  border: 1px solid #d7cbb0;
  border-radius: 12px 16px 13px 17px;
  box-shadow:
    0 5px 0 #cec5ac,
    0 12px 17px #83744919;
  transform: rotateX(20deg) rotateZ(var(--tilt));
  transition:
    transform 250ms,
    box-shadow 250ms;
}
.island-surface i {
  display: block;
  font-style: normal;
  font-size: 28px;
  line-height: 1.3;
  color: #b09a6e;
}
.island-surface b {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #b6a787;
}
.arcade .island-surface {
  background: #e5e9df;
}
.complete .island-surface {
  border-color: #a9b590;
}
.complete .island-surface b {
  color: #8c9b77;
}
.locked {
  opacity: 0.38;
}
.selected .island-surface,
.world-island:hover .island-surface {
  transform: translateY(-5px) rotateX(5deg) rotateZ(0);
  box-shadow:
    0 8px 0 #cec5ac,
    0 15px 22px #83744924;
}
.selected {
  z-index: 3;
}
.atlas-pip {
  position: absolute;
  width: 38px;
  height: 46px;
  left: 16px;
  top: -35px;
  pointer-events: none;
  filter: drop-shadow(0 2px 1px #8c805322);
}
.island-stars {
  position: absolute;
  bottom: -15px;
  left: 0;
  right: 0;
  font-size: 10px;
  color: #b39a59;
}
.atlas-cloud {
  position: absolute;
  width: 130px;
  height: 48px;
  border-radius: 50%;
  background: #fff7;
  pointer-events: none;
}
.cloud-a {
  left: -40px;
  top: 22%;
  transform: rotate(-12deg);
}
.cloud-b {
  right: -35px;
  top: 69%;
  transform: rotate(18deg);
}
.atlas-compass {
  position: absolute;
  top: 12px;
  right: 14px;
  text-align: center;
  color: #c1b28e;
  font:
    9px/1.9 'Google Sans Code',
    monospace;
}
.world-caption {
  position: absolute;
  bottom: 12px;
  left: 20px;
  font:
    8px 'Google Sans Code',
    monospace;
  color: #b1a78e;
}
.destination-card {
  align-self: center;
  padding: 12px 0;
}
.destination-icon {
  font-size: 40px;
  color: #b49c6d;
  display: block;
  margin-bottom: 20px;
}
h2 {
  font-size: 27px;
  line-height: 1.2;
  letter-spacing: -0.045em;
  font-weight: 400;
  margin-top: 10px;
  color: #8d7957;
}
.destination-card > p:not(.atlas-label) {
  font-size: 13px;
  line-height: 1.85;
  color: #a4967c;
  margin-top: 16px;
}
.visit-button {
  margin-top: 24px;
  width: 100%;
  border-radius: 12px;
  padding: 14px;
  background: #eee2c5;
  border: 1px solid #dacbac;
  font-size: 13px;
  color: #8d7650;
}
.restart-place {
  font-size: 11px;
  color: #b2a284;
  min-height: 44px;
  display: block;
  margin: 0 auto;
}
.destination-card small {
  display: block;
  margin-top: 26px;
  font:
    9px/1.9 'Google Sans Code',
    monospace;
  color: #b9ac94;
}
.locked-note {
  border: 1px dashed #dfd4bb;
  padding: 12px;
  border-radius: 10px;
}
button:focus-visible {
  outline: 2px solid #b3a075;
  outline-offset: 4px;
}
@media (max-width: 800px) {
  .atlas-layout {
    grid-template-columns: 1fr;
  }
  .paper-world {
    height: 430px;
  }
  .destination-card {
    padding: 0 10px 10px;
  }
  .destination-icon {
    float: right;
  }
  .destination-card small {
    margin-top: 14px;
  }
  .atlas-count {
    max-width: 95px;
  }
  .world-island {
    width: 62px;
    height: 57px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .island-surface {
    transition: none;
  }
}
</style>

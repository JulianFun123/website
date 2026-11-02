<script setup lang="ts">
import PhotoFriendSprite from './PhotoFriendSprite.vue'
import AdventureBoard from './adventure/AdventureBoard.vue'
import AdventureStory from './adventure/AdventureStory.vue'
import AdventurePal from './adventure/AdventurePal.vue'
import AdventureOverworld from './adventure/AdventureOverworld.vue'
import AdventureArcade from './adventure/AdventureArcade.vue'
import { adventureLevels } from '~/data/photoAdventure'
import { tiles } from '~/utils/photoAdventure'

const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement>()
const surface = ref<HTMLElement>()
const game = usePhotoAdventure()
const {
  chapter,
  stop,
  progress,
  level,
  state,
  screen,
  frame,
  saved,
  journal,
  paused,
  dialogue,
  message,
  flash,
  history,
  sceneFrames,
  storyFrame,
  ready,
  sparks,
} = game
const lock = useScrollLock(import.meta.client ? document.body : null)
const visibility = useDocumentVisibility()
const keepsakes = [
  { icon: '⌁', name: 'Moss’s ribbon', note: 'Someone is waiting for you.' },
  { icon: '♢', name: 'Puddle’s raindrop', note: 'You don’t have to fix every feeling.' },
  { icon: '☾', name: 'Dot’s moon button', note: 'Even the dark has friends.' },
  { icon: '☀', name: 'A photograph of home', note: 'An empty page is an invitation.' },
  { icon: '⌁', name: 'Gust’s postmark', note: 'The wind has somewhere to go.' },
  { icon: '❅', name: 'Flurry’s mitten', note: 'Some memories stay warm in the cold.' },
  { icon: '◎', name: 'Fold’s bookmark', note: 'Two corners of the same story.' },
]
const currentTitle = computed(() =>
  screen.value === 'play' ? level.value.title : 'Pip & the Missing Colours',
)

function close() {
  dialog.value?.close()
}
function dismiss(event: MouseEvent) {
  if (event.target === dialog.value) close()
}
function focusGame() {
  nextTick(() =>
    (surface.value?.querySelector<HTMLElement>('[data-game-focus]') ?? surface.value)?.focus(),
  )
}
function closeOverlay() {
  journal.value = false
  paused.value = false
  dialogue.value = null
  focusGame()
}

onMounted(() => {
  lock.value = true
  dialog.value?.showModal()
  focusGame()
})
onBeforeUnmount(() => {
  lock.value = false
})
watch(screen, focusGame)
watch([journal, paused, dialogue], () =>
  nextTick(() => {
    if (journal.value || paused.value || dialogue.value !== null)
      dialog.value?.querySelector<HTMLButtonElement>('.overlay-focus')?.focus()
    else surface.value?.focus()
  }),
)
watch(visibility, (value) => {
  if (value === 'hidden' && screen.value === 'play') paused.value = true
})
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="adventure-dialog"
      aria-labelledby="adventure-title"
      @close="emit('close')"
      @click="dismiss"
    >
      <section ref="surface" class="adventure-shell" tabindex="-1" @keydown="game.onKey">
        <header class="adventure-header">
          <span class="game-brand">PIP’S LITTLE ALBUM <span aria-hidden="true">✧</span></span>
          <div>
            <button
              v-if="screen !== 'title' && screen !== 'world'"
              aria-label="Open the overworld level selector"
              @click="game.openWorld"
            >
              Atlas ↗
            </button>
            <button
              v-if="screen === 'play'"
              aria-label="Open field notebook (J)"
              @click="journal = true"
            >
              Notebook <kbd>J</kbd></button
            ><button
              v-if="screen === 'play'"
              aria-label="Pause adventure (P)"
              @click="paused = true"
            >
              Ⅱ</button
            ><button
              class="close-adventure"
              aria-label="Save and close Pip’s adventure"
              @click="close"
            >
              ×
            </button>
          </div>
        </header>

        <template v-if="screen === 'title'">
          <div class="adventure-welcome">
            <div class="album-illustration" aria-hidden="true">
              <div class="album-photo photo-a"><img src="/images/photos/1.png" alt="" /></div>
              <div class="album-photo photo-b"><img src="/images/photos/3.png" alt="" /></div>
              <div class="album-pip"><PhotoFriendSprite /></div>
              <span class="album-spark">✧</span
              ><span class="album-letter">to Pip,<br /><i>♡</i></span>
            </div>
            <p class="chapter-label">EIGHT PHOTOGRAPHS. THREE LITTLE DETOURS.</p>
            <h1 id="adventure-title">Pip &amp; the<br /><span>Missing Colours</span></h1>
            <p class="welcome-copy">
              The wind turned a page. The colours disappeared.<br />One very small creature is going
              to find them.
            </p>
            <div class="welcome-actions">
              <button class="warm-button" @click="game.begin(!!saved)">
                {{ saved ? 'Return to the little atlas' : 'Open the little album' }}
                <span aria-hidden="true">↗</span></button
              ><button v-if="saved" class="quiet-button" @click="game.begin()">
                Revisit the first photograph
              </button>
            </div>
            <button v-if="!saved" class="quiet-button" @click="game.openWorld">
              Take a look at the atlas
            </button>
            <p class="save-note">
              A story, a few puzzles, a pocketful of small things.<br />Progress stays in this
              browser. Leave whenever you need.
            </p>
          </div>
        </template>

        <AdventureOverworld
          v-else-if="screen === 'world'"
          :progress="progress"
          @select="game.selectStage"
        />
        <AdventureArcade
          v-else-if="screen === 'minigame' && stop.kind !== 'level'"
          :key="stop.id"
          :kind="stop.kind"
          :title="stop.title"
          @complete="game.completeMini"
          @record="game.recordMini"
          @back="game.openWorld"
        />

        <template v-else-if="screen === 'story' || screen === 'ending'">
          <h1 id="adventure-title" class="story-heading">
            {{ screen === 'ending' ? 'A photograph of home' : level.title }}
          </h1>
          <AdventureStory
            :frame="storyFrame"
            :index="frame"
            :total="sceneFrames.length"
            @next="game.nextFrame"
          />
        </template>

        <template v-else-if="screen === 'play'">
          <div class="play-content" :inert="journal || paused || dialogue !== null">
            <div class="map-column">
              <div class="chapter-heading">
                <div>
                  <p class="chapter-label">{{ level.subtitle }}</p>
                  <h1 id="adventure-title">{{ currentTitle }}</h1>
                </div>
                <span class="chapter-number"
                  >{{ chapter + 1 }}<i>/ {{ adventureLevels.length }}</i></span
                >
              </div>
              <AdventureBoard
                :level="level"
                :state="state"
                :ready="ready"
                :flash="flash"
                @move="game.move"
              />
              <div class="action-row">
                <div class="direction-pad" aria-label="Movement controls">
                  <button aria-label="Hop left" @click="game.move(state.position - 1)">←</button
                  ><button aria-label="Hop up" @click="game.move(state.position - 9)">↑</button
                  ><button aria-label="Hop down" @click="game.move(state.position + 9)">↓</button
                  ><button aria-label="Hop right" @click="game.move(state.position + 1)">→</button>
                </div>
                <button @click="game.interact">Talk / use <kbd>E</kbd></button
                ><button
                  class="camera-button"
                  :aria-label="`Take photo. ${state.cooldown ? `Ready in ${state.cooldown} turns` : 'Ready'}`"
                  @click="game.takePhoto"
                >
                  ⌑ <span>{{ state.cooldown ? `${state.cooldown} beats` : 'Camera' }}</span>
                  <kbd>Space</kbd>
                </button>
              </div>
              <p class="world-message" role="status" aria-live="polite">{{ message }}</p>
            </div>
            <aside class="journey-sidebar">
              <p class="notebook-label">A NOTE TO SELF</p>
              <p class="objective-copy">{{ level.objective }}</p>
              <ul class="chapter-checklist">
                <li v-if="sparks">
                  <span :class="{ done: state.collected.length === sparks }">✧</span
                  ><span
                    >Memory sparks <b>{{ state.collected.length }}/{{ sparks }}</b></span
                  >
                </li>
                <li>
                  <span :class="{ done: state.talked }">♡</span
                  ><span
                    >{{
                      [
                        'Meet Moss',
                        'Meet Puddle',
                        'Meet Dot',
                        'Meet the keeper',
                        'Meet Gust',
                        'Meet Flurry',
                        'Meet Fold',
                        'Meet Tomorrow',
                      ][chapter]
                    }}
                    <b>{{ state.talked ? '✓' : '…' }}</b></span
                  >
                </li>
                <li v-if="chapter === 1">
                  <span :class="{ done: tiles(level, 'P').every((p) => state.crates.includes(p)) }"
                    >▧</span
                  ><span
                    >Brass switches
                    <b
                      >{{ tiles(level, 'P').filter((p) => state.crates.includes(p)).length }}/2</b
                    ></span
                  >
                </li>
                <li v-if="chapter === 2">
                  <span :class="{ done: state.lanterns.length === 3 }">♧</span
                  ><span
                    >Little lanterns <b>{{ state.lanterns.length }}/3</b></span
                  >
                </li>
                <li v-if="chapter === 3">
                  <span :class="{ done: state.sequence === 4 }">☀</span
                  ><span
                    >Awake memories <b>{{ state.sequence }}/4</b></span
                  >
                </li>
              </ul>
              <div v-if="ready" class="ready-note">
                {{
                  tiles(level, 'V').length
                    ? 'The sky remembers. Take the last photograph from the camera mark.'
                    : 'The little door is glowing. This photograph is ready.'
                }}
                ↗
              </div>
              <div class="pocket-inventory">
                <p class="notebook-label">IN YOUR POCKET</p>
                <template v-for="(item, index) in keepsakes" :key="item.name"
                  ><div v-if="chapter > index && index >= chapter - 3">
                    <span>{{ item.icon }}</span>
                    <p>
                      {{ item.name }}<small>{{ item.note }}</small>
                    </p>
                  </div></template
                >
                <p v-if="chapter === 0" class="empty-pocket">
                  A camera. A snack.<br />Room for something lovely.
                </p>
              </div>
              <div class="undo-controls">
                <button :disabled="!history.length" @click="game.undo">Undo <kbd>Z</kbd></button
                ><button @click="game.restart">Restart chapter <kbd>R</kbd></button>
              </div>
              <p class="keyboard-note">
                WASD / arrows to hop<br />E to talk, use or wait<br />Space to take a photograph<br />J
                notebook · P snack break<br />Esc saves and closes
              </p>
            </aside>
          </div>
        </template>

        <template v-else-if="screen === 'credits'">
          <div class="adventure-credits">
            <p class="chapter-label">THE ALBUM REMEMBERS</p>
            <h1 id="adventure-title">A pocketful of home.</h1>
            <div class="finished-album">
              <PhotoFriendSprite /><span>❧　♢　☾　☀</span>
              <p>For all the little things<br />we cared enough to notice.</p>
            </div>
            <p>
              Pip found the colours.<br />But the best things in the album were never colours at
              all.
            </p>
            <div class="credit-keepsakes">
              <span v-for="item in keepsakes.slice(0, chapter)" :key="item.name"
                >{{ item.icon }} {{ item.name }}</span
              >
            </div>
            <button class="warm-button" @click="game.openWorld">
              {{
                chapter === 3
                  ? 'Turn the album over. There’s more. ↗'
                  : 'Back to the little atlas ↗'
              }}</button
            ><button class="quiet-button" @click="game.begin()">
              Turn back to the very first page</button
            ><small>Thank you for keeping a very small creature company.</small>
          </div>
        </template>

        <div v-if="journal" class="game-overlay" role="region" aria-label="Field notebook">
          <div class="notebook-page">
            <button
              class="overlay-close overlay-focus"
              aria-label="Close field notebook"
              @click="closeOverlay"
            >
              ×
            </button>
            <p class="chapter-label">PIP’S FIELD NOTES</p>
            <h2>Things worth remembering.</h2>
            <ol class="journal-chapters">
              <li
                v-for="(entry, index) in adventureLevels"
                :key="entry.title"
                :class="{ future: index > chapter }"
              >
                <span>{{ index < chapter ? '✓' : `${index + 1}.` }}</span>
                <div>
                  <strong>{{
                    index > chapter ? 'A photograph not quite remembered…' : entry.title
                  }}</strong>
                  <p v-if="index === chapter">{{ entry.objective }}</p>
                  <p v-else-if="index < chapter">{{ keepsakes[index]?.note }}</p>
                </div>
              </li>
            </ol>
            <div class="journal-tip">
              <strong>A little help</strong>
              <p>{{ level.dialogue[level.dialogue.length - 1] }}</p>
            </div>
            <p class="keyboard-note">
              Move: arrows / WASD · Talk / use / wait: E<br />Camera: Space · Undo: Z · Restart
              chapter: R<br />Moths move every second hop. A flash buys four safe hops.<br />There
              is no game over. Earlier chapters are safe.
            </p>
            <button class="warm-button" @click="closeOverlay">Back to this little world ↗</button>
          </div>
        </div>

        <div v-else-if="paused" class="game-overlay" role="region" aria-label="Adventure paused">
          <div class="pause-card">
            <PhotoFriendSprite />
            <p class="chapter-label">A VERY IMPORTANT SNACK BREAK</p>
            <h2>Even little adventurers<br />need a moment.</h2>
            <p>The photographs can wait.<br />Your place in the story is safe.</p>
            <button class="warm-button overlay-focus" @click="closeOverlay">
              Ready for another little step ↗</button
            ><button class="quiet-button" @click="close">Save &amp; leave for now</button>
          </div>
        </div>

        <div
          v-else-if="dialogue !== null"
          class="game-overlay dialogue-overlay"
          role="region"
          :aria-label="`Conversation with ${level.friend}`"
        >
          <div class="dialogue-card">
            <div class="dialogue-portrait"><AdventurePal :kind="level.theme" /><span>♡</span></div>
            <p class="chapter-label">{{ level.friend }}</p>
            <p class="dialogue-text">{{ level.dialogue[dialogue] }}</p>
            <div class="dialogue-choices">
              <button v-if="dialogue === 0" class="warm-button overlay-focus" @click="dialogue = 1">
                Tell me a little more</button
              ><button
                :class="dialogue === 0 ? 'quiet-button' : 'warm-button overlay-focus'"
                @click="dialogue = null"
              >
                {{ dialogue === 0 ? 'I’ll give it a try. Promise.' : 'Thank you. I’ve got this.' }}
              </button>
            </div>
            <small>E or Enter to keep talking · Esc to return</small>
          </div>
        </div>
      </section>
    </dialog>
  </Teleport>
</template>

<style scoped>
.adventure-dialog {
  color-scheme: light;
  width: min(1080px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid #e7decc;
  border-radius: 24px;
  background: #fffef9;
  color: #605744;
  box-shadow: 0 25px 100px #28231f40;
}
.adventure-dialog::backdrop {
  background: #24272199;
  backdrop-filter: blur(9px);
}
.adventure-shell {
  position: relative;
  padding: 16px 28px 24px;
  font-family: 'Google Sans', sans-serif;
  outline: none;
}
.adventure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.game-brand,
.chapter-label,
.notebook-label {
  font:
    9px/1.7 'Google Sans Code',
    monospace;
  color: #a89c84;
  letter-spacing: 0.06em;
}
.game-brand span {
  margin-left: 10px;
  color: #c0a269;
  font-size: 15px;
}
.adventure-header > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.adventure-header button {
  min-width: 44px;
  min-height: 44px;
  font-size: 12px;
  color: #9e927b;
  padding-inline: 10px;
}
.adventure-header .close-adventure {
  font-size: 26px;
  padding: 0;
}
kbd {
  font:
    9px 'Google Sans Code',
    monospace;
  color: #b1a58c;
  padding: 3px 5px;
  border: 1px solid #e9e2d3;
  border-radius: 4px;
  margin-left: 5px;
}
h1,
h2 {
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 1.15;
}
.adventure-welcome {
  max-width: 620px;
  text-align: center;
  margin: 0 auto;
  padding: 12px 0 24px;
}
.album-illustration {
  height: 190px;
  width: 290px;
  position: relative;
  margin: 0 auto 28px;
}
.album-photo {
  position: absolute;
  width: 118px;
  height: 150px;
  padding: 8px 8px 24px;
  background: white;
  box-shadow: 0 4px 18px #4f493015;
  top: 10px;
  left: 30px;
  transform: rotate(-14deg);
}
.album-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.75;
  filter: saturate(0.55);
}
.photo-b {
  left: 140px;
  top: 18px;
  transform: rotate(13deg);
}
.album-pip {
  position: absolute;
  width: 92px;
  height: 110px;
  bottom: 0;
  left: 100px;
  transform: rotate(-5deg);
}
.album-spark {
  position: absolute;
  right: 0;
  top: 0;
  color: #bca15e;
  font-size: 28px;
}
.album-letter {
  position: absolute;
  left: 190px;
  bottom: 0;
  padding: 10px 15px;
  background: #f3ecda;
  transform: rotate(8deg);
  font:
    9px 'Google Sans Code',
    monospace;
  color: #b4a382;
}
.album-letter i {
  display: block;
  text-align: center;
  margin-top: 5px;
  font-size: 22px;
}
.adventure-welcome h1 {
  font-size: clamp(36px, 5vw, 56px);
  margin: 12px 0 20px;
}
.adventure-welcome h1 span {
  color: #9c8965;
}
.welcome-copy,
.adventure-credits > p {
  font-size: 14px;
  line-height: 1.85;
  color: #9a8f7b;
}
.welcome-actions {
  margin-top: 26px;
}
.warm-button {
  min-height: 46px;
  padding: 12px 20px;
  background: #f0e5c9;
  border: 1px solid #ded0ad;
  border-radius: 12px;
  color: #7b6945;
  font-size: 13px;
  transition:
    background 180ms,
    transform 180ms;
}
.warm-button:hover {
  background: #ead9af;
  transform: translateY(-1px);
}
.warm-button span {
  margin-left: 15px;
}
.quiet-button {
  display: block;
  margin: 8px auto 0;
  min-height: 44px;
  color: #a29883;
  font-size: 12px;
}
.save-note {
  font:
    9px/1.9 'Google Sans Code',
    monospace;
  color: #b2a78f;
  margin-top: 22px;
}
.story-heading {
  font-size: 26px;
  margin: 8px auto 24px;
  max-width: 670px;
}
.play-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 245px;
  gap: 30px;
}
.map-column {
  min-width: 0;
  max-width: min(100%, calc((100dvh - 260px) * 9 / 7));
  width: 100%;
  margin: 0 auto;
}
.chapter-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.chapter-heading h1 {
  font-size: clamp(23px, 2.7vw, 31px);
  margin-top: 5px;
}
.chapter-number {
  font:
    23px 'Google Sans Code',
    monospace;
  color: #c3b592;
  white-space: nowrap;
}
.chapter-number i {
  font-size: 10px;
  color: #c7bdab;
  font-style: normal;
  margin-left: 5px;
}
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.action-row button {
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid #e8e0cf;
  border-radius: 9px;
  background: #fbf9f1;
  color: #9c8b6b;
  font-size: 11px;
}
.direction-pad {
  display: flex;
  gap: 3px;
}
.direction-pad button {
  padding: 8px;
  min-width: 31px;
  font-size: 17px;
}
.camera-button span {
  margin-left: 4px;
}
.world-message {
  min-height: 42px;
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #aaa08a;
}
.journey-sidebar {
  border-left: 1px solid #ede7da;
  padding: 16px 0 0 25px;
}
.objective-copy {
  font-size: 13px;
  color: #94866d;
  line-height: 1.8;
  margin-top: 14px;
}
.chapter-checklist {
  margin-top: 20px;
  list-style: none;
  padding: 0;
}
.chapter-checklist li {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  color: #b1a68f;
  font-size: 12px;
}
.chapter-checklist li > span:first-child {
  width: 20px;
  font-size: 21px;
  color: #c7bdab;
}
.chapter-checklist li > span:last-child {
  flex: 1;
}
.chapter-checklist b {
  font:
    10px 'Google Sans Code',
    monospace;
  margin-left: 8px;
  font-weight: 400;
}
.chapter-checklist .done {
  color: #a39558 !important;
}
.ready-note {
  font:
    10px/1.8 'Google Sans Code',
    monospace;
  color: #a68e4f;
  border: 1px dashed #d7c896;
  border-radius: 10px;
  padding: 12px;
  margin: 14px 0;
}
.pocket-inventory {
  border-top: 1px solid #ece5d5;
  margin-top: 24px;
  padding-top: 20px;
}
.pocket-inventory > div {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.pocket-inventory > div > span {
  font-size: 24px;
  color: #c0ab7d;
}
.pocket-inventory p:not(.notebook-label) {
  color: #a09176;
  font-size: 11px;
  line-height: 1.7;
}
.pocket-inventory small {
  display: block;
  color: #b6aa93;
  font-size: 9px;
  line-height: 1.7;
  margin-top: 4px;
}
.empty-pocket {
  margin-top: 14px;
}
.undo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 24px;
}
.undo-controls button {
  min-height: 44px;
  font-size: 11px;
  color: #ad9c7e;
}
.undo-controls button:disabled {
  opacity: 0.35;
}
.keyboard-note {
  color: #b4aa97;
  font:
    9px/2 'Google Sans Code',
    monospace;
  margin-top: 12px;
}
.game-overlay {
  position: absolute;
  z-index: 20;
  inset: 0;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #faf7edd9;
  backdrop-filter: blur(7px);
  border-radius: 24px;
}
.notebook-page {
  position: relative;
  max-width: 650px;
  width: 100%;
  padding: 32px;
  background: #fffdf5;
  border: 1px solid #e4dac4;
  border-radius: 7px 18px 18px 7px;
  box-shadow:
    -5px 0 0 #eee6d3,
    0 10px 35px #776c4b14;
}
.overlay-close {
  position: absolute;
  right: 14px;
  top: 10px;
  width: 44px;
  height: 44px;
  color: #af9f7e;
  font-size: 26px;
}
.notebook-page h2,
.pause-card h2 {
  font-size: 30px;
  margin: 12px 0 24px;
}
.journal-chapters {
  list-style: none;
  padding: 0;
}
.journal-chapters li {
  display: flex;
  gap: 16px;
  margin-bottom: 19px;
  color: #a49370;
  font:
    12px 'Google Sans Code',
    monospace;
}
.journal-chapters strong {
  font-family: 'Google Sans', sans-serif;
  font-size: 15px;
  font-weight: 400;
  color: #918164;
}
.journal-chapters p {
  font:
    11px/1.8 'Google Sans',
    sans-serif;
  color: #ab9d83;
  margin-top: 7px;
}
.journal-chapters .future {
  opacity: 0.4;
}
.journal-tip {
  border-top: 1px dashed #dfd4bd;
  padding-top: 15px;
}
.journal-tip strong {
  font:
    10px 'Google Sans Code',
    monospace;
  color: #a39374;
}
.journal-tip p {
  font-size: 12px;
  line-height: 1.8;
  color: #9e8c6a;
  margin-top: 8px;
}
.pause-card {
  text-align: center;
  padding: 26px;
  max-width: 480px;
}
.pause-card > svg {
  width: 90px;
  height: 110px;
  margin: 0 auto 20px;
  transform: rotate(-6deg);
}
.pause-card p:not(.chapter-label) {
  font-size: 14px;
  color: #a19278;
  line-height: 1.9;
  margin-bottom: 24px;
}
.dialogue-card {
  text-align: center;
  position: relative;
  max-width: 570px;
  padding: 30px;
  background: #fffdf6;
  border: 1px solid #e3d9c0;
  box-shadow: 0 10px 35px #776c4b14;
  border-radius: 22px;
}
.dialogue-portrait {
  width: 85px;
  height: 100px;
  position: relative;
  margin: 0 auto 20px;
}
.dialogue-portrait span {
  position: absolute;
  right: -10px;
  top: 0;
  color: #b69a7b;
}
.dialogue-text {
  font-size: 17px;
  line-height: 1.9;
  color: #968363;
  margin: 18px 0 20px;
}
.dialogue-card small {
  display: block;
  margin-top: 22px;
  color: #b9aa8d;
  font:
    9px 'Google Sans Code',
    monospace;
}
.adventure-credits {
  max-width: 670px;
  margin: 12px auto 20px;
  text-align: center;
}
.adventure-credits h1 {
  font-size: clamp(32px, 5vw, 48px);
  margin: 12px 0 28px;
}
.finished-album {
  width: 235px;
  padding: 22px 20px;
  margin: 0 auto 28px;
  background: #e9ebd9;
  border: 10px solid white;
  border-bottom-width: 24px;
  box-shadow: 0 4px 20px #554a241a;
  transform: rotate(-5deg);
}
.finished-album > svg {
  width: 100px;
  height: 120px;
  margin: 0 auto 5px;
}
.finished-album > span {
  color: #af9e6a;
  font-size: 22px;
}
.finished-album p {
  font:
    9px/1.9 'Google Sans Code',
    monospace;
  color: #a29470;
  margin-top: 18px;
}
.credit-keepsakes {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  margin: 24px 0;
  font:
    10px 'Google Sans Code',
    monospace;
  color: #b3a27e;
}
.adventure-credits > small {
  display: block;
  margin-top: 22px;
  font:
    9px 'Google Sans Code',
    monospace;
  color: #b9af9b;
}
button:focus-visible {
  outline: 2px solid #ad9868;
  outline-offset: 3px;
}
@media (max-width: 800px) {
  .play-content {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .map-column {
    max-width: min(100%, calc((100dvh - 240px) * 9 / 7));
  }
  .journey-sidebar {
    border-left: 0;
    border-top: 1px solid #ede7da;
    padding: 18px 0 0;
  }
  .chapter-checklist {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
  }
  .objective-copy {
    font-size: 12px;
  }
  .pocket-inventory,
  .keyboard-note {
    display: none;
  }
  .undo-controls {
    margin-top: 0;
  }
  .adventure-shell {
    padding: 12px 18px 24px;
  }
  .notebook-page .keyboard-note {
    display: block;
  }
}
@media (max-width: 480px) {
  .adventure-dialog {
    width: calc(100vw - 16px);
    max-height: calc(100dvh - 16px);
    border-radius: 18px;
  }
  .game-brand {
    font-size: 7px;
  }
  .adventure-header {
    gap: 5px;
  }
  .adventure-header button {
    padding: 0 5px;
  }
  .adventure-header kbd {
    display: none;
  }
  .game-overlay {
    padding: 12px;
    align-items: flex-start;
    padding-top: 30px;
  }
  .notebook-page {
    padding: 24px 18px;
  }
  .notebook-page h2 {
    font-size: 25px;
    max-width: 220px;
  }
  .dialogue-card {
    padding: 24px 18px;
  }
  .dialogue-text {
    font-size: 14px;
  }
  .action-row {
    justify-content: center;
  }
  .action-row kbd {
    display: none;
  }
  .adventure-welcome {
    padding-top: 0;
  }
  .album-illustration {
    transform: scale(0.8);
    height: 165px;
    margin-bottom: 12px;
  }
  .welcome-copy {
    font-size: 12px;
  }
  .chapter-heading h1 {
    font-size: 24px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .warm-button {
    transition: none;
  }
  .warm-button:hover {
    transform: none;
  }
}
</style>

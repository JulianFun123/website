<script setup lang="ts">
const props = withDefaults(defineProps<{ enabled: boolean; solo?: boolean }>(), { solo: false })
const { scene, interactive, greet } = usePeekingFriends(
  toRef(props, 'enabled'),
  props.solo ? 6500 : 1600,
)
</script>

<template>
  <div
    class="peeking-friends"
    :class="[`scene-${scene}`, { solo }]"
    :aria-hidden="!interactive"
    :inert="!interactive"
    @pointerdown.stop="greet"
  >
    <span class="friend-spark" aria-hidden="true">✧</span>
    <button
      v-for="friend in solo ? 1 : 2"
      :key="friend"
      type="button"
      class="little-peeker"
      :class="`friend-${friend}`"
      :aria-label="`Wave to the ${friend === 1 ? 'little cream' : 'little sage'} photo friend`"
      :tabindex="interactive ? 0 : -1"
      @click.stop="greet"
      @focus="greet"
    >
      <svg viewBox="0 0 80 96" fill="none" aria-hidden="true">
        <g
          class="peeker-body"
          stroke="#938B78"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M19 67Q10 48 17 29Q20 12 33 16Q44 5 52 18Q68 16 67 35L66 69Q42 85 19 67Z"
            class="peeker-fill"
          />
          <path class="peeker-hand outer-hand" d="M20 48Q5 39 10 31Q14 28 18 37" />
          <path class="peeker-hand meeting-hand" d="M65 47Q76 44 73 34" />
          <g class="peeker-eyes" stroke="#59584D" stroke-width="3.3">
            <path d="M33 34V38M48 34V38" />
          </g>
          <path class="peeker-smile" d="M37 46Q41 50 45 46" stroke="#59584D" />
          <ellipse cx="26" cy="44" rx="4" ry="2.5" fill="#D3AC92" opacity=".4" stroke="none" />
          <ellipse cx="55" cy="44" rx="4" ry="2.5" fill="#D3AC92" opacity=".4" stroke="none" />
          <path d="M28 75L26 87M55 75L58 87" />
        </g>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.peeking-friends {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.little-peeker {
  position: absolute;
  top: 0;
  width: 53%;
  max-width: 70px;
  height: auto;
  aspect-ratio: 80/96;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  pointer-events: auto;
  transform: translateY(4%) rotate(-12deg);
  transition: transform 850ms cubic-bezier(0.22, 1, 0.36, 1);
  transform-origin: 50% 90%;
  -webkit-tap-highlight-color: transparent;
}
.little-peeker svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.scene-hidden .little-peeker {
  visibility: hidden;
  transition:
    transform 850ms cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s 850ms;
}
.friend-1 {
  left: -5%;
}
.friend-2 {
  right: -5%;
  transform: translateY(8%) rotate(12deg);
  transition-delay: 180ms;
}
.peeker-fill {
  fill: #f1e5c5;
}
.friend-2 .peeker-fill {
  fill: #dce1cf;
}
.friend-2 svg {
  transform: scaleX(-1);
}
.scene-peek .friend-1 {
  transform: translateY(-67%) rotate(-12deg);
}
.scene-peek .friend-2 {
  transform: translateY(-57%) rotate(12deg);
}
.scene-meet .friend-1,
.scene-wave .friend-1 {
  transform: translate(10%, -79%) rotate(6deg);
}
.scene-meet .friend-2,
.scene-wave .friend-2 {
  transform: translate(-10%, -79%) rotate(-6deg);
}
.solo .friend-1 {
  left: 25%;
}
.solo.scene-peek .friend-1 {
  transform: translateY(-65%) rotate(-8deg);
}
.solo.scene-meet .friend-1,
.solo.scene-wave .friend-1 {
  transform: translateY(-80%) rotate(5deg);
}
.peeker-hand {
  transform-box: fill-box;
  transform-origin: bottom right;
  transition: transform 500ms ease;
}
.scene-meet .meeting-hand,
.scene-wave .meeting-hand {
  transform: rotate(-25deg);
}
.scene-wave .outer-hand,
.peeking-friends:has(.little-peeker:hover) .outer-hand {
  animation: peeker-wave 650ms ease-in-out 3;
}
.scene-wave .peeker-body {
  animation: peeker-bounce 850ms ease-in-out 2;
  transform-origin: 40px 85px;
}
.scene-wave .friend-2 .peeker-body {
  animation-delay: 180ms;
}
.scene-wave .peeker-eyes {
  transform: scaleY(0.3);
  transform-origin: 40px 36px;
}
.friend-spark {
  position: absolute;
  top: 0;
  left: 50%;
  color: #b6a06a;
  font-size: 20px;
  opacity: 0;
  transform: translate(-50%, -190%);
  transition: opacity 400ms ease;
}
.scene-wave:not(.solo) .friend-spark {
  opacity: 1;
}
.little-peeker:focus-visible {
  outline: 1px dashed #8b7f60;
  outline-offset: 0;
  border-radius: 45%;
}
@keyframes peeker-wave {
  0%,
  100% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(35deg);
  }
}
@keyframes peeker-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
@media (max-width: 767px), (prefers-reduced-motion: reduce) {
  .peeking-friends {
    display: none;
  }
}
</style>

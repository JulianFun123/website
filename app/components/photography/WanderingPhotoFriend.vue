<script setup lang="ts">
import type { Polaroid } from '~/data/photography'
import PhotoFriendSprite from './PhotoFriendSprite.vue'

const props = defineProps<{ enabled: boolean; reduceMotion: boolean | null; photos: Polaroid[] }>()
const emit = defineEmits<{ play: [] }>()
const { position, hopping, held, visible } = useWanderingPhotoFriend(
  toRef(props, 'enabled'),
  toRef(props, 'reduceMotion'),
  props.photos,
)
</script>

<template>
  <div
    v-if="enabled"
    class="wandering-friend"
    :class="{ hopping, 'is-held': held, 'is-hidden': !visible }"
    :aria-hidden="!visible"
    :inert="!visible"
    :style="position"
  >
    <button
      type="button"
      class="wandering-button"
      aria-label="Play Pip and the Missing Colours"
      :tabindex="visible ? 0 : -1"
      @pointerenter="held = true"
      @pointerleave="held = false"
      @focus="held = true"
      @blur="held = false"
      @pointerdown.stop
      @click.stop="emit('play')"
    >
      <PhotoFriendSprite /><span class="adventure-note">a tiny adventure? ↗</span>
    </button>
  </div>
</template>

<style scoped>
.wandering-friend {
  position: absolute;
  width: 58px;
  height: 70px;
  margin-left: -29px;
  z-index: -1;
  transition:
    opacity 650ms ease,
    left 1200ms ease-in-out,
    top 1200ms ease-in-out;
}
.wandering-friend.hopping,
.wandering-friend.is-held {
  z-index: 6;
}
.wandering-button {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  position: relative;
  transform: rotate(-6deg);
  transition: transform 650ms ease;
}
.wandering-friend.is-hidden {
  opacity: 0;
  pointer-events: none;
}
.is-hidden .wandering-button {
  transform: translateY(45px) rotate(-10deg) scale(0.7);
}
.wandering-button svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.hopping .wandering-button {
  animation: little-leap 1200ms cubic-bezier(0.3, 0, 0.6, 1);
}
.adventure-note {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%) rotate(-5deg);
  white-space: nowrap;
  font:
    9px 'Google Sans Code',
    monospace;
  color: #93866c;
  opacity: 0;
  transition: opacity 200ms;
  pointer-events: none;
}
.wandering-button:hover .adventure-note,
.wandering-button:focus-visible .adventure-note {
  opacity: 1;
}
.wandering-button:focus-visible {
  outline: 1px dashed #a99970;
  outline-offset: 2px;
  border-radius: 40%;
}
@keyframes little-leap {
  0%,
  100% {
    transform: translateY(0) rotate(-6deg) scaleY(1);
  }
  12% {
    transform: translateY(3px) rotate(-10deg) scaleY(0.85);
  }
  48% {
    transform: translateY(-90px) rotate(12deg) scaleY(1.05);
  }
  88% {
    transform: translateY(3px) rotate(-4deg) scaleY(0.9);
  }
}
@media (max-width: 767px) {
  .wandering-friend {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wandering-friend,
  .wandering-button,
  .adventure-note {
    transition: none;
  }
  .hopping .wandering-button {
    animation: none;
  }
}
</style>

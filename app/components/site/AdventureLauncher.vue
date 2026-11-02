<script setup lang="ts">
import PhotoFriendSprite from '~/components/photography/PhotoFriendSprite.vue'
const PhotoAdventure = defineAsyncComponent(
  () => import('~/components/photography/PhotoAdventure.vue'),
)
const { open, hasPlayed } = useAdventureAccess()
const launcher = ref<HTMLButtonElement>()
let previous: HTMLElement | null = null
watch(open, (value) => {
  if (!import.meta.client) return
  if (value)
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
  else
    nextTick(() => {
      if (previous?.isConnected && !previous.closest('[inert], [aria-hidden="true"]'))
        previous.focus()
      else launcher.value?.focus()
    })
})
</script>

<template>
  <Teleport to="body"
    ><button
      v-if="hasPlayed && !open"
      ref="launcher"
      class="pip-launcher"
      aria-label="Open Pip’s adventure and little atlas"
      @click="open = true"
    >
      <PhotoFriendSprite /><span>Pip’s little atlas ↗</span>
    </button></Teleport
  >
  <PhotoAdventure v-if="open" @close="open = false" />
</template>

<style scoped>
.pip-launcher {
  position: fixed;
  z-index: 100;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(12px, env(safe-area-inset-bottom));
  width: 64px;
  height: 76px;
  border: 0;
  border-radius: 40%;
  padding: 2px;
  background: transparent;
  cursor: pointer;
  filter: drop-shadow(0 4px 4px #302b2820);
  -webkit-tap-highlight-color: transparent;
}
.pip-launcher svg {
  width: 100%;
  height: 100%;
  transform: rotate(-6deg);
  transition: transform 250ms;
}
.pip-launcher:hover svg {
  transform: rotate(4deg) translateY(-4px);
}
.pip-launcher > span {
  position: absolute;
  bottom: 84px;
  right: 0;
  background: #fffdf3;
  border: 1px solid #e3d8bd;
  border-radius: 10px;
  padding: 10px 13px;
  color: #ac9872;
  font:
    9px 'Google Sans Code',
    monospace;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 200ms,
    transform 200ms;
  pointer-events: none;
}
.pip-launcher:hover > span,
.pip-launcher:focus-visible > span {
  opacity: 1;
  transform: translateY(0);
}
.pip-launcher:focus-visible {
  outline: 1px dashed #a08d64;
  outline-offset: 3px;
}
@media (max-width: 767px) {
  .pip-launcher {
    width: 52px;
    height: 64px;
    right: max(12px, env(safe-area-inset-right));
  }
}
@media (prefers-reduced-motion: reduce) {
  .pip-launcher svg,
  .pip-launcher > span {
    transition: none;
  }
  .pip-launcher:hover svg {
    transform: rotate(-6deg);
  }
}
</style>

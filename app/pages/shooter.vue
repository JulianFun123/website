<script setup lang="ts">
import ShooterGame from '~/components/shooter/ShooterGame.client.vue'
definePageMeta({ layout: false, leftPanel: false, standalone: true })
useSeoMeta({
  title: 'The Paper Garden · Pip FFA',
  description: 'A tiny 3D multiplayer free-for-all. Bring your camera. Bring a friend.',
})
useHead({ htmlAttrs: { 'data-theme': 'light' } })
</script>
<template>
  <ClientOnly
    ><ShooterGame /><template #fallback
      ><main class="shooter-loading">
        <span>✧</span>
        <p>Unfolding a little 3D garden…</p>
      </main></template
    ></ClientOnly
  >
</template>
<style scoped>
.shooter-loading {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: #eeeee2;
  color: #ac9c78;
  font:
    12px 'Google Sans Code',
    monospace;
}
.shooter-loading span {
  font-size: 40px;
  color: #c5b282;
}
</style>

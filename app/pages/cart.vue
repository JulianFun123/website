<script setup lang="ts">
import PipCartGame from '~/components/cart/PipCartGame.client.vue'
definePageMeta({ layout: false, leftPanel: false, standalone: true })
useSeoMeta({
  title: 'Pip’s Little Grand Prix',
  description: 'Three tiny 3D racetracks, seven little rivals and a pocketful of lovely chaos.',
})
useHead({ htmlAttrs: { 'data-theme': 'light' } })
</script>
<template>
  <ClientOnly
    ><PipCartGame /><template #fallback
      ><main class="cart-loading">
        <span>⚑</span>
        <p>Unfolding three little roads…</p>
      </main></template
    ></ClientOnly
  >
</template>
<style scoped>
.cart-loading {
  min-height: 100dvh;
  background: #e9eddf;
  color: #b09b70;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
  font:
    12px 'Google Sans Code',
    monospace;
}
.cart-loading span {
  font-size: 38px;
}
</style>

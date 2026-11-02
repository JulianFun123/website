<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <aside class="design-note">
    <span v-if="label" class="design-note-label">{{ label }}</span>
    <slot />
  </aside>
</template>

<style scoped>
.design-note {
  border-left: 1px solid #b7b7b7;
  padding: 2px 0 2px 14px;
  margin: 24px 0;
}
.design-note-label {
  display: block;
  font:
    9px 'Google Sans Code',
    monospace;
  color: #999;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>

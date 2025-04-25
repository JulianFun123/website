<script setup lang="ts">
import type { RouterLinkProps } from 'vue-router'

defineProps<{
  to: any
}>()
</script>
<template>
  <router-link
    :to="to"
    class="text-2xl md:text-3xl opacity-60 hover:opacity-100 md:hover:pl-3 transition-all"
    exact-active-class="opacity-100"
    ><slot
  /></router-link>
</template>

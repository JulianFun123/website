<script setup lang="ts">
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import DevPanel from '~/components/DevPanel.vue'
import PhotographyPanel from '~/components/PhotographyPanel.vue'
import VideoPanel from '~/components/VideoPanel.vue'
import DesignPanel from '~/components/DesignPanel.vue'
import AdventureLauncher from '~/components/site/AdventureLauncher.vue'

const route = useRoute()
const standalone = computed(() => route.meta.standalone === true)
const reduceMotion = useReducedMotion()
const panels = {
  dev: DevPanel,
  photography: PhotographyPanel,
  video: VideoPanel,
  design: DesignPanel,
}
const leftPanel = computed(() => {
  const panel = route.meta.leftPanel
  if (panel === false) return false
  return panel === 'photography' || panel === 'video' || panel === 'design' ? panel : 'dev'
})
const panelComponent = computed(() => (leftPanel.value === false ? null : panels[leftPanel.value]))
</script>

<template>
  <NuxtPage v-if="standalone" />
  <NuxtLayout v-else name="main">
    <template #left>
      <AnimatePresence mode="wait">
        <motion.div
          v-if="panelComponent"
          :key="leftPanel || 'none'"
          class="size-full"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{
            opacity: 0,
            transition: { when: 'afterChildren', duration: reduceMotion ? 0 : 0.1 },
          }"
          :transition="{ duration: reduceMotion ? 0 : 0.15 }"
        >
          <component :is="panelComponent" />
        </motion.div>
      </AnimatePresence>
    </template>
    <NuxtPage />
  </NuxtLayout>
  <AdventureLauncher v-if="!standalone" />
</template>

<style>
@import '@fontsource/google-sans';

:root {
  font-family: 'Google Sans';
}

body,
html,
#__nuxt {
  height: 100%;
}

html {
  background: #f3f4f6;
  transition: background-color 600ms ease;
}

html[data-theme='cinema'] {
  color-scheme: dark;
  background: #08090b;
}

@media (prefers-reduced-motion: reduce) {
  html {
    transition: none;
  }
}
</style>

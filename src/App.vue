<script setup lang="ts">
import NavigationLink from '@/components/NavigationLink.vue'
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <header class="p-10">
      <span class="text-2xl md:text-5xl">julian gojani</span>
    </header>

    <div class="h-full flex flex-col md:flex-row gap-2 w-full">
      <div class="flex flex-col justify-between gap-2 w-[20rem] p-10">
        <div class="flex md:flex-col gap-2">
          <NavigationLink :to="{ name: 'home' }">projects</NavigationLink>
          <NavigationLink :to="{ name: 'imprint' }">imprint</NavigationLink>
        </div>

        <div class="flex gap-3">
          <a href="mailto:julian@gojani.xyz" target="_blank" class="opacity-60 hover:opacity-100"
            >julian@gojani.xyz</a
          >
          <a
            href="https://github.com/JulianFun123"
            target="_blank"
            class="opacity-60 hover:opacity-100"
            >github</a
          >
        </div>
      </div>
      <div
        class="border-t md:border-l border-black/30 dark:border-white/40 md:rounded-tl-2xl w-full"
      >
        <router-view />
      </div>
    </div>
  </div>
</template>

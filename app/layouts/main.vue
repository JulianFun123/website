<script setup lang="ts">
import BgName from '~/components/BgName.vue'
import SiteNavigation from '~/components/site/SiteNavigation.vue'
import SiteAmbient from '~/components/site/SiteAmbient.vue'

const route = useRoute()
const isCinema = computed(() => route.meta.leftPanel === 'video')
const isDesign = computed(() => route.meta.leftPanel === 'design')
const { selectedId: designSelection } = useDesignSelection()

useHead(() => ({ htmlAttrs: { 'data-theme': isCinema.value ? 'cinema' : 'light' } }))
</script>
<template>
  <main
    :class="{
      'is-cinema': isCinema,
      'is-design': isDesign,
      'has-design-selection': isDesign && designSelection,
    }"
    class="site-shell min-h-full p-4 md:p-6 grid gap-6 items-start"
  >
    <SiteAmbient :active="isCinema" />
    <div
      class="site-side site-surface rounded-3xl min-w-0 overflow-hidden relative border h-80 md:h-[calc(100dvh-3rem)] md:sticky md:top-6"
    >
      <BgName class="site-background-name absolute top-1/2 -left-10 h-full -translate-y-[50%]" />
      <div class="site-side-content absolute z-10 left-0 top-0 size-full">
        <slot name="left" />
      </div>
    </div>
    <div
      class="site-main site-surface relative rounded-3xl min-w-0 border min-h-full overflow-hidden"
    >
      <SiteNavigation />
      <slot />
    </div>
  </main>
</template>

<style scoped>
.site-shell {
  position: relative;
  isolation: isolate;
  --shell-bg: #f3f4f6;
  --surface-bg: #fff;
  --surface-border: rgb(229 231 235 / 0.7);
  --text: #111;
  --nav-text: rgb(0 0 0 / 0.4);
  --nav-hover: rgb(0 0 0 / 0.8);
  --bg-name-start: #eaeaea;
  --bg-name-shimmer: #a5adb9;
  --bg-name-end: #fff;
  grid-template-columns: minmax(0, 1fr);
  background-color: var(--shell-bg);
  color: var(--text);
  transition:
    grid-template-columns 600ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 600ms ease,
    color 600ms ease;
}

.site-shell.is-cinema {
  --shell-bg: #08090b;
  --surface-bg: #111216;
  --surface-border: rgb(255 255 255 / 0.09);
  --text: #f5f5f5;
  --nav-text: rgb(255 255 255 / 0.45);
  --nav-hover: rgb(255 255 255 / 0.85);
  --bg-name-start: #444650;
  --bg-name-shimmer: #a8b7d4;
  --bg-name-end: #111216;
}

.site-surface {
  z-index: 1;
  background-color: var(--surface-bg);
  border-color: var(--surface-border);
  transition:
    background-color 600ms ease,
    border-color 600ms ease;
}

@media (min-width: 768px) {
  .site-shell {
    grid-template-columns: minmax(0, 2fr) minmax(0, 4fr);
  }
  .site-shell.is-cinema {
    grid-template-columns: minmax(0, 1fr) minmax(0, 6fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-shell,
  .site-surface {
    transition: none;
  }
}
@media (max-width: 767px) {
  .site-shell {
    align-content: start;
    gap: 12px;
    padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
  }
  .site-side {
    height: 200px;
  }
  .site-surface {
    border-radius: 22px;
  }
  .is-cinema .site-side {
    height: 76px;
  }
  .is-cinema .site-background-name {
    width: 100%;
    height: auto;
    left: 0;
  }
  .is-design .site-main {
    order: 1;
  }
  .is-design .site-side {
    order: 2;
    height: auto;
  }
  .is-design .site-side-content {
    position: relative;
    height: auto;
  }
  .is-design.has-design-selection .site-side {
    position: fixed;
    left: max(12px, env(safe-area-inset-left));
    right: max(12px, env(safe-area-inset-right));
    bottom: max(12px, env(safe-area-inset-bottom));
    z-index: 30;
    max-height: 45dvh;
    box-shadow: 0 8px 40px #00000024;
  }
}
</style>

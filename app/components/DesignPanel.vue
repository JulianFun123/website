<script setup lang="ts">
import { motion, useReducedMotion } from 'motion-v'
import { designConfig } from '~/data/design'

const { active, selectedId, hoveredId, clearSelection } = useDesignSelection()
const reduceMotion = useReducedMotion()
</script>

<template>
  <motion.div
    data-left-panel="design"
    class="design-panel"
    :initial="{ opacity: 0, y: reduceMotion ? 0 : 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :exit="{ opacity: 0, y: reduceMotion ? 0 : -20 }"
    :transition="{ duration: reduceMotion ? 0 : 0.25 }"
  >
    <header class="design-panel-top">
      <span>{{ active ? (hoveredId ? 'Preview' : 'Selected') : 'Canvas notes' }}</span
      ><button v-if="selectedId" @click="clearSelection" aria-label="Clear design selection">
        ×
      </button>
    </header>
    <div class="design-copy" aria-live="polite" aria-atomic="true">
      <MDC
        :key="active?.id ?? 'introduction'"
        :value="active?.content ?? designConfig.introduction"
        tag="article"
      />
    </div>
    <footer v-if="active" class="design-panel-footer">{{ active.title }}</footer>
  </motion.div>
</template>

<style scoped>
.design-panel {
  height: 100%;
  overflow-y: auto;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  background: rgb(255 255 255 / 0.8);
}
.design-panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #aaa;
  font:
    9px 'Google Sans Code',
    monospace;
  margin-bottom: 36px;
}
.design-panel-top button {
  font:
    20px 'Google Sans',
    sans-serif;
  color: #888;
  width: 24px;
  height: 24px;
}
.design-copy {
  color: #6c6c6c;
  font-size: 13px;
  line-height: 1.85;
  overflow-wrap: anywhere;
}
.design-copy :deep(h1) {
  color: #222;
  font-size: clamp(28px, 3vw, 43px);
  line-height: 1.12;
  font-weight: 400;
  letter-spacing: -0.055em;
  margin-bottom: 28px;
}
.design-copy :deep(h2),
.design-copy :deep(h3) {
  color: #333;
  font-size: 18px;
  margin: 25px 0 10px;
}
.design-copy :deep(p) {
  margin: 0 0 17px;
}
.design-copy :deep(a) {
  color: #333;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.design-copy :deep(strong) {
  font-weight: 500;
  color: #333;
}
.design-copy :deep(ul),
.design-copy :deep(ol) {
  padding-left: 18px;
  margin: 15px 0;
  list-style: revert;
}
.design-copy :deep(code) {
  font:
    10px 'Google Sans Code',
    monospace;
  background: #f1f1f1;
  padding: 2px 4px;
}
.design-copy :deep(pre) {
  overflow: auto;
  background: #f5f5f5;
  padding: 12px;
  margin: 15px 0;
}
.design-copy :deep(table) {
  width: 100%;
  font-size: 11px;
  border-collapse: collapse;
  margin: 20px 0;
}
.design-copy :deep(th),
.design-copy :deep(td) {
  text-align: left;
  padding: 8px 0;
  border-bottom: 1px solid #e8e8e8;
}
.design-copy :deep(th) {
  font-weight: 400;
  color: #999;
}
.design-copy :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 18px 0;
}
.design-panel-footer {
  font:
    8px 'Google Sans Code',
    monospace;
  color: #aaa;
  margin-top: auto;
  padding-top: 35px;
}
button:focus-visible {
  outline: 1px solid #333;
  outline-offset: 3px;
}
@media (max-width: 767px) {
  .design-panel {
    padding: 22px 25px;
  }
  .design-panel-top {
    margin-bottom: 18px;
  }
  .design-copy {
    font-size: 12px;
  }
  .design-copy :deep(h1) {
    font-size: 30px;
    margin-bottom: 16px;
  }
}
@media (max-width: 767px) {
  .design-panel {
    height: auto;
    max-height: 45dvh;
    padding: 14px 20px 20px;
    overscroll-behavior-y: contain;
    background: #fff;
  }
  .design-panel-top {
    min-height: 44px;
    margin-bottom: 12px;
    font-size: 10px;
  }
  .design-panel-top button {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    font-size: 28px;
    margin-right: -12px;
  }
  .design-copy {
    font-size: 14px;
    line-height: 1.75;
  }
  .design-copy :deep(h1) {
    font-size: 28px;
    margin-bottom: 16px;
  }
  .design-copy :deep(table) {
    font-size: 12px;
  }
  .design-copy :deep(code) {
    font-size: 11px;
  }
  .design-copy :deep(a) {
    display: inline-block;
    padding-block: 8px;
  }
  .design-panel-footer {
    padding-top: 18px;
  }
}
</style>

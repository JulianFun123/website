<script setup lang="ts">
import { MIN_DESIGN_ZOOM, MAX_DESIGN_ZOOM } from '~/utils/designCamera'

const props = withDefaults(
  defineProps<{ title: string; tool: 'select' | 'hand'; zoom: number; minimumZoom?: number }>(),
  { minimumZoom: MIN_DESIGN_ZOOM },
)
const emit = defineEmits<{
  tool: [tool: 'select' | 'hand']
  zoom: [factor: number]
  reset: []
  fit: []
}>()
const zoomLabel = computed(() => `${Math.round(props.zoom * 100)}%`)
</script>

<template>
  <header class="canvas-toolbar">
    <div class="tool-group" role="group" aria-label="Canvas tools">
      <button
        :aria-pressed="tool === 'select'"
        :class="{ active: tool === 'select' }"
        aria-label="Select tool"
        title="Select (V)"
        @click="emit('tool', 'select')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 3 14 11-7 1-3 6z" /></svg>
      </button>
      <button
        :aria-pressed="tool === 'hand'"
        :class="{ active: tool === 'hand' }"
        aria-label="Pan tool"
        title="Pan (H), or hold Space on the canvas"
        @click="emit('tool', 'hand')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 12V6a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6c0 4-2 7-6 7h-1c-2 0-3-1-4-2l-5-6a1.5 1.5 0 0 1 2-2l2 2"
          />
        </svg>
      </button>
    </div>
    <span class="canvas-name">{{ title }} <span>/ Canvas</span></span>
    <div class="zoom-tools" role="group" aria-label="Canvas zoom">
      <button aria-label="Zoom out" :disabled="zoom <= minimumZoom" @click="emit('zoom', 1 / 1.2)">
        −
      </button>
      <button class="zoom-value" aria-label="Reset zoom to 100 percent" @click="emit('reset')">
        {{ zoomLabel }}
      </button>
      <button aria-label="Zoom in" :disabled="zoom >= MAX_DESIGN_ZOOM" @click="emit('zoom', 1.2)">
        +
      </button>
      <button class="fit-button" title="Fit to canvas (0)" @click="emit('fit')">Fit</button>
    </div>
  </header>
</template>

<style scoped>
.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 16px;
  border-top: 1px solid #efefef;
  border-bottom: 1px solid #e6e6e6;
  min-height: 51px;
}
.tool-group {
  display: flex;
  gap: 3px;
}
.canvas-toolbar button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  color: #777;
  font-size: 15px;
}
.canvas-toolbar button:hover {
  background: #f0f0f0;
}
.canvas-toolbar button.active {
  color: #222;
  background: #eaeaea;
}
.canvas-toolbar svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.canvas-name {
  font:
    10px 'Google Sans Code',
    monospace;
  white-space: nowrap;
}
.canvas-name > span {
  color: #bbb;
}
.zoom-tools {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 1px;
}
.canvas-toolbar .zoom-value {
  width: 48px;
  font:
    10px 'Google Sans Code',
    monospace;
}
.canvas-toolbar .fit-button {
  margin-left: 7px;
  width: 34px;
  font-size: 11px;
  border: 1px solid #e6e6e6;
}
.canvas-toolbar button:disabled {
  opacity: 0.25;
  cursor: default;
}

.canvas-toolbar button:focus-visible {
  outline: 1px solid #777;
  outline-offset: 2px;
}
@media (max-width: 640px) {
  .canvas-toolbar {
    padding: 10px;
    gap: 8px;
  }
  .canvas-name {
    font-size: 9px;
  }
  .canvas-name > span {
    display: none;
  }
  .canvas-toolbar button {
    width: 27px;
  }
}
@media (max-width: 767px) {
  .canvas-toolbar {
    padding: 6px 8px;
    gap: 6px;
  }
  .canvas-toolbar button {
    width: 40px;
    height: 44px;
  }
  .canvas-toolbar .zoom-value {
    width: 42px;
  }
  .canvas-toolbar .fit-button {
    width: 40px;
    height: 40px;
    margin-left: 2px;
  }
  .canvas-name {
    margin-left: 2px;
    font-size: 9px;
  }
  .canvas-name > span {
    display: none;
  }
  .zoom-tools {
    gap: 0;
  }
}
@media (max-width: 359px) {
  .canvas-name {
    display: none;
  }
}
</style>

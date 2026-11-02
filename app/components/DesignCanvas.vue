<script setup lang="ts">
import { designConfig } from '~/data/design'
import CanvasToolbar from '~/components/design/CanvasToolbar.vue'
import CanvasElement from '~/components/design/CanvasElement.vue'

const { selectedId, activeId } = useDesignSelection()
const {
  viewport,
  minimumZoom,
  camera,
  tool,
  dragging,
  initialized,
  isHand,
  fit,
  zoomBy,
  resetZoom,
  onWheel,
  onPointerDown,
  onPointerMove,
  endGesture,
  selectElement,
  previewElement,
  clearPreview,
  onLostPointerCapture,
  onKeyDown,
  onKeyUp,
  onBlur,
} = useDesignCanvas(designConfig.elements)
</script>

<template>
  <section class="design-workspace" aria-label="Design workspace">
    <CanvasToolbar
      :title="designConfig.title"
      :tool="tool"
      :zoom="camera.scale"
      :minimum-zoom="minimumZoom"
      @tool="tool = $event"
      @zoom="zoomBy"
      @reset="resetZoom"
      @fit="fit"
    />

    <div
      ref="viewport"
      class="canvas-viewport"
      :class="{ 'hand-tool': isHand, dragging }"
      tabindex="0"
      role="region"
      aria-label="Interactive design canvas"
      aria-describedby="canvas-help"
      :style="{
        backgroundSize: `${20 * camera.scale}px ${20 * camera.scale}px`,
        backgroundPosition: `${camera.x}px ${camera.y}px`,
      }"
      @wheel.prevent="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endGesture"
      @pointercancel="endGesture"
      @lostpointercapture="onLostPointerCapture"
      @pointerleave="clearPreview"
      @keydown="onKeyDown"
      @keyup="onKeyUp"
      @blur="onBlur"
    >
      <div
        class="canvas-world"
        :style="{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
          opacity: initialized ? 1 : 0,
        }"
      >
        <CanvasElement
          v-for="element in designConfig.elements"
          :key="element.id"
          :element="element"
          :selected="selectedId === element.id"
          :highlighted="activeId === element.id"
          :hand-tool="isHand"
          :dragging="dragging"
          @select="selectElement"
          @preview="previewElement"
          @leave="clearPreview"
        />
      </div>
    </div>

    <footer class="canvas-status">
      <span id="canvas-help"
        ><span class="desktop-help">Drag to pan · Ctrl/⌘ + scroll to zoom</span
        ><span class="mobile-help">Drag to pan · Pinch to zoom</span></span
      ><span>{{
        selectedId ? 'Selection pinned' : `${designConfig.elements.length} objects`
      }}</span>
    </footer>
  </section>
</template>

<style scoped>
.design-workspace {
  min-width: 0;
  color: #444;
}
.canvas-viewport {
  position: relative;
  overflow: hidden;
  height: max(420px, calc(100dvh - 210px));
  max-height: 1000px;
  background-color: #f2f2f2;
  background-image: radial-gradient(#c9c9c9 0.7px, transparent 0.7px);
  touch-action: none;
  user-select: none;
  cursor: default;
  outline-offset: -3px;
}
.canvas-viewport.hand-tool {
  cursor: grab;
}
.canvas-viewport.dragging {
  cursor: grabbing;
}
.canvas-world {
  position: absolute;
  inset: 0 auto auto 0;
  transform-origin: 0 0;
}
.canvas-status {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  font:
    8px 'Google Sans Code',
    monospace;
  color: #a5a5a5;
  border-top: 1px solid #e6e6e6;
}
.mobile-help {
  display: none;
}

.canvas-viewport:focus-visible {
  outline: 1px solid #777;
  outline-offset: 2px;
}
@media (max-width: 640px) {
  .canvas-status {
    font-size: 7px;
    padding: 12px 10px;
  }
  .canvas-viewport {
    height: 65dvh;
    min-height: 420px;
  }
}
@media (max-width: 767px) {
  .desktop-help {
    display: none;
  }
  .mobile-help {
    display: inline;
  }
  .canvas-viewport {
    height: min(65dvh, 640px);
    min-height: 360px;
  }
  .canvas-status {
    font-size: 9px;
    line-height: 1.5;
    padding: 10px 12px;
  }
}
</style>

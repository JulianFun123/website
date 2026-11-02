<script setup lang="ts">
import type { DesignElement } from '~/data/design'

const props = defineProps<{
  element: DesignElement
  selected: boolean
  highlighted: boolean
  handTool: boolean
  dragging: boolean
}>()
const emit = defineEmits<{ select: [id: string]; preview: [id: string]; leave: [] }>()
const imageFailed = ref(false)
watch(
  () => props.element.src,
  () => {
    imageFailed.value = false
  },
)
</script>

<template>
  <button
    :data-design-element="element.id"
    class="design-element"
    :class="{ highlighted, selected, 'hand-tool': handTool, dragging }"
    :style="{
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: `rotate(${element.rotation ?? 0}deg)`,
      '--element-background': element.background ?? '#ffffff',
      '--element-color': element.color ?? '#222222',
    }"
    :aria-label="`View ${element.title}`"
    :aria-pressed="selected"
    @mouseenter="emit('preview', element.id)"
    @mouseleave="emit('leave')"
    @focus="emit('preview', element.id)"
    @blur="emit('leave')"
    @click.stop="emit('select', element.id)"
  >
    <span class="element-label">{{ element.title }}</span>
    <span class="element-frame">
      <template v-if="element.kind === 'image'">
        <img
          v-if="element.src && !imageFailed"
          :src="element.src"
          :alt="element.alt || element.title"
          draggable="false"
          @error="imageFailed = true"
        />
        <span v-else class="image-fallback">{{ element.title }}</span>
      </template>
      <span
        v-else-if="element.kind === 'text'"
        class="type-specimen"
        :style="{ fontSize: `${element.fontSize ?? 40}px`, fontFamily: element.fontFamily }"
        >{{ element.text }}</span
      >
      <span v-else class="palette-swatches"
        ><span v-for="color in element.colors" :key="color.name" class="palette-row"
          ><span class="palette-color" :style="{ backgroundColor: color.value }" /><span
            >{{ color.name }}<small>{{ color.value }}</small></span
          ></span
        ></span
      >
    </span>
    <span v-if="highlighted" class="selection-outline" aria-hidden="true"
      ><i /><i /><i /><i
    /></span>
  </button>
</template>

<style scoped>
.design-element {
  position: absolute;
  display: block;
  text-align: left;
  color: var(--element-color);
  cursor: default;
  outline: none;
  transform-origin: center;
}
.element-label {
  position: absolute;
  top: -24px;
  left: 0;
  white-space: nowrap;
  color: #8c8c8c;
  font:
    12px 'Google Sans Code',
    monospace;
}
.element-frame {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--element-background);
}
.element-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
.design-element[data-design-element='juflix'] img {
  padding: 80px;
}
.type-specimen {
  display: flex;
  align-items: center;
  white-space: pre-wrap;
  line-height: 1.35;
  letter-spacing: -0.055em;
  padding: 35px;
}
.palette-swatches {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  padding: 25px;
  gap: 20px;
}
.palette-row {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 16px;
}
.palette-row small {
  display: block;
  color: #aaa;
  font:
    10px 'Google Sans Code',
    monospace;
  margin-top: 5px;
}
.palette-color {
  width: 48px;
  height: 48px;
  border: 1px solid #00000012;
  flex-shrink: 0;
}
.image-fallback {
  margin: auto;
  padding: 20px;
  font-size: 14px;
  color: #888;
}
.selection-outline {
  position: absolute;
  inset: -1px;
  border: 2px solid #7676cf;
  pointer-events: none;
}
.selection-outline i {
  position: absolute;
  width: 7px;
  height: 7px;
  background: #fff;
  border: 1px solid #7676cf;
}
.selection-outline i:nth-child(1) {
  left: -4px;
  top: -4px;
}
.selection-outline i:nth-child(2) {
  right: -4px;
  top: -4px;
}
.selection-outline i:nth-child(3) {
  left: -4px;
  bottom: -4px;
}
.selection-outline i:nth-child(4) {
  right: -4px;
  bottom: -4px;
}
.highlighted .element-label,
.design-element:focus-visible .element-label {
  color: #6565b0;
}
.design-element:focus-visible {
  outline: 3px solid #7676cf;
  outline-offset: 5px;
}
.design-element.hand-tool {
  cursor: grab;
}
.design-element.dragging {
  cursor: grabbing;
}
</style>

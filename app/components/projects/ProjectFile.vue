<script setup lang="ts">
import type { FeaturedProject } from '~/data/projects'

defineProps<{ project: FeaturedProject; index: number; expanded: boolean }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const failedImage = ref<string | null>(null)
</script>

<template>
  <li class="project-file" :class="{ 'is-open': expanded }">
    <h2>
      <button
        :id="`project-trigger-${project.id}`"
        :aria-expanded="expanded"
        :aria-controls="`project-file-${project.id}`"
        class="file-handle"
        @click="emit('toggle', project.id)"
      >
        <span class="file-number">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="file-name">{{ project.name }}</span>
        <span class="file-type">{{ project.category }}</span>
        <span class="file-symbol" aria-hidden="true">{{ expanded ? '−' : '+' }}</span>
      </button>
    </h2>
    <div
      :id="`project-file-${project.id}`"
      class="file-fold"
      :inert="!expanded"
      :aria-hidden="!expanded"
    >
      <div class="file-fold-inner">
        <div class="file-content">
          <p class="file-description">{{ project.description }}</p>
          <figure v-if="project.image && failedImage !== project.image" class="project-image">
            <a
              :href="project.url || project.repo"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Open ${project.name}`"
            >
              <img
                :src="project.image"
                :alt="project.imageAlt || `${project.name} screenshot`"
                loading="lazy"
                decoding="async"
                @error="failedImage = project.image ?? null"
              />
            </a>
          </figure>
          <div class="file-links">
            <a :href="project.repo" target="_blank" rel="noopener noreferrer">Source ↗</a>
            <a
              v-if="project.url && project.url !== project.repo"
              :href="project.url"
              target="_blank"
              rel="noopener noreferrer"
              >Open project ↗</a
            >
          </div>
        </div>
      </div>
    </div>
  </li>
</template>

<style scoped>
.project-file {
  border-bottom: 1px solid #e3e3e3;
}
.file-handle {
  display: flex;
  align-items: baseline;
  width: 100%;
  text-align: left;
  padding: 23px 0;
  gap: 17px;
  transition: color 180ms ease;
}
.file-number {
  width: 18px;
  flex-shrink: 0;
  font:
    9px 'Google Sans Code',
    monospace;
  color: #aaa;
}
.file-name {
  font-size: clamp(24px, 3.2vw, 42px);
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 1.15;
  overflow-wrap: anywhere;
}
.file-type {
  margin-left: auto;
  font:
    8px 'Google Sans Code',
    monospace;
  color: #aaa;
  flex-shrink: 0;
}
.file-symbol {
  width: 17px;
  flex-shrink: 0;
  text-align: right;
  font-size: 20px;
  font-weight: 300;
  color: #aaa;
  transition: transform 300ms ease;
}
.file-handle:hover {
  color: #888;
}
.file-handle:hover .file-symbol {
  transform: rotate(90deg);
}
.is-open .file-symbol {
  color: #222;
}
.file-fold {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 450ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 300ms ease;
}
.is-open .file-fold {
  grid-template-rows: 1fr;
  opacity: 1;
}
.file-fold-inner {
  min-height: 0;
  overflow: hidden;
}
.file-content {
  padding: 0 0 26px 35px;
}
.file-description {
  font-size: 13px;
  line-height: 1.75;
  max-width: 520px;
  color: #737373;
}
.project-image {
  margin: 20px 0;
}
.project-image a {
  display: block;
}
.project-image img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 520px;
  object-fit: contain;
  object-position: left top;
}
.file-links {
  display: flex;
  gap: 20px;
  margin-top: 18px;
  font-size: 11px;
}
.file-links a {
  border-bottom: 1px solid #ccc;
  padding-bottom: 3px;
}
.file-links a:hover {
  border-color: #222;
}

button:focus-visible,
a:focus-visible {
  outline: 1px solid #222;
  outline-offset: 5px;
}
@media (max-width: 640px) {
  .file-handle {
    gap: 12px;
    padding: 21px 0;
  }
  .file-name {
    font-size: 27px;
  }
  .file-type {
    display: none;
  }
  .file-symbol {
    margin-left: auto;
  }
  .file-content {
    padding-left: 0;
  }
  .file-description {
    font-size: 12px;
  }
  .file-links {
    font-size: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .file-fold,
  .file-handle,
  .file-symbol {
    transition: none;
  }
}
@media (max-width: 767px) {
  .file-handle {
    min-height: 68px;
    padding: 18px 0;
    gap: 12px;
  }
  .file-name {
    font-size: clamp(23px, 6.7vw, 30px);
  }
  .file-type {
    display: none;
  }
  .file-symbol {
    margin-left: auto;
  }
  .file-content {
    padding-left: 0;
    padding-bottom: 18px;
  }
  .file-description {
    font-size: 14px;
    line-height: 1.7;
  }
  .project-image {
    margin: 16px 0;
  }
  .file-links {
    margin-top: 12px;
    gap: 24px;
    font-size: 14px;
  }
  .file-links a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding-block: 8px;
  }
}
</style>

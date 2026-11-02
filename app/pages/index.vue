<script setup lang="ts">
import { projects } from '~/data/projects'
import ProjectFile from '~/components/projects/ProjectFile.vue'

definePageMeta({ layout: false, leftPanel: 'dev' })
useSeoMeta({ title: 'Julian Gojani · Home', description: 'Julian Gojani' })
const { selectedId } = useProjectSelection()
const expandedId = ref<string | null>(null)

function openProject(id: string) {
  selectedId.value = id
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <section class="project-index" aria-label="Projects">
    <ol class="project-files">
      <ProjectFile
        v-for="(project, index) in projects"
        :key="project.id"
        :project="project"
        :index="index"
        :expanded="expandedId === project.id"
        @toggle="openProject"
      />
    </ol>

    <footer class="index-footer">
      <div>
        <a href="https://github.com/julianfun123" target="_blank" rel="noopener noreferrer"
          >julianfun123 ↗</a
        ><a href="https://github.com/interaapps" target="_blank" rel="noopener noreferrer"
          >interaapps ↗</a
        >
      </div>
    </footer>
  </section>
</template>

<style scoped>
.project-index {
  padding: 8px 28px 28px;
  color: #202020;
}
.index-footer {
  padding-top: 30px;
  font-size: 10px;
  color: #aaa;
}
.index-footer > div {
  display: flex;
  gap: 18px;
}
.index-footer a:hover {
  color: #222;
}
button:focus-visible,
a:focus-visible {
  outline: 1px solid #222;
  outline-offset: 5px;
}

@media (max-width: 640px) {
  .project-index {
    padding: 4px 18px 26px;
  }
}
@media (max-width: 767px) {
  .project-index {
    padding: 0 16px 20px;
  }
  .index-footer {
    padding-top: 18px;
    font-size: 12px;
  }
  .index-footer > div {
    flex-wrap: wrap;
  }
  .index-footer a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
}
</style>

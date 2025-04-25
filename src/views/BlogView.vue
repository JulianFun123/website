<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const posts = ref<any[]>([])

onMounted(async () => {
  const { data } = await fetch(
    'https://quotysco.eu/api/v1/blogs/@JulianFun123/posts?limit=10&page=1\n',
  ).then((r) => r.json())
  posts.value = data
})
</script>
<template>
  <main class="p-10">
    <div class="flex flex-col w-full gap-2">
      <a
        v-for="post of posts"
        :href="`https://quotysco.eu/@JulianFun123/${post.url}`"
        class="block"
      >
        <span class="text-2xl">{{ post.title }}</span>
      </a>
    </div>
  </main>
</template>

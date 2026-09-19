<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import news from '../data/news.json'
import { formatDate } from '../utils/date'

const route = useRoute()
const article = computed(() => news.find((n) => n.id === route.params.newsId))
</script>

<template>
  <div v-if="!article" class="container">
    <div class="empty-state card">
      <p>Article not found.</p>
      <router-link to="/news" class="btn">Back to News</router-link>
    </div>
  </div>

  <div v-else class="container" style="max-width: 720px">
    <router-link
      to="/news"
      class="see-all"
      style="color: var(--accent-strong); font-weight: 700; font-size: 13px"
    >
      &larr; Back to News
    </router-link>
    <div style="margin-top: 16px; margin-bottom: 8px">
      <span class="badge">{{ article.tag }}</span>
    </div>
    <h1 style="font-size: 32px; margin-bottom: 8px">{{ article.title }}</h1>
    <p style="color: var(--text-dim); font-size: 13px; font-weight: 700; margin-bottom: 24px">
      {{ formatDate(article.date) }}
    </p>
    <p style="font-size: 16px; color: var(--text-muted); line-height: 1.7">{{ article.body }}</p>
  </div>
</template>

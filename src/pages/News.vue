<script setup>
import { computed } from 'vue'
import news from '../data/news.json'
import { formatDate } from '../utils/date'
import './News.css'

const sorted = computed(() => [...news].sort((a, b) => b.date.localeCompare(a.date)))
</script>

<template>
  <div class="container">
    <h1 class="section-title" style="font-size: 34px">News</h1>
    <p class="section-sub">Announcements from the club.</p>

    <div class="news-grid">
      <router-link v-for="n in sorted" :key="n.id" :to="`/news/${n.id}`" class="card news-card">
        <span class="badge">{{ n.tag }}</span>
        <h2 class="news-card-title">{{ n.title }}</h2>
        <p class="news-card-excerpt">{{ n.excerpt }}</p>
        <span class="news-card-date">{{ formatDate(n.date) }}</span>
      </router-link>
    </div>
  </div>
</template>

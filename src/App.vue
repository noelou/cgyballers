<script setup>
import ScrollToTop from './components/ScrollToTop.vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <ScrollToTop />
  <Navbar />
  <main class="page">
    <router-view />
  </main>
  <Footer />
</template>

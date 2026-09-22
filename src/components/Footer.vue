<script setup>
import './Footer.css'

const SPONSORS = [
  { src: '/sponsors/kagayan-real-estate.jpg', name: 'Kagayan Real Estate' },
  { src: '/sponsors/scents-and-stuffs.jpg', name: 'Scents and Stuffs' },
  { src: '/sponsors/tricon.png', name: 'Tricon Steel' },
  { src: '/sponsors/madman.png', name: 'Madman Construction Supplies' },
  { src: '/sponsors/cdo-metal-plus.png', name: 'CDO Metal Plus' },
  { src: '/sponsors/abaday.png', name: 'Abaday' },
  { src: '/sponsors/fliq.png', name: 'FLIQ Athletics' },
  { src: '/sponsors/warlyn.png', name: 'Warlyn' },
  { src: '/sponsors/ets.png', name: 'EasyDrive Transport Service' },
  { src: '/sponsors/maranding.jpg', name: 'Maranding Auto Parts' },
  { src: '/sponsors/amlan.jpg', name: 'Amlan Purified Water' }
]

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-sponsors">
        <span class="footer-heading">Sponsors</span>
        <div class="footer-sponsor-logos">
          <span class="footer-sponsor" v-for="s in SPONSORS" :key="s.src">
            <img :src="s.src" :alt="s.name" loading="lazy" width="70" height="60" />
          </span>
        </div>
      </div>

      <div class="footer-bottom">
        <span class="footer-dim">&copy; {{ year }} CGYBallers League</span>
        <span class="footer-dim">Built for hoopers, by hoopers.</span>
      </div>
    </div>
  </footer>
</template>

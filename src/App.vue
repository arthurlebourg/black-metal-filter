<script setup lang="ts">
import BlackMetalProcessor from './components/BlackMetalProcessor.vue'
</script>

<template>
  <div class="app-container">
    <header>
      <h1>KVLT IMAGE STUDIO</h1>
    </header>
    <main>
      <BlackMetalProcessor />
    </main>
  </div>
</template>

<style>
/* Quelques styles globaux pour l'ambiance */
body {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  background-color: #000;
  color: #fff;
}

.app-container {
  text-align: center;
}

header h1 {
  font-size: 3rem;
  letter-spacing: 0.5rem;
  margin: 2rem 0;
  text-shadow: 0 0 10px #ff0000;
}
</style>
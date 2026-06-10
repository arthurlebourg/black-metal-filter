<script setup lang="ts">
import { ref, watch } from 'vue'
import { applyBlackMetalStyle } from '../imageProcessing'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageUploaded = ref(false)
const originalImage = ref<HTMLImageElement | null>(null)
const isBaked = ref(false) // Permet de savoir si on affiche la version HD

// Paramètres réactifs
const grainNoiseIntensity = ref(100)
const contrastThreshold = ref(110)
const vignetteIntensity = ref(0.7)
const blurRadius = ref(1)
const useDithering = ref(false)

// Taille maximale pour la prévisualisation fluide
const MAX_PREVIEW_SIZE = 800

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalImage.value = img
      processImage(false) // On génère la preview basse résolution par défaut
    }
    img.src = e.target?.result as string
  }

  reader.readAsDataURL(file)
}

const processImage = (bakeMode : boolean) => {
  const canvas = canvasRef.value
  const img = originalImage.value
  if (!canvas || !img) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  let targetWidth = img.width
  let targetHeight = img.height

  if (!bakeMode) {
    const ratio = Math.min(MAX_PREVIEW_SIZE / img.width, MAX_PREVIEW_SIZE / img.height)
    if (ratio < 1) {
      targetWidth = Math.floor(img.width * ratio)
      targetHeight = Math.floor(img.height * ratio)
    }
  }

  canvas.width = targetWidth
  canvas.height = targetHeight
  
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
  
  imageUploaded.value = true
  isBaked.value = bakeMode

  applyBlackMetalStyle(canvas, {
  contrast: contrastThreshold.value, 
  vignetteIntensity: vignetteIntensity.value, 
  blurRadius: blurRadius.value, 
  grainNoiseIntensity: grainNoiseIntensity.value,
  useDithering: useDithering.value,
  colorLight: [230, 220, 200], 
  colorDark: [15, 10, 10]
})
}

watch([grainNoiseIntensity, contrastThreshold, vignetteIntensity, blurRadius, useDithering], () => {
  if (imageUploaded.value) {
    processImage(false)
  }
})

const bakeImage = () => {
  processImage(true)
}
</script>

<template>
  <div class="processor-container">
    <h2>Générateur Trve Kvlt</h2>
    
    <input type="file" accept="image/*" @change="handleImageUpload" />
    
    <div v-if="imageUploaded" class="controls-panel">
      <div class="slider-group">
        <label for="noise">Intensité de la crasse ({{ grainNoiseIntensity }})</label>
        <input 
          id="noise" 
          type="range" 
          min="0" 
          max="300" 
          v-model.number="grainNoiseIntensity" 
        />
      </div>

      <div class="slider-group">
        <label for="threshold">Seuil de Contraste ({{ contrastThreshold }})</label>
        <input 
          id="threshold" 
          type="range" 
          min="0" 
          max="255" 
          v-model.number="contrastThreshold" 
        />
      </div>

      <div class="slider-group">
        <label for="threshold">vignette Intensity({{ vignetteIntensity }})</label>
        <input 
          id="threshold" 
          type="range" 
          min="0" 
          max="1" 
          step="0.1"
          v-model.number="vignetteIntensity" 
        />
      </div>

      <div class="slider-group">
        <label for="threshold">Blur Radius ({{ blurRadius }})</label>
        <input 
          id="threshold" 
          type="range" 
          min="0" 
          max="10" 
          v-model.number="blurRadius" 
        />
      </div>

      <div class="actions">
        <button class="bake-btn" @click="bakeImage" :disabled="isBaked">
          {{ isBaked ? 'Rendu HD Terminé !' : '🔥 BAKE RESOLUTION FINALE 🔥' }}
        </button>
        <p v-if="isBaked" class="help-text">Clic-droit sur l'image pour la sauvegarder.</p>
        <p v-else class="help-text">Mode prévisualisation fluide activé.</p>
      </div>
    </div>

    <div class="canvas-wrapper">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<style scoped>
.processor-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background-color: #111;
  color: #fff;
}

.controls-panel {
  background-color: #222;
  padding: 1.5rem;
  border: 1px solid #444;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
  max-width: 400px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
}

.slider-group label {
  font-size: 0.9rem;
  color: #ccc;
  text-transform: uppercase;
  letter-spacing: 1px;
}

input[type="range"] {
  width: 100%;
  cursor: pointer;
}

.actions {
  margin-top: 0.5rem;
  text-align: center;
}

.bake-btn {
  width: 100%;
  background-color: #fff;
  color: #000;
  border: none;
  padding: 0.8rem;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
}

.bake-btn:hover:not(:disabled) {
  background-color: #ff0000;
  color: #fff;
}

.bake-btn:disabled {
  background-color: #333;
  color: #666;
  cursor: default;
}

.help-text {
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.5rem;
  font-style: italic;
}

canvas {
  max-width: 100%;
  border: 2px solid #333;
  margin-top: 1rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
}
</style>
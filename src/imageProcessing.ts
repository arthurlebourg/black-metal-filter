export interface ProcessingSettings {
    contrast: number; // -255 à 255
    vignetteIntensity: number; // 0 à 1
    blurRadius: number; // 0 à 5 (attention aux perfs si trop haut)
    grainNoiseIntensity: number; // 0 à 300
    useDithering: boolean;
    colorDark: [number, number, number]; // RGB [r, g, b]
    colorLight: [number, number, number]; // RGB [r, g, b]
}

// ------------------------------------------------------------------
// 1. NIVEAUX DE GRIS
// ------------------------------------------------------------------
const applyGrayscale = (data: Uint8ClampedArray) => {
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = data[i + 1] = data[i + 2] = gray;
    }
};

// ------------------------------------------------------------------
// 2. CONTRASTE DYNAMIQUE
// ------------------------------------------------------------------
const applyContrast = (data: Uint8ClampedArray, contrast: number) => {
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }
};

// ------------------------------------------------------------------
// 3. VIGNETTAGE
// ------------------------------------------------------------------
const applyVignette = (data: Uint8ClampedArray, width: number, height: number, intensity: number) => {
    if (intensity <= 0) return;
    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            const factor = 1 - (dist / maxDist) * intensity;

            data[idx] *= factor;
            data[idx + 1] *= factor;
            data[idx + 2] *= factor;
        }
    }
};

// ------------------------------------------------------------------
// 4. FLOU (INK BLEED) - Box Blur basique pour les performances
// ------------------------------------------------------------------
const applyBoxBlur = (data: Uint8ClampedArray, width: number, height: number, passes: number) => {
    if (passes <= 0) return;
    const copy = new Uint8ClampedArray(data);

    for (let p = 0; p < passes; p++) {
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                // On fait la moyenne du pixel et de ses voisins (haut, bas, gauche, droite)
                let sum = copy[idx] +
                    copy[idx - 4] + copy[idx + 4] +
                    copy[idx - width * 4] + copy[idx + width * 4];

                const avg = sum / 5;
                data[idx] = data[idx + 1] = data[idx + 2] = avg;
            }
        }
        copy.set(data);
    }
};

// ------------------------------------------------------------------
// 5. BRUIT (NOISE)
// ------------------------------------------------------------------
const applyNoise = (data: Uint8ClampedArray, intensity: number) => {
    if (intensity <= 0) return;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
    }
};

// ------------------------------------------------------------------
// 6. DITHERING (Floyd-Steinberg)
// ------------------------------------------------------------------
const applyFloydSteinberg = (data: Uint8ClampedArray, width: number, height: number) => {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            const oldPixel = data[idx];
            // Seuil binaire classique
            const newPixel = oldPixel < 128 ? 0 : 255;

            data[idx] = data[idx + 1] = data[idx + 2] = newPixel;

            const quantError = oldPixel - newPixel;

            // Diffusion de l'erreur sur les pixels voisins
            const distributeError = (ox: number, oy: number, ratio: number) => {
                if (x + ox >= 0 && x + ox < width && y + oy >= 0 && y + oy < height) {
                    const nIdx = ((y + oy) * width + (x + ox)) * 4;
                    const val = data[nIdx] + quantError * ratio;
                    data[nIdx] = data[nIdx + 1] = data[nIdx + 2] = val;
                }
            };

            distributeError(1, 0, 7 / 16);
            distributeError(-1, 1, 3 / 16);
            distributeError(0, 1, 5 / 16);
            distributeError(1, 1, 1 / 16);
        }
    }
};

// ------------------------------------------------------------------
// 7. DUOTONE / COLORISATION
// ------------------------------------------------------------------
const applyDuotone = (data: Uint8ClampedArray, dark: [number, number, number], light: [number, number, number]) => {
    for (let i = 0; i < data.length; i += 4) {
        const isLight = data[i] > 127;
        const color = isLight ? light : dark;

        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
    }
};

// ==================================================================
// PIPELINE PRINCIPAL : LE CHEF D'ORCHESTRE
// ==================================================================
export const applyBlackMetalStyle = (canvas: HTMLCanvasElement | null, settings: ProcessingSettings) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // --- L'ORDRE EST CRUCIAL ---
    applyGrayscale(data);
    applyContrast(data, settings.contrast);
    applyVignette(data, width, height, settings.vignetteIntensity);
    applyBoxBlur(data, width, height, settings.blurRadius);
    applyNoise(data, settings.grainNoiseIntensity);

    if (settings.useDithering) {
        applyFloydSteinberg(data, width, height);
    }

    // Optionnel : remplace le noir et blanc pur par tes propres couleurs
    applyDuotone(data, settings.colorDark, settings.colorLight);

    // Application sur le canvas
    ctx.putImageData(imageData, 0, 0);
};
class ProceduralTextures {
    constructor() {
        this.textureCache = new Map();
    }

    // Simplex-like noise function for procedural generation
    noise2D(x, y, seed = 0) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const a = this.p[X + seed] + Y;
        const b = this.p[X + 1 + seed] + Y;

        return this.lerp(v,
            this.lerp(u, this.grad(this.p[a], x, y), this.grad(this.p[b], x - 1, y)),
            this.lerp(u, this.grad(this.p[a + 1], x, y - 1), this.grad(this.p[b + 1], x - 1, y - 1))
        );
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    // Permutation table for noise
    p = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142,
        8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117,
        35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
        134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41,
        55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89,
        18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226,
        250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182,
        189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43,
        172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97,
        228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239,
        107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

    createSunTexture(size = 512, color = 0xffaa00) {
        const key = `sun_${size}_${color}`;
        if (this.textureCache.has(key)) return this.textureCache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;

        // Create radial gradient for sun
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${b})`);
        gradient.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
        gradient.addColorStop(1, `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 20)})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // Add surface detail with noise
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;
                const noise = this.noise2D(x * 0.02, y * 0.02, 42) * 0.3 +
                    this.noise2D(x * 0.05, y * 0.05, 123) * 0.15;

                data[i] = Math.min(255, data[i] + noise * 60);
                data[i + 1] = Math.min(255, data[i + 1] + noise * 40);
                data[i + 2] = Math.min(255, data[i + 2] + noise * 20);
            }
        }

        ctx.putImageData(imageData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        this.textureCache.set(key, texture);
        return texture;
    }

    createPlanetTexture(size = 512, type = 'desert') {
        const key = `planet_${size}_${type}`;
        if (this.textureCache.has(key)) return this.textureCache.get(key);

        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        const colors = {
            city: { base: [68, 68, 85], accent: [100, 100, 120], detail: [40, 40, 60] },
            industrial: { base: [85, 68, 51], accent: [120, 100, 80], detail: [60, 50, 40] },
            desert: { base: [237, 201, 175], accent: [200, 160, 120], detail: [180, 140, 100] },
            ice: { base: [221, 255, 255], accent: [180, 220, 240], detail: [140, 180, 200] },
            gas_giant: { base: [255, 170, 68], accent: [220, 140, 80], detail: [180, 110, 60] },
            volcanic: { base: [34, 17, 17], accent: [80, 40, 40], detail: [255, 34, 0] },
            forest: { base: [34, 139, 34], accent: [20, 100, 20], detail: [50, 160, 50] },
            rock: { base: [136, 136, 136], accent: [100, 100, 100], detail: [160, 160, 160] }
        };

        const colorScheme = colors[type] || colors.rock;

        // Fill base color
        ctx.fillStyle = `rgb(${colorScheme.base[0]}, ${colorScheme.base[1]}, ${colorScheme.base[2]})`;
        ctx.fillRect(0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // Generate procedural surface details
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const i = (y * size + x) * 4;

                // Multi-octave noise for realistic terrain
                let noise = 0;
                noise += this.noise2D(x * 0.01, y * 0.01, 1) * 0.5;
                noise += this.noise2D(x * 0.02, y * 0.02, 2) * 0.25;
                noise += this.noise2D(x * 0.04, y * 0.04, 3) * 0.125;
                noise += this.noise2D(x * 0.08, y * 0.08, 4) * 0.0625;

                // Apply noise to color
                const factor = noise * 0.5 + 0.5; // Normalize to 0-1

                data[i] = colorScheme.base[0] + (colorScheme.accent[0] - colorScheme.base[0]) * factor;
                data[i + 1] = colorScheme.base[1] + (colorScheme.accent[1] - colorScheme.base[1]) * factor;
                data[i + 2] = colorScheme.base[2] + (colorScheme.accent[2] - colorScheme.base[2]) * factor;

                // Add special features based on type
                if (type === 'city' && noise > 0.6) {
                    // City lights
                    data[i] += 20;
                    data[i + 1] += 20;
                    data[i + 2] += 30;
                } else if (type === 'volcanic' && noise > 0.7) {
                    // Lava veins
                    data[i] = colorScheme.detail[0];
                    data[i + 1] = colorScheme.detail[1];
                    data[i + 2] = colorScheme.detail[2];
                } else if (type === 'gas_giant') {
                    // Bands
                    const band = Math.sin(y * 0.05 + noise * 2) * 0.3;
                    data[i] += band * 40;
                    data[i + 1] += band * 30;
                    data[i + 2] += band * 20;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        this.textureCache.set(key, texture);
        return texture;
    }
}

window.ProceduralTextures = ProceduralTextures;

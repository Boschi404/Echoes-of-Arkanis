import * as THREE from 'three';
import type { MeshType, CanvasTextureType, TextureType, MeshStandardMaterialType } from '../rendering/Renderer';
import { SphereGeometry, MeshStandardMaterial, Mesh, CanvasTexture } from '../rendering/Renderer';

export interface Moon {
    name: string;
    radius: number;
    distance: number;
    speed: number;
    mesh: MeshType | null;
}

export class Planet {
    public name: string;
    public radius: number;
    public distance: number;
    public type: string;
    public speed: number;
    public moons: Moon[];
    public position: THREE.Vector3;

    private mesh: MeshType | null = null;

    constructor(name: string, radius: number, distance: number, type: string, speed: number, moons: Moon[] = []) {
        this.name = name;
        this.radius = radius;
        this.distance = distance;
        this.type = type;
        this.speed = speed;
        this.moons = moons;
        this.position = new THREE.Vector3(distance, 0, 0);
    }

    getMesh(): MeshType | null {
        return this.mesh;
    }

    createMesh(): void {
        if (!this.mesh) {
            const geometry = new SphereGeometry(this.radius, 64, 64);
            const { colorTex, heightTex } = this.generatePlanetTextures(1024, 512);
            // Ensure seamless wrapping to avoid visible seams
            // @ts-ignore
            colorTex.wrapS = THREE.RepeatWrapping;
            // @ts-ignore
            colorTex.wrapT = THREE.RepeatWrapping;
            // @ts-ignore
            heightTex.wrapS = THREE.RepeatWrapping;
            // @ts-ignore
            heightTex.wrapT = THREE.RepeatWrapping;
            const material: MeshStandardMaterialType = new MeshStandardMaterial({
                map: colorTex as unknown as TextureType,
                displacementMap: heightTex as unknown as TextureType,
                displacementScale: Math.max(1, Math.min(10, this.radius * 0.05)),
                bumpMap: heightTex as unknown as TextureType,
                bumpScale: 1.5,
                roughness: 1.0,
                metalness: 0.0
            }) as unknown as MeshStandardMaterialType;
            this.mesh = new Mesh(geometry, material);
            this.mesh.position.copy(this.position);
            // Attach useful data for UI/tracking/autopilot
            this.mesh.userData = {
                name: this.name,
                radius: this.radius,
                distance: this.distance,
                type: this.type,
                orbitSpeed: this.speed,
                orbitAngle: 0
            };
        }
    }

    setMesh(mesh: MeshType | null): void {
        this.mesh = mesh;
    }

    private generatePlanetTextures(width: number, height: number): { colorTex: CanvasTextureType, heightTex: CanvasTextureType } {
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = width;
        colorCanvas.height = height;
        const colorCtx = colorCanvas.getContext('2d')!;
        const heightCanvas = document.createElement('canvas');
        heightCanvas.width = width;
        heightCanvas.height = height;
        const heightCtx = heightCanvas.getContext('2d')!;

        const baseHue = this.type === 'gas giant' ? 35 : this.type === 'terrestrial' ? 200 : 180;
        const perlin = this.makePerlinTileable(width, height, 6, 4, 0.5, 2.0);
        const worley = this.makeWorleyTileable(width, height, 32, 16);

        const colorImg = colorCtx.createImageData(width, height);
        const heightImg = heightCtx.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                const p = perlin[y * width + x]; // 0..1
                const w = worley[y * width + x]; // 0..1
                const light = Math.min(1, Math.max(0, p));
                const sat = this.type === 'gas giant' ? 0.8 : 0.6;
                const val = 0.3 + 0.7 * light;
                const rgb = this.hsvToRgb(baseHue / 360, sat, val);

                colorImg.data[i] = rgb[0];
                colorImg.data[i + 1] = rgb[1];
                colorImg.data[i + 2] = rgb[2];
                colorImg.data[i + 3] = 255;

                const h = Math.max(0, Math.min(255, Math.floor(w * 255)));
                heightImg.data[i] = h;
                heightImg.data[i + 1] = h;
                heightImg.data[i + 2] = h;
                heightImg.data[i + 3] = 255;
            }
        }
        colorCtx.putImageData(colorImg, 0, 0);
        heightCtx.putImageData(heightImg, 0, 0);

        const colorTex = new CanvasTexture(colorCanvas) as unknown as CanvasTextureType;
        const heightTex = new CanvasTexture(heightCanvas) as unknown as CanvasTextureType;
        colorTex.needsUpdate = true;
        heightTex.needsUpdate = true;
        return { colorTex, heightTex };
    }

    private makePerlinTileable(width: number, height: number, scale: number, octaves: number, persistence: number, lacunarity: number): Float32Array {
        const noise = new Float32Array(width * height);
        const perm = new Uint8Array(512);
        for (let i = 0; i < 256; i++) perm[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = perm[i];
            perm[i] = perm[j];
            perm[j] = tmp;
        }
        for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
        const grad2 = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [-1, 1], [1, -1], [-1, -1]
        ];
        const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
        const lerp = (a: number, b: number, t: number) => a + t * (b - a);
        const dot2 = (g: number[], x: number, y: number) => g[0] * x + g[1] * y;
        const perlin2 = (x: number, y: number, period: number) => {
            // Tileable by wrapping coordinates with given period
            x = x % period;
            y = y % period;
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            const xf = x - Math.floor(x);
            const yf = y - Math.floor(y);
            const topRight = perm[perm[X + 1] + Y + 1] % 8;
            const topLeft = perm[perm[X] + Y + 1] % 8;
            const bottomRight = perm[perm[X + 1] + Y] % 8;
            const bottomLeft = perm[perm[X] + Y] % 8;
            const u = fade(xf);
            const v = fade(yf);
            const x1 = lerp(dot2(grad2[bottomLeft], xf, yf), dot2(grad2[bottomRight], xf - 1, yf), u);
            const x2 = lerp(dot2(grad2[topLeft], xf, yf - 1), dot2(grad2[topRight], xf - 1, yf - 1), u);
            return (lerp(x1, x2, v) + 1) / 2;
        };
        const period = 32;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let freq = scale;
                let amp = 1.0;
                let total = 0;
                for (let o = 0; o < octaves; o++) {
                    const nx = (x / width) * freq;
                    const ny = (y / height) * freq;
                    total += perlin2(nx, ny, period) * amp;
                    amp *= persistence;
                    freq *= lacunarity;
                }
                noise[y * width + x] = total / (2 - Math.pow(persistence, octaves - 1));
            }
        }
        return noise;
    }

    private makeWorleyTileable(width: number, height: number, gridX: number, gridY: number): Float32Array {
        const pts: { x: number, y: number }[][] = [];
        for (let gx = 0; gx < gridX; gx++) {
            pts[gx] = [];
            for (let gy = 0; gy < gridY; gy++) {
                const px = (gx + Math.random()) / gridX;
                const py = (gy + Math.random()) / gridY;
                pts[gx][gy] = { x: px, y: py };
            }
        }
        const worley = new Float32Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const nx = x / width;
                const ny = y / height;
                let dmin = Infinity;
                for (let gx = 0; gx < gridX; gx++) {
                    for (let gy = 0; gy < gridY; gy++) {
                        const p = pts[gx][gy];
                        let dx = Math.abs(nx - p.x);
                        let dy = Math.abs(ny - p.y);
                        dx = Math.min(dx, 1 - dx);
                        dy = Math.min(dy, 1 - dy);
                        const d = Math.sqrt(dx * dx + dy * dy);
                        if (d < dmin) dmin = d;
                    }
                }
                const v = 1 - Math.min(1, dmin * gridX);
                worley[y * width + x] = v;
            }
        }
        return worley;
    }

    private hsvToRgb(h: number, s: number, v: number): [number, number, number] {
        let r = 0, g = 0, b = 0;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
    }

    update(dt: number): void {
        if (this.mesh) {
            this.mesh.rotation.y += this.speed * dt;
        }
    }
}

import * as THREE from 'three';
import type { IModule } from '../core/Module';

// Export Three.js classes to isolate imports
export { THREE };
export const Scene = THREE.Scene;
export const PerspectiveCamera = THREE.PerspectiveCamera;
export const WebGLRenderer = THREE.WebGLRenderer;
export const Vector3 = THREE.Vector3;
export const Euler = THREE.Euler;
export const Object3D = THREE.Object3D;
export const Mesh = THREE.Mesh;
export const SphereGeometry = THREE.SphereGeometry;
export const BoxGeometry = THREE.BoxGeometry;
export const MeshBasicMaterial = THREE.MeshBasicMaterial;
export const MeshStandardMaterial = THREE.MeshStandardMaterial;
export const AmbientLight = THREE.AmbientLight;
export const HemisphereLight = THREE.HemisphereLight;
export const Texture = THREE.Texture;
export const CanvasTexture = THREE.CanvasTexture;

// Export types
export type SceneType = THREE.Scene;
export type PerspectiveCameraType = THREE.PerspectiveCamera;
export type WebGLRendererType = THREE.WebGLRenderer;
export type Vector3Type = THREE.Vector3;
export type EulerType = THREE.Euler;
export type Object3DType = THREE.Object3D;
export type MeshType = THREE.Mesh;
export type SphereGeometryType = THREE.SphereGeometry;
export type MeshBasicMaterialType = THREE.MeshBasicMaterial;
export type MeshStandardMaterialType = THREE.MeshStandardMaterial;
export type AmbientLightType = THREE.AmbientLight;
export type HemisphereLightType = THREE.HemisphereLight;
export type TextureType = THREE.Texture;
export type CanvasTextureType = THREE.CanvasTexture;

/**
 * Renderer class that encapsulates Three.js scene, camera, and renderer.
 * Isolates Three.js functionality within this module.
 */
export class Renderer implements IModule {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;

    constructor() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.01,
            10000000
        );

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Disable antialias for performance
            logarithmicDepthBuffer: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // Limit pixel ratio to 1 for maximum performance during testing
        this.renderer.setPixelRatio(1); 
    }

    init(): void {
        document.body.appendChild(this.renderer.domElement);

        // Add basic lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
        this.scene.add(hemi);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        
        console.log('Renderer initialized');
    }

    update(_dt: number): void {
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Debug: Log rendering stats rarely (every ~300 frames / 5 seconds)
        if (Math.random() < 0.003) {
             const info = this.renderer.info;
             console.log(`[Renderer] Calls: ${info.render.calls}, Triangles: ${info.render.triangles}, Objects: ${this.scene.children.length}`);
        }
    }

    dispose(): void {
        // Remove renderer from DOM
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }

        // Dispose of Three.js resources
        this.renderer.dispose();
        this.scene.clear();

        window.removeEventListener('resize', this.onWindowResize.bind(this));
        console.log('Renderer disposed');
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

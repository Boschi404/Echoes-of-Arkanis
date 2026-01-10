import * as THREE from 'three';
import { IModule } from '../interfaces/IModule';

/**
 * Rendering module that encapsulates Three.js scene, camera, and renderer.
 * Keeps Three.js strictly isolated within this module.
 */
export class RenderingModule implements IModule {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;

    init(): void {
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
        this.renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Add basic lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
        this.scene.add(hemi);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    update(dt: number): void {
        // Render the scene
        this.renderer.render(this.scene, this.camera);
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
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

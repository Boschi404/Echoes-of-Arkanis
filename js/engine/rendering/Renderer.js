import * as THREE from 'three';
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
export const AmbientLight = THREE.AmbientLight;
export const HemisphereLight = THREE.HemisphereLight;
/**
 * Renderer class that encapsulates Three.js scene, camera, and renderer.
 * Isolates Three.js functionality within this module.
 */
export class Renderer {
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 10000000);
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
    update(dt) {
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    dispose() {
        // Remove renderer from DOM
        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        // Dispose of Three.js resources
        this.renderer.dispose();
        this.scene.clear();
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
//# sourceMappingURL=Renderer.js.map
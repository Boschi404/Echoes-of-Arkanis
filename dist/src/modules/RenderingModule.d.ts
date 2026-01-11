import * as THREE from 'three';
import { IModule } from '../interfaces/IModule';
/**
 * Rendering module that encapsulates Three.js scene, camera, and renderer.
 * Keeps Three.js strictly isolated within this module.
 */
export declare class RenderingModule implements IModule {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    init(): void;
    update(dt: number): void;
    dispose(): void;
    private onWindowResize;
}
//# sourceMappingURL=RenderingModule.d.ts.map
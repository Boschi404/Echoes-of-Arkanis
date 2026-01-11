import { IModule } from '../interfaces/IModule.js';
/**
 * Rendering module that uses the isolated Renderer.
 * Provides access to scene, camera, and renderer for other modules.
 */
export declare class RenderingModule implements IModule {
    private renderer;
    constructor();
    get scene(): import("three").Scene<import("three").Object3DEventMap>;
    get camera(): import("three").PerspectiveCamera;
    get webglRenderer(): import("three").WebGLRenderer;
    init(): void;
    update(dt: number): void;
    dispose(): void;
}
//# sourceMappingURL=RenderingModule.d.ts.map
import { Renderer } from '../../engine/rendering/Renderer.js';
import { IModule } from '../interfaces/IModule.js';

/**
 * Rendering module that uses the isolated Renderer.
 * Provides access to scene, camera, and renderer for other modules.
 */
export class RenderingModule implements IModule {
    private renderer: Renderer;

    constructor() {
        this.renderer = new Renderer();
    }

    get scene() {
        return this.renderer.scene;
    }

    get camera() {
        return this.renderer.camera;
    }

    get webglRenderer() {
        return this.renderer.renderer;
    }

    init(): void {
        this.renderer.init();
    }

    update(dt: number): void {
        this.renderer.update(dt);
    }

    dispose(): void {
        this.renderer.dispose();
    }
}

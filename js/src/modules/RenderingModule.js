import { Renderer } from '../../engine/rendering/Renderer';
/**
 * Rendering module that uses the isolated Renderer.
 * Provides access to scene, camera, and renderer for other modules.
 */
export class RenderingModule {
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
    init() {
        this.renderer.init();
    }
    update(dt) {
        this.renderer.update(dt);
    }
    dispose() {
        this.renderer.dispose();
    }
}
//# sourceMappingURL=RenderingModule.js.map
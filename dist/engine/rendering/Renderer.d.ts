import { IModule } from '../core/Module';
/**
 * Basic rendering interface for 3D graphics.
 * This replaces Three.js WebGLRenderer functionality.
 */
export interface IRenderer {
    /**
     * Initialize the renderer with a canvas element.
     * @param canvas The HTML canvas element to render to.
     */
    init(canvas: HTMLCanvasElement): void;
    /**
     * Set the viewport size.
     * @param width Viewport width in pixels.
     * @param height Viewport height in pixels.
     */
    setSize(width: number, height: number): void;
    /**
     * Clear the render target.
     */
    clear(): void;
    /**
     * Render a scene.
     * @param scene The scene to render.
     * @param camera The camera to use for rendering.
     */
    render(scene: IScene, camera: ICamera): void;
    /**
     * Dispose of renderer resources.
     */
    dispose(): void;
}
/**
 * Basic scene interface.
 */
export interface IScene {
    /**
     * Add an object to the scene.
     * @param object The object to add.
     */
    add(object: IObject3D): void;
    /**
     * Remove an object from the scene.
     * @param object The object to remove.
     */
    remove(object: IObject3D): void;
    /**
     * Get all objects in the scene.
     */
    getObjects(): IObject3D[];
}
/**
 * Basic camera interface.
 */
export interface ICamera {
    /**
     * Get the projection matrix.
     */
    getProjectionMatrix(): Float32Array;
    /**
     * Get the view matrix.
     */
    getViewMatrix(): Float32Array;
    /**
     * Update the camera matrices.
     */
    updateMatrices(): void;
}
/**
 * Basic 3D object interface.
 */
export interface IObject3D {
    /**
     * Position vector.
     */
    position: Float32Array;
    /**
     * Rotation quaternion.
     */
    rotation: Float32Array;
    /**
     * Scale vector.
     */
    scale: Float32Array;
    /**
     * Get the world matrix.
     */
    getWorldMatrix(): Float32Array;
    /**
     * Update the world matrix.
     */
    updateWorldMatrix(): void;
}
/**
 * Basic WebGL renderer implementation.
 * This is a simplified replacement for Three.js WebGLRenderer.
 */
export declare class WebGLRenderer implements IRenderer, IModule {
    private canvas;
    private gl;
    private width;
    private height;
    init(): void;
    initWithCanvas(canvas: HTMLCanvasElement): void;
    setSize(width: number, height: number): void;
    clear(): void;
    render(scene: IScene, camera: ICamera): void;
    update(dt: number): void;
    dispose(): void;
}
//# sourceMappingURL=Renderer.d.ts.map
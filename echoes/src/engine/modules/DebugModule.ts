import type { IModule } from '../core/Module';

/**
 * Debug module for development and debugging purposes.
 * Provides utilities for logging, performance monitoring, and debugging features.
 */
export class DebugModule implements IModule {
    private fpsCounter: number = 0;
    private lastFpsUpdate: number = 0;
    private frameCount: number = 0;

    init(): void {
        console.log('DebugModule initialized');
        this.lastFpsUpdate = performance.now();
    }

    update(_dt: number): void {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsUpdate >= 1000) {
            this.fpsCounter = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            console.log(`FPS: ${this.fpsCounter}`);
        }
    }

    dispose(): void {
        console.log('DebugModule disposed');
    }
}

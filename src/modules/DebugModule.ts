import { IModule } from '../interfaces/IModule';
import { GAME_VERSION } from '../GameVersion';

/**
 * Debug Module provides debugging and tooling support.
 * Can be toggled on/off for development builds.
 */
export class DebugModule implements IModule {
    private fpsCounter!: FPSCounter;
    private performanceMonitor!: PerformanceMonitor;
    private debugUI!: DebugUI;

    // Debug flags
    private showFPS: boolean = false;
    private showPerformance: boolean = false;
    private showDebugUI: boolean = false;

    init(): void {
        console.log('Initializing Debug Module...');

        this.fpsCounter = new FPSCounter();
        this.performanceMonitor = new PerformanceMonitor();
        this.debugUI = new DebugUI();

        // Add keyboard shortcuts for debug toggles
        window.addEventListener('keydown', this.onKeyDown.bind(this));

        console.log('Debug Module initialized. Press F1/F2/F3 to toggle debug features.');
    }

    update(dt: number): void {
        if (this.showFPS) {
            this.fpsCounter.update(dt);
        }

        if (this.showPerformance) {
            this.performanceMonitor.update(dt);
        }

        if (this.showDebugUI) {
            this.debugUI.update(dt);
        }
    }

    dispose(): void {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));

        this.fpsCounter.dispose();
        this.performanceMonitor.dispose();
        this.debugUI.dispose();

        console.log('Debug Module disposed');
    }

    private onKeyDown(event: KeyboardEvent): void {
        switch (event.code) {
            case 'F1':
                this.showFPS = !this.showFPS;
                console.log('FPS Counter:', this.showFPS ? 'ON' : 'OFF');
                break;
            case 'F2':
                this.showPerformance = !this.showPerformance;
                console.log('Performance Monitor:', this.showPerformance ? 'ON' : 'OFF');
                break;
            case 'F3':
                this.showDebugUI = !this.showDebugUI;
                console.log('Debug UI:', this.showDebugUI ? 'ON' : 'OFF');
                break;
        }
    }

    // TODO: Add more debug features
    // - Object inspector
    // - Physics debugger
    // - Network profiler (for future multiplayer)
    // - Memory usage tracker
    // - Console commands
}

/**
 * Simple FPS counter.
 */
class FPSCounter {
    private fps: number = 0;
    private frameCount: number = 0;
    private lastTime: number = 0;

    update(dt: number): void {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round(this.frameCount / ((currentTime - this.lastTime) / 1000));
            this.frameCount = 0;
            this.lastTime = currentTime;

            console.log(`FPS: ${this.fps}`);
        }
    }

    dispose(): void {
        // Nothing to dispose
    }
}

/**
 * Basic performance monitor.
 */
class PerformanceMonitor {
    private lastMemoryUsage: number = 0;

    update(dt: number): void {
        // Log performance metrics every few seconds
        if (Math.random() < 0.01) { // ~1% chance per frame
            const memory = (performance as any).memory;
            if (memory) {
                console.log(`Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB used`);
            }
        }
    }

    dispose(): void {
        // Nothing to dispose
    }
}

/**
 * Debug UI overlay.
 */
class DebugUI {
    private debugDiv: HTMLDivElement | null = null;
    private versionDiv: HTMLDivElement | null = null;

    init(): void {
        // Version display - always visible
        this.versionDiv = document.createElement('div');
        this.versionDiv.id = 'version-ui';
        this.versionDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px;
            font-family: monospace;
            font-size: 12px;
            border-radius: 5px;
            z-index: 1000;
            display: block;
        `;
        this.versionDiv.textContent = `GAME_VERSION: ${GAME_VERSION}`;
        document.body.appendChild(this.versionDiv);

        // Debug info display - toggleable
        this.debugDiv = document.createElement('div');
        this.debugDiv.id = 'debug-ui';
        this.debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            border-radius: 5px;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(this.debugDiv);
    }

    update(dt: number): void {
        if (this.debugDiv && this.debugDiv.style.display !== 'none') {
            this.debugDiv.textContent = `Debug Info\nDelta Time: ${(dt * 1000).toFixed(2)}ms\nTime: ${Date.now()}`;
        }
    }

    show(): void {
        if (this.debugDiv) {
            this.debugDiv.style.display = 'block';
        }
    }

    hide(): void {
        if (this.debugDiv) {
            this.debugDiv.style.display = 'none';
        }
    }

    dispose(): void {
        if (this.versionDiv && this.versionDiv.parentNode) {
            this.versionDiv.parentNode.removeChild(this.versionDiv);
        }
        if (this.debugDiv && this.debugDiv.parentNode) {
            this.debugDiv.parentNode.removeChild(this.debugDiv);
        }
    }
}

import { GAME_VERSION } from '../GameVersion.js';
/**
 * Debug Module provides debugging and tooling support.
 * Can be toggled on/off for development builds.
 */
export class DebugModule {
    constructor() {
        // Debug flags
        this.showFPS = false;
        this.showPerformance = false;
        this.showDebugUI = false;
        // TODO: Add more debug features
        // - Object inspector
        // - Physics debugger
        // - Network profiler (for future multiplayer)
        // - Memory usage tracker
        // - Console commands
    }
    init() {
        console.log('Initializing Debug Module...');
        this.fpsCounter = new FPSCounter();
        this.performanceMonitor = new PerformanceMonitor();
        this.debugUI = new DebugUI();
        // Add keyboard shortcuts for debug toggles
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        console.log('Debug Module initialized. Press F1/F2/F3 to toggle debug features.');
    }
    update(dt) {
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
    dispose() {
        window.removeEventListener('keydown', this.onKeyDown.bind(this));
        this.fpsCounter.dispose();
        this.performanceMonitor.dispose();
        this.debugUI.dispose();
        console.log('Debug Module disposed');
    }
    onKeyDown(event) {
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
}
/**
 * Simple FPS counter.
 */
class FPSCounter {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
    }
    update(dt) {
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round(this.frameCount / ((currentTime - this.lastTime) / 1000));
            this.frameCount = 0;
            this.lastTime = currentTime;
            console.log(`FPS: ${this.fps}`);
        }
    }
    dispose() {
        // Nothing to dispose
    }
}
/**
 * Basic performance monitor.
 */
class PerformanceMonitor {
    constructor() {
        this.lastMemoryUsage = 0;
    }
    update(dt) {
        // Log performance metrics every few seconds
        if (Math.random() < 0.01) { // ~1% chance per frame
            const memory = performance.memory;
            if (memory) {
                console.log(`Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB used`);
            }
        }
    }
    dispose() {
        // Nothing to dispose
    }
}
/**
 * Debug UI overlay.
 */
class DebugUI {
    constructor() {
        this.debugDiv = null;
        this.versionDiv = null;
    }
    init() {
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
    update(dt) {
        if (this.debugDiv && this.debugDiv.style.display !== 'none') {
            this.debugDiv.textContent = `Debug Info\nDelta Time: ${(dt * 1000).toFixed(2)}ms\nTime: ${Date.now()}`;
        }
    }
    show() {
        if (this.debugDiv) {
            this.debugDiv.style.display = 'block';
        }
    }
    hide() {
        if (this.debugDiv) {
            this.debugDiv.style.display = 'none';
        }
    }
    dispose() {
        if (this.versionDiv && this.versionDiv.parentNode) {
            this.versionDiv.parentNode.removeChild(this.versionDiv);
        }
        if (this.debugDiv && this.debugDiv.parentNode) {
            this.debugDiv.parentNode.removeChild(this.debugDiv);
        }
    }
}
//# sourceMappingURL=DebugModule.js.map
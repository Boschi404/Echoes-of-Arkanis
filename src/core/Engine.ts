import { IModule } from '../interfaces/IModule';

/**
 * Main engine class that manages the game loop and all modules.
 * Provides a centralized system for initializing, updating, and disposing of modules.
 */
export class Engine {
    private modules: IModule[] = [];
    private isRunning: boolean = false;
    private lastTime: number = 0;

    /**
     * Add a module to the engine.
     * @param module The module to add.
     */
    addModule(module: IModule): void {
        this.modules.push(module);
    }

    /**
     * Initialize all modules.
     */
    init(): void {
        console.log('Initializing engine...');
        for (const module of this.modules) {
            module.init();
        }
        console.log('Engine initialized with', this.modules.length, 'modules');
    }

    /**
     * Start the game loop.
     */
    start(): void {
        if (this.isRunning) {
            console.warn('Engine is already running');
            return;
        }

        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
        console.log('Engine started');
    }

    /**
     * Stop the game loop.
     */
    stop(): void {
        this.isRunning = false;
        console.log('Engine stopped');
    }

    /**
     * Dispose of all modules and clean up resources.
     */
    dispose(): void {
        console.log('Disposing engine...');
        for (const module of this.modules) {
            module.dispose();
        }
        this.modules = [];
        console.log('Engine disposed');
    }

    /**
     * Main game loop.
     */
    private loop = (): void => {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const dt = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Update all modules
        for (const module of this.modules) {
            module.update(dt);
        }

        // Continue the loop
        requestAnimationFrame(this.loop);
    };
}

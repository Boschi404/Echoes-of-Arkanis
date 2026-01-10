import { IModule } from '../interfaces/IModule';

/**
 * Main Engine class that handles the game loop and manages all modules.
 * Provides a centralized way to initialize, update, and dispose of all systems.
 */
export class Engine {
    private modules: IModule[] = [];
    private isRunning: boolean = false;
    private lastTime: number = 0;

    /**
     * Add a module to the engine.
     * Modules will be initialized and updated in the order they are added.
     */
    addModule(module: IModule): void {
        this.modules.push(module);
    }

    /**
     * Initialize all modules.
     * Call this once before starting the game loop.
     */
    init(): void {
        console.log('Initializing engine modules...');
        for (const module of this.modules) {
            module.init();
        }
        console.log('Engine initialization complete');
    }

    /**
     * Start the game loop.
     * This begins the requestAnimationFrame loop that updates all modules.
     */
    start(): void {
        if (this.isRunning) {
            console.warn('Engine is already running');
            return;
        }

        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
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
     * Call this when shutting down the application.
     */
    dispose(): void {
        console.log('Disposing engine modules...');
        this.stop();

        // Dispose modules in reverse order
        for (let i = this.modules.length - 1; i >= 0; i--) {
            this.modules[i].dispose();
        }

        this.modules = [];
        console.log('Engine disposal complete');
    }

    /**
     * Main game loop using requestAnimationFrame.
     */
    private gameLoop = (): void => {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const dt = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Update all modules
        this.update(dt);

        // Schedule next frame
        requestAnimationFrame(this.gameLoop);
    };

    /**
     * Update all modules with the given delta time.
     */
    private update(dt: number): void {
        for (const module of this.modules) {
            module.update(dt);
        }
    }

    /**
     * Get the current running state of the engine.
     */
    getIsRunning(): boolean {
        return this.isRunning;
    }

    /**
     * Get the list of registered modules.
     */
    getModules(): readonly IModule[] {
        return this.modules;
    }
}

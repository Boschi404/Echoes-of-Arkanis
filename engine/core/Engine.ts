import { IModule } from './Module';

/**
 * Core Engine class that manages all modules and the game loop.
 * This replaces the Three.js dependency with a custom implementation.
 */
export class Engine {
    private modules: Map<string, IModule> = new Map();
    private running: boolean = false;
    private lastTime: number = 0;

    /**
     * Add a module to the engine.
     * @param name Unique name for the module.
     * @param module The module instance.
     */
    addModule(name: string, module: IModule): void {
        if (this.modules.has(name)) {
            throw new Error(`Module '${name}' is already added.`);
        }
        this.modules.set(name, module);
    }

    /**
     * Unregister a module from the engine.
     * @param name Name of the module to remove.
     */
    unregisterModule(name: string): void {
        if (!this.modules.has(name)) {
            console.warn(`Module '${name}' is not registered.`);
            return;
        }
        const module = this.modules.get(name)!;
        module.dispose();
        this.modules.delete(name);
    }

    /**
     * Get a registered module by name.
     * @param name Name of the module.
     * @returns The module instance or undefined if not found.
     */
    getModule<T extends IModule>(name: string): T | undefined {
        return this.modules.get(name) as T;
    }

    /**
     * Initialize all registered modules.
     */
    init(): void {
        console.log('Initializing Engine...');

        for (const [name, module] of this.modules) {
            try {
                console.log(`Initializing module: ${name}`);
                module.init();
            } catch (error) {
                console.error(`Failed to initialize module '${name}':`, error);
                throw error;
            }
        }

        console.log('Engine initialized successfully.');
    }

    /**
     * Start the engine's main loop.
     */
    start(): void {
        if (this.running) {
            console.warn('Engine is already running.');
            return;
        }

        console.log('Starting Engine...');
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    /**
     * Stop the engine's main loop.
     */
    stop(): void {
        if (!this.running) {
            console.warn('Engine is not running.');
            return;
        }

        console.log('Stopping Engine...');
        this.running = false;
    }

    /**
     * Main game loop.
     */
    private loop = (): void => {
        if (!this.running) {
            return;
        }

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        // Update all modules
        for (const [name, module] of this.modules) {
            try {
                module.update(deltaTime);
            } catch (error) {
                console.error(`Error updating module '${name}':`, error);
                // Continue with other modules even if one fails
            }
        }

        // Schedule next frame
        requestAnimationFrame(this.loop);
    };

    /**
     * Update all modules with the given delta time.
     * @param dt Delta time in seconds.
     */
    update(dt: number): void {
        for (const [name, module] of this.modules) {
            try {
                module.update(dt);
            } catch (error) {
                console.error(`Error updating module '${name}':`, error);
                // Continue with other modules even if one fails
            }
        }
    }

    /**
     * Dispose of all modules and clean up resources.
     */
    dispose(): void {
        console.log('Disposing Engine...');

        this.stop();

        for (const [name, module] of this.modules) {
            try {
                console.log(`Disposing module: ${name}`);
                module.dispose();
            } catch (error) {
                console.error(`Error disposing module '${name}':`, error);
            }
        }

        this.modules.clear();
        console.log('Engine disposed.');
    }
}

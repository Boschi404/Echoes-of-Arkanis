import { IModule } from './Module';
/**
 * Core Engine class that manages all modules and the game loop.
 * This replaces the Three.js dependency with a custom implementation.
 */
export declare class Engine {
    private modules;
    private running;
    private lastTime;
    /**
     * Add a module to the engine.
     * @param name Unique name for the module.
     * @param module The module instance.
     */
    addModule(name: string, module: IModule): void;
    /**
     * Unregister a module from the engine.
     * @param name Name of the module to remove.
     */
    unregisterModule(name: string): void;
    /**
     * Get a registered module by name.
     * @param name Name of the module.
     * @returns The module instance or undefined if not found.
     */
    getModule<T extends IModule>(name: string): T | undefined;
    /**
     * Initialize all registered modules.
     */
    init(): void;
    /**
     * Start the engine's main loop.
     */
    start(): void;
    /**
     * Stop the engine's main loop.
     */
    stop(): void;
    /**
     * Main game loop.
     */
    private loop;
    /**
     * Update all modules with the given delta time.
     * @param dt Delta time in seconds.
     */
    update(dt: number): void;
    /**
     * Dispose of all modules and clean up resources.
     */
    dispose(): void;
}
//# sourceMappingURL=Engine.d.ts.map
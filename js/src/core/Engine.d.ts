import { IModule } from '../interfaces/IModule.js';
/**
 * Main engine class that manages the game loop and all modules.
 * Provides a centralized system for initializing, updating, and disposing of modules.
 */
export declare class Engine {
    private modules;
    private isRunning;
    private lastTime;
    /**
     * Add a module to the engine.
     * @param module The module to add.
     */
    addModule(module: IModule): void;
    /**
     * Initialize all modules.
     */
    init(): void;
    /**
     * Start the game loop.
     */
    start(): void;
    /**
     * Stop the game loop.
     */
    stop(): void;
    /**
     * Dispose of all modules and clean up resources.
     */
    dispose(): void;
    /**
     * Main game loop.
     */
    private loop;
}
//# sourceMappingURL=Engine.d.ts.map
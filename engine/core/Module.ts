/**
 * Base interface for all engine modules.
 * Defines the lifecycle methods that all modules must implement.
 */
export interface IModule {
    /**
     * Initialize the module. Called once when the engine starts.
     */
    init(): void;

    /**
     * Update the module. Called every frame with delta time.
     * @param dt Delta time in seconds since last update.
     */
    update(dt: number): void;

    /**
     * Shutdown the module. Called when the engine stops.
     */
    dispose(): void;
}

/**
 * Base class for modules that provides common functionality.
 */
export abstract class BaseModule implements IModule {
    protected initialized: boolean = false;

    abstract init(): void;
    abstract update(dt: number): void;
    abstract dispose(): void;

    /**
     * Check if the module is initialized.
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Mark the module as initialized.
     */
    protected markInitialized(): void {
        this.initialized = true;
    }
}

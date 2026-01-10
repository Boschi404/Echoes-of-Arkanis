/**
 * Interface for all engine modules.
 * Each module must implement init(), update(dt), and dispose() methods.
 */
export interface IModule {
    /**
     * Initialize the module. Called once when the engine starts.
     */
    init(): void;

    /**
     * Update the module. Called every frame with delta time in seconds.
     * @param dt Delta time since last update.
     */
    update(dt: number): void;

    /**
     * Dispose of the module resources. Called when the engine shuts down.
     */
    dispose(): void;
}

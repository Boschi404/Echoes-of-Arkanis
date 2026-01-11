/**
 * Main engine class that manages the game loop and all modules.
 * Provides a centralized system for initializing, updating, and disposing of modules.
 */
export class Engine {
    constructor() {
        this.modules = [];
        this.isRunning = false;
        this.lastTime = 0;
        /**
         * Main game loop.
         */
        this.loop = () => {
            if (!this.isRunning)
                return;
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
    /**
     * Add a module to the engine.
     * @param module The module to add.
     */
    addModule(module) {
        this.modules.push(module);
    }
    /**
     * Initialize all modules.
     */
    init() {
        console.log('Initializing engine...');
        for (const module of this.modules) {
            module.init();
        }
        console.log('Engine initialized with', this.modules.length, 'modules');
    }
    /**
     * Start the game loop.
     */
    start() {
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
    stop() {
        this.isRunning = false;
        console.log('Engine stopped');
    }
    /**
     * Dispose of all modules and clean up resources.
     */
    dispose() {
        console.log('Disposing engine...');
        for (const module of this.modules) {
            module.dispose();
        }
        this.modules = [];
        console.log('Engine disposed');
    }
}
//# sourceMappingURL=Engine.js.map
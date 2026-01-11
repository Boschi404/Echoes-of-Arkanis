/**
 * Base class for modules that provides common functionality.
 */
export class BaseModule {
    constructor() {
        this.initialized = false;
    }
    /**
     * Check if the module is initialized.
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Mark the module as initialized.
     */
    markInitialized() {
        this.initialized = true;
    }
}
//# sourceMappingURL=Module.js.map
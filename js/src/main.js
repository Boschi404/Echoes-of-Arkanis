import { Engine } from '../engine/core/Engine.js';
import { Game } from './Game.js';
/**
 * Main entry point for the space exploration game engine.
 * Creates the engine, sets up the game, and starts the game loop.
 */
function main() {
    // Create the engine
    const engine = new Engine();
    // Create the game
    const game = new Game(engine);
    // Initialize the engine and all modules
    engine.init();
    // Start the game loop
    engine.start();
    console.log('Space Exploration Engine started successfully');
}
// Start the application when the DOM is loaded
window.addEventListener('DOMContentLoaded', main);
//# sourceMappingURL=main.js.map
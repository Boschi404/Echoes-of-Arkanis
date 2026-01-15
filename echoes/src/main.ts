import { Engine } from './engine/core/Engine';
import { Game } from './Game';

/**
 * Main entry point for the space exploration game engine.
 * Creates the engine, sets up the game, and starts the game loop.
 */
function main(): void {
    // Create the engine
    const engine = new Engine();

    // Create the game
    const game = new Game(engine);
    console.log('Game created:', game);

    // Initialize the engine and all modules
    engine.init();

    // Start the game loop
    engine.start();

    console.log('Space Exploration Engine started successfully');
}

// Start the application when the DOM is loaded
window.addEventListener('DOMContentLoaded', main);

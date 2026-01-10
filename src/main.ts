import { Engine } from '../engine/core/Engine';
import { RenderingModule } from './modules/RenderingModule';
import { WorldManager } from '../engine/world/WorldManager';
import { PlayerStateMachine } from './modules/PlayerStateMachine';
import { LODManager } from './modules/LODManager';
import { InputManager } from '../engine/input/InputManager';
import { DebugModule } from './modules/DebugModule';

/**
 * Main entry point for the space exploration game engine.
 * Instantiates the engine, adds modules, initializes the game, and starts the game loop.
 */
function main(): void {
    // Create the engine
    const engine = new Engine();

    // Create modules
    const renderingModule = new RenderingModule();
    const worldManager = new WorldManager();
    const playerStateMachine = new PlayerStateMachine(renderingModule.camera, renderingModule.scene);
    const lodManager = new LODManager(renderingModule.camera, worldManager);
    const inputManager = new InputManager();
    const debugModule = new DebugModule();

    // Register modules to the engine
    engine.registerModule(renderingModule);
    engine.registerModule(worldManager);
    engine.registerModule(playerStateMachine);
    engine.registerModule(lodManager);
    engine.registerModule(inputManager);
    engine.registerModule(debugModule);

    // Initialize the engine and all modules
    engine.init();

    // Start the game loop
    engine.start();

    console.log('Space Exploration Engine started successfully');
}

// Start the application when the DOM is loaded
window.addEventListener('DOMContentLoaded', main);

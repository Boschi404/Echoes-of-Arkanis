import { Engine } from "./engine/core/Engine.js";
import { RenderingModule } from './modules/RenderingModule.js';
import { WorldManager } from '../engine/world/WorldManager.js';
import { PlayerStateMachine } from './modules/PlayerStateMachine.js';
import { LODManager } from './modules/LODManager.js';
import { StreamingManager } from '../engine/streaming/StreamingManager.js';
import { InputManager } from '../engine/input/InputManager.js';
import { DebugModule } from './modules/DebugModule.js';
/**
 * Game class that encapsulates the creation and management of all game modules.
 * This class is responsible for setting up the game logic and adding modules to the engine.
 */
export class Game {
    constructor(engine) {
        this.engine = engine;
        this.initializeModules();
    }
    /**
     * Initialize and add all game modules to the engine.
     */
    initializeModules() {
        // Create modules
        const renderingModule = new RenderingModule();
        const inputManager = new InputManager();
        const worldManager = new WorldManager(renderingModule.scene);
        const playerStateMachine = new PlayerStateMachine(renderingModule.camera, renderingModule.scene, inputManager);
        const lodManager = new LODManager(renderingModule.camera, worldManager);
        const streamingManager = new StreamingManager(lodManager, worldManager, playerStateMachine);
        const debugModule = new DebugModule();
        // Add modules to the engine
        this.engine.addModule('rendering', renderingModule);
        this.engine.addModule('world', worldManager);
        this.engine.addModule('player', playerStateMachine);
        this.engine.addModule('lod', lodManager);
        this.engine.addModule('streaming', streamingManager);
        this.engine.addModule('input', inputManager);
        this.engine.addModule('debug', debugModule);
    }
}
//# sourceMappingURL=Game.js.map
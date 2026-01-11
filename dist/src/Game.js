import { RenderingModule } from './modules/RenderingModule';
import { WorldManager } from './modules/WorldManager';
import { PlayerStateMachine } from './modules/PlayerStateMachine';
import { LODManager } from './modules/LODManager';
import { InputManager } from '../engine/input/InputManager';
import { DebugModule } from './modules/DebugModule';
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
        const worldManager = new WorldManager(renderingModule.scene);
        const playerStateMachine = new PlayerStateMachine(renderingModule.camera, renderingModule.scene);
        const lodManager = new LODManager(renderingModule.camera, worldManager);
        const inputManager = new InputManager();
        const debugModule = new DebugModule();
        // Add modules to the engine
        this.engine.addModule('rendering', renderingModule);
        this.engine.addModule('world', worldManager);
        this.engine.addModule('player', playerStateMachine);
        this.engine.addModule('lod', lodManager);
        this.engine.addModule('input', inputManager);
        this.engine.addModule('debug', debugModule);
    }
}
//# sourceMappingURL=Game.js.map
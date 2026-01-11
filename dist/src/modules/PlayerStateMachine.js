import * as THREE from 'three';
/**
 * Player State Machine manages player states: FPS on planet, spaceship, orbit, warp.
 * Allows seamless switching between states.
 */
export var PlayerState;
(function (PlayerState) {
    PlayerState["SPACESHIP"] = "spaceship";
    PlayerState["FPS_ON_PLANET"] = "fps_on_planet";
    PlayerState["ORBIT"] = "orbit";
    PlayerState["WARP"] = "warp";
})(PlayerState || (PlayerState = {}));
/**
 * Represents the player's current state and position.
 */
export class PlayerData {
    constructor() {
        this.state = PlayerState.SPACESHIP;
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler();
    }
}
export class SpaceshipData {
    constructor() {
        this.thrust = 0;
        this.roll = 0;
    }
}
export class FPSData {
    constructor() {
        this.onGround = false;
        this.walkSpeed = 5;
    }
}
export class OrbitData {
    constructor() {
        this.orbitRadius = 1000;
    }
}
export class WarpData {
    constructor() {
        this.warpFactor = 1;
    }
}
export class PlayerStateMachine {
    constructor(camera, scene) {
        this.playerData = new PlayerData();
        // State handlers
        this.stateHandlers = new Map();
        this.camera = camera;
        this.scene = scene;
        // Initialize state handlers
        this.stateHandlers.set(PlayerState.SPACESHIP, new SpaceshipStateHandler());
        this.stateHandlers.set(PlayerState.FPS_ON_PLANET, new FPSStateHandler());
        this.stateHandlers.set(PlayerState.ORBIT, new OrbitStateHandler());
        this.stateHandlers.set(PlayerState.WARP, new WarpStateHandler());
    }
    init() {
        // Initialize to spaceship state
        this.switchState(PlayerState.SPACESHIP);
    }
    update(dt) {
        const handler = this.stateHandlers.get(this.playerData.state);
        if (handler) {
            handler.update(this.playerData, dt, this.camera, this.scene);
        }
    }
    dispose() {
        // Clean up state handlers
        this.stateHandlers.clear();
    }
    /**
     * Switch to a new player state with transition logic.
     */
    switchState(newState) {
        const oldHandler = this.stateHandlers.get(this.playerData.state);
        const newHandler = this.stateHandlers.get(newState);
        if (oldHandler) {
            oldHandler.exit(this.playerData);
        }
        this.playerData.state = newState;
        if (newHandler) {
            newHandler.enter(this.playerData);
        }
        console.log(`Player state switched to: ${newState}`);
    }
}
/**
 * Spaceship state handler.
 */
class SpaceshipStateHandler {
    enter(playerData) {
        if (!playerData.spaceshipData) {
            playerData.spaceshipData = new SpaceshipData();
        }
        // TODO: Attach camera to spaceship model
        // TODO: Enable spaceship controls
    }
    update(playerData, dt, camera, scene) {
        // TODO: Implement spaceship physics and controls
        // - Thrust, rotation, autopilot
        // - Collision detection
        // - Landing logic
    }
    exit(playerData) {
        // TODO: Detach camera from spaceship
        // TODO: Disable spaceship controls
    }
}
/**
 * FPS on planet state handler.
 */
class FPSStateHandler {
    enter(playerData) {
        if (!playerData.fpsData) {
            playerData.fpsData = new FPSData();
        }
        // TODO: Parent player to planet surface
        // TODO: Enable FPS controls (WASD, mouse look)
        // TODO: Add gravity and collision
    }
    update(playerData, dt, camera, scene) {
        // TODO: Implement FPS movement
        // - Walking, jumping
        // - Terrain interaction
        // - Planetary physics
    }
    exit(playerData) {
        // TODO: Unparent from planet
        // TODO: Disable FPS controls
    }
}
/**
 * Orbit state handler.
 */
class OrbitStateHandler {
    enter(playerData) {
        if (!playerData.orbitData) {
            playerData.orbitData = new OrbitData();
        }
        // TODO: Set up orbital camera controls
        // TODO: Calculate stable orbit
    }
    update(playerData, dt, camera, scene) {
        // TODO: Implement orbital mechanics
        // - Maintain orbit around target body
        // - Adjust orbit parameters
        // - Orbital transfers
    }
    exit(playerData) {
        // TODO: Exit orbital mode
    }
}
/**
 * Warp state handler.
 */
class WarpStateHandler {
    enter(playerData) {
        if (!playerData.warpData) {
            playerData.warpData = new WarpData();
        }
        // TODO: Initialize warp drive
        // TODO: Visual effects for warp
    }
    update(playerData, dt, camera, scene) {
        // TODO: Implement warp travel
        // - FTL movement between systems
        // - Warp factor adjustments
        // - Arrival at destination
    }
    exit(playerData) {
        // TODO: Exit warp and return to normal space
    }
}
//# sourceMappingURL=PlayerStateMachine.js.map
import * as THREE from 'three';
import { FPSControls } from '../../engine/input/FPSControls';
import { FlightControls } from '../../engine/input/FlightControls';
/**
 * Player State Machine manages player states: FPS, spaceship, orbit, warp.
 * Allows seamless switching between states.
 */
export var PlayerState;
(function (PlayerState) {
    PlayerState["FPS"] = "fps";
    PlayerState["SPACESHIP"] = "spaceship";
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
    constructor(camera, scene, inputManager) {
        this.playerData = new PlayerData();
        // State handlers
        this.stateHandlers = new Map();
        this.camera = camera;
        this.scene = scene;
        this.inputManager = inputManager;
        // Initialize controls
        this.fpsControls = new FPSControls(inputManager, camera);
        this.flightControls = new FlightControls(inputManager, camera);
        // Initialize state handlers
        this.stateHandlers.set(PlayerState.SPACESHIP, new SpaceshipStateHandler(this.flightControls));
        this.stateHandlers.set(PlayerState.FPS, new FPSStateHandler(this.fpsControls));
        this.stateHandlers.set(PlayerState.ORBIT, new OrbitStateHandler(this.flightControls));
        this.stateHandlers.set(PlayerState.WARP, new WarpStateHandler(this.flightControls));
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
        this.fpsControls = undefined;
        this.flightControls = undefined;
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
    constructor(flightControls) {
        this.flightControls = flightControls;
    }
    enter(playerData) {
        if (!playerData.spaceshipData) {
            playerData.spaceshipData = new SpaceshipData();
        }
        // TODO: Attach camera to spaceship model
        // TODO: Enable spaceship controls
    }
    update(playerData, dt, camera, scene) {
        // Only update flight controls if this is the active state
        this.flightControls.update(dt);
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
 * FPS state handler.
 */
class FPSStateHandler {
    constructor(fpsControls) {
        this.fpsControls = fpsControls;
    }
    enter(playerData) {
        if (!playerData.fpsData) {
            playerData.fpsData = new FPSData();
        }
        // TODO: Parent player to planet surface
        // TODO: Enable FPS controls (WASD, mouse look)
        // TODO: Add gravity and collision
    }
    update(playerData, dt, camera, scene) {
        // Only update FPS controls if this is the active state
        this.fpsControls.update(dt);
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
    constructor(flightControls) {
        this.flightControls = flightControls;
    }
    enter(playerData) {
        if (!playerData.orbitData) {
            playerData.orbitData = new OrbitData();
        }
        // TODO: Set up orbital camera controls
        // TODO: Calculate stable orbit
    }
    update(playerData, dt, camera, scene) {
        // Only update flight controls if this is the active state
        this.flightControls.update(dt);
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
    constructor(flightControls) {
        this.flightControls = flightControls;
    }
    enter(playerData) {
        if (!playerData.warpData) {
            playerData.warpData = new WarpData();
        }
        // TODO: Initialize warp drive
        // TODO: Visual effects for warp
    }
    update(playerData, dt, camera, scene) {
        // Only update flight controls if this is the active state
        this.flightControls.update(dt);
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
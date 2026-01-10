import * as THREE from 'three';
import { IModule } from '../interfaces/IModule';

/**
 * Player State Machine manages player states: FPS on planet, spaceship, orbit, warp.
 * Allows seamless switching between states.
 */
export enum PlayerState {
    SPACESHIP = 'spaceship',
    FPS_ON_PLANET = 'fps_on_planet',
    ORBIT = 'orbit',
    WARP = 'warp'
}

/**
 * Represents the player's current state and position.
 */
export class PlayerData {
    public state: PlayerState = PlayerState.SPACESHIP;
    public position: THREE.Vector3 = new THREE.Vector3();
    public velocity: THREE.Vector3 = new THREE.Vector3();
    public rotation: THREE.Euler = new THREE.Euler();

    // Additional state-specific data
    public spaceshipData?: SpaceshipData;
    public fpsData?: FPSData;
    public orbitData?: OrbitData;
    public warpData?: WarpData;
}

export class SpaceshipData {
    public thrust: number = 0;
    public roll: number = 0;
}

export class FPSData {
    public onGround: boolean = false;
    public walkSpeed: number = 5;
}

export class OrbitData {
    public targetBody?: THREE.Object3D;
    public orbitRadius: number = 1000;
}

export class WarpData {
    public warpFactor: number = 1;
    public targetSystem?: THREE.Vector3;
}

export class PlayerStateMachine implements IModule {
    public playerData: PlayerData = new PlayerData();
    private camera: THREE.Camera;
    private scene: THREE.Scene;

    // State handlers
    private stateHandlers: Map<PlayerState, IStateHandler> = new Map();

    constructor(camera: THREE.Camera, scene: THREE.Scene) {
        this.camera = camera;
        this.scene = scene;

        // Initialize state handlers
        this.stateHandlers.set(PlayerState.SPACESHIP, new SpaceshipStateHandler());
        this.stateHandlers.set(PlayerState.FPS_ON_PLANET, new FPSStateHandler());
        this.stateHandlers.set(PlayerState.ORBIT, new OrbitStateHandler());
        this.stateHandlers.set(PlayerState.WARP, new WarpStateHandler());
    }

    init(): void {
        // Initialize to spaceship state
        this.switchState(PlayerState.SPACESHIP);
    }

    update(dt: number): void {
        const handler = this.stateHandlers.get(this.playerData.state);
        if (handler) {
            handler.update(this.playerData, dt, this.camera, this.scene);
        }
    }

    dispose(): void {
        // Clean up state handlers
        this.stateHandlers.clear();
    }

    /**
     * Switch to a new player state with transition logic.
     */
    switchState(newState: PlayerState): void {
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

    // TODO: Implement seamless transitions between states
    // - Smooth camera interpolation during state changes
    // - Preserve momentum/velocity where appropriate
    // - Handle parenting/unparenting for FPS on planets
}

/**
 * Interface for state-specific handlers.
 */
interface IStateHandler {
    enter(playerData: PlayerData): void;
    update(playerData: PlayerData, dt: number, camera: THREE.Camera, scene: THREE.Scene): void;
    exit(playerData: PlayerData): void;
}

/**
 * Spaceship state handler.
 */
class SpaceshipStateHandler implements IStateHandler {
    enter(playerData: PlayerData): void {
        if (!playerData.spaceshipData) {
            playerData.spaceshipData = new SpaceshipData();
        }
        // TODO: Attach camera to spaceship model
        // TODO: Enable spaceship controls
    }

    update(playerData: PlayerData, dt: number, camera: THREE.Camera, scene: THREE.Scene): void {
        // TODO: Implement spaceship physics and controls
        // - Thrust, rotation, autopilot
        // - Collision detection
        // - Landing logic
    }

    exit(playerData: PlayerData): void {
        // TODO: Detach camera from spaceship
        // TODO: Disable spaceship controls
    }
}

/**
 * FPS on planet state handler.
 */
class FPSStateHandler implements IStateHandler {
    enter(playerData: PlayerData): void {
        if (!playerData.fpsData) {
            playerData.fpsData = new FPSData();
        }
        // TODO: Parent player to planet surface
        // TODO: Enable FPS controls (WASD, mouse look)
        // TODO: Add gravity and collision
    }

    update(playerData: PlayerData, dt: number, camera: THREE.Camera, scene: THREE.Scene): void {
        // TODO: Implement FPS movement
        // - Walking, jumping
        // - Terrain interaction
        // - Planetary physics
    }

    exit(playerData: PlayerData): void {
        // TODO: Unparent from planet
        // TODO: Disable FPS controls
    }
}

/**
 * Orbit state handler.
 */
class OrbitStateHandler implements IStateHandler {
    enter(playerData: PlayerData): void {
        if (!playerData.orbitData) {
            playerData.orbitData = new OrbitData();
        }
        // TODO: Set up orbital camera controls
        // TODO: Calculate stable orbit
    }

    update(playerData: PlayerData, dt: number, camera: THREE.Camera, scene: THREE.Scene): void {
        // TODO: Implement orbital mechanics
        // - Maintain orbit around target body
        // - Adjust orbit parameters
        // - Orbital transfers
    }

    exit(playerData: PlayerData): void {
        // TODO: Exit orbital mode
    }
}

/**
 * Warp state handler.
 */
class WarpStateHandler implements IStateHandler {
    enter(playerData: PlayerData): void {
        if (!playerData.warpData) {
            playerData.warpData = new WarpData();
        }
        // TODO: Initialize warp drive
        // TODO: Visual effects for warp
    }

    update(playerData: PlayerData, dt: number, camera: THREE.Camera, scene: THREE.Scene): void {
        // TODO: Implement warp travel
        // - FTL movement between systems
        // - Warp factor adjustments
        // - Arrival at destination
    }

    exit(playerData: PlayerData): void {
        // TODO: Exit warp and return to normal space
    }
}

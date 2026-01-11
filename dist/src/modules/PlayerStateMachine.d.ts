import * as THREE from 'three';
import { IModule } from '../interfaces/IModule';
/**
 * Player State Machine manages player states: FPS on planet, spaceship, orbit, warp.
 * Allows seamless switching between states.
 */
export declare enum PlayerState {
    SPACESHIP = "spaceship",
    FPS_ON_PLANET = "fps_on_planet",
    ORBIT = "orbit",
    WARP = "warp"
}
/**
 * Represents the player's current state and position.
 */
export declare class PlayerData {
    state: PlayerState;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    rotation: THREE.Euler;
    spaceshipData?: SpaceshipData;
    fpsData?: FPSData;
    orbitData?: OrbitData;
    warpData?: WarpData;
}
export declare class SpaceshipData {
    thrust: number;
    roll: number;
}
export declare class FPSData {
    onGround: boolean;
    walkSpeed: number;
}
export declare class OrbitData {
    targetBody?: THREE.Object3D;
    orbitRadius: number;
}
export declare class WarpData {
    warpFactor: number;
    targetSystem?: THREE.Vector3;
}
export declare class PlayerStateMachine implements IModule {
    playerData: PlayerData;
    private camera;
    private scene;
    private stateHandlers;
    constructor(camera: THREE.Camera, scene: THREE.Scene);
    init(): void;
    update(dt: number): void;
    dispose(): void;
    /**
     * Switch to a new player state with transition logic.
     */
    switchState(newState: PlayerState): void;
}
//# sourceMappingURL=PlayerStateMachine.d.ts.map
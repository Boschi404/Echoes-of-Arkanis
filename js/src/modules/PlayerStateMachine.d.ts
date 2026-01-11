import * as THREE from 'three';
import { IModule } from '../interfaces/IModule';
import { Vector3Type, PerspectiveCameraType, SceneType, Object3DType } from '../../engine/rendering/Renderer';
import { InputManager } from '../../engine/input/InputManager';
/**
 * Player State Machine manages player states: FPS, spaceship, orbit, warp.
 * Allows seamless switching between states.
 */
export declare enum PlayerState {
    FPS = "fps",
    SPACESHIP = "spaceship",
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
    targetBody?: Object3DType;
    orbitRadius: number;
}
export declare class WarpData {
    warpFactor: number;
    targetSystem?: Vector3Type;
}
export declare class PlayerStateMachine implements IModule {
    playerData: PlayerData;
    private camera;
    private scene;
    private inputManager;
    private fpsControls?;
    private flightControls?;
    private stateHandlers;
    constructor(camera: PerspectiveCameraType, scene: SceneType, inputManager: InputManager);
    init(): void;
    update(dt: number): void;
    dispose(): void;
    /**
     * Switch to a new player state with transition logic.
     */
    switchState(newState: PlayerState): void;
}
//# sourceMappingURL=PlayerStateMachine.d.ts.map
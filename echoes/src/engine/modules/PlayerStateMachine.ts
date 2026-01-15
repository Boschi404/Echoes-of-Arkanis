import * as THREE from 'three';
import { 
    Group, 
    ConeGeometry, 
    BoxGeometry, 
    MeshBasicMaterial,
    Mesh,
    PerspectiveCamera,
    Raycaster,
    Vector2
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { IModule } from '../core/Module';
import type { Vector3Type, PerspectiveCameraType, SceneType, Object3DType } from '../rendering/Renderer';
import { FPSControls } from '../input/FPSControls';
import { FlightControls } from '../input/FlightControls';
import { InputManager } from '../input/InputManager';

/**
 * Player State Machine manages player states: FPS, spaceship, orbit, warp.
 * Allows seamless switching between states.
 */
export const PlayerState = {
    FPS: 'fps',
    SPACESHIP: 'spaceship',
    ORBIT: 'orbit',
    WARP: 'warp'
} as const;

export type PlayerState = typeof PlayerState[keyof typeof PlayerState];

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
    public targetBody?: Object3DType;
    public orbitRadius: number = 1000;
}

export class WarpData {
    public warpFactor: number = 1;
    public targetSystem?: Vector3Type;
}

export class PlayerStateMachine implements IModule {
    public playerData: PlayerData = new PlayerData();
    private camera: PerspectiveCameraType;
    private scene: SceneType;
    private fpsControls?: FPSControls;
    private flightControls?: FlightControls;
    private inputManager: InputManager;
    private thirdPerson: boolean = false;
    private prevVPressed: boolean = false;
    private raycaster: Raycaster = new Raycaster();
    private mouseNDC: Vector2 = new Vector2();
    private hoverTarget: Object3DType | null = null;
    private trackingTarget: Object3DType | null = null;
    private autopilotOn: boolean = false;
    private prevLPressed: boolean = false;
    private prevOPressed: boolean = false;
    private baseFov: number = 75;
    private currentFov: number = 75;
    private screenshake: number = 0.5;
    private shakePhase: number = 0;
    private speedLinesCanvas: HTMLCanvasElement | null = null;
    private speedLinesCtx: CanvasRenderingContext2D | null = null;
    private speedLinesStreaks: { x: number, y: number, len: number, speed: number }[] = [];

    // State handlers
    private stateHandlers: Map<PlayerState, IStateHandler> = new Map();

    constructor(camera: PerspectiveCameraType, scene: SceneType, inputManager: InputManager) {
        this.camera = camera;
        this.scene = scene;
        this.inputManager = inputManager;

        // Initialize controls
        this.fpsControls = new FPSControls(inputManager, camera as THREE.PerspectiveCamera);
        this.flightControls = new FlightControls(inputManager, camera as THREE.PerspectiveCamera);

        // Initialize state handlers
        this.stateHandlers.set(PlayerState.SPACESHIP, new SpaceshipStateHandler(this.flightControls, camera as PerspectiveCamera));
        this.stateHandlers.set(PlayerState.FPS, new FPSStateHandler(this.fpsControls));
        this.stateHandlers.set(PlayerState.ORBIT, new OrbitStateHandler(this.flightControls));
        this.stateHandlers.set(PlayerState.WARP, new WarpStateHandler(this.flightControls));
    }

    init(): void {
        // Initialize to spaceship state
        this.switchState(PlayerState.SPACESHIP);
    }

    update(dt: number): void {
        const handler = this.stateHandlers.get(this.playerData.state);
        if (handler) {
            handler.update(this.playerData, dt, this.camera, this.scene);
            if (this.flightControls) {
                this.playerData.velocity.copy(this.flightControls.getVelocity());
            }
            if (this.flightControls) {
                const acc = this.flightControls.getAcceleration().length();
                const targetFov = this.baseFov + Math.min(14, acc * 1.2);
                this.currentFov += (targetFov - this.currentFov) * Math.min(1, dt * 5);
                (this.camera as THREE.PerspectiveCamera).fov = this.currentFov;
                (this.camera as THREE.PerspectiveCamera).updateProjectionMatrix();
                const speed = this.playerData.velocity.length();
                const shakeAmt = Math.min(1, Math.max(0, (speed - 1000) / 1000)) * this.screenshake;
                this.shakePhase += dt * 7;
                const sx = Math.sin(this.shakePhase * 1.3) * 0.2 * shakeAmt;
                const sy = Math.sin(this.shakePhase * 1.7) * 0.15 * shakeAmt;
                (this.camera as THREE.PerspectiveCamera).position.add(new THREE.Vector3(sx, sy, 0));
                if (!this.speedLinesCanvas) {
                    this.speedLinesCanvas = document.getElementById('speed-lines') as HTMLCanvasElement;
                    if (this.speedLinesCanvas) {
                        this.speedLinesCtx = this.speedLinesCanvas.getContext('2d');
                    }
                }
                if (this.speedLinesCanvas && this.speedLinesCtx) {
                    this.speedLinesCanvas.width = window.innerWidth;
                    this.speedLinesCanvas.height = window.innerHeight;
                    const ctx = this.speedLinesCtx;
                    ctx.clearRect(0, 0, this.speedLinesCanvas.width, this.speedLinesCanvas.height);
                    const count = Math.min(100, Math.floor(speed / 20));
                    if (this.speedLinesStreaks.length < count) {
                        for (let i = this.speedLinesStreaks.length; i < count; i++) {
                            this.speedLinesStreaks.push({
                                x: Math.random() * this.speedLinesCanvas.width,
                                y: Math.random() * this.speedLinesCanvas.height,
                                len: 10 + Math.random() * 50,
                                speed: 200 + Math.random() * 600
                            });
                        }
                    } else if (this.speedLinesStreaks.length > count) {
                        this.speedLinesStreaks.length = count;
                    }
                    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
                    ctx.lineWidth = 2;
                    for (const s of this.speedLinesStreaks) {
                        s.y += (s.speed * dt);
                        if (s.y - s.len > this.speedLinesCanvas.height) {
                            s.y = -10;
                            s.x = Math.random() * this.speedLinesCanvas.width;
                            s.len = 10 + Math.random() * 50;
                            s.speed = 200 + Math.random() * 600;
                        }
                        ctx.beginPath();
                        ctx.moveTo(s.x, s.y);
                        ctx.lineTo(s.x, s.y - s.len);
                        ctx.stroke();
                    }
                }
            }

            const vPressed = this.inputManager.isKeyPressed('KeyV');
            if (vPressed && !this.prevVPressed) {
                this.thirdPerson = !this.thirdPerson;
                const sh = this.stateHandlers.get(PlayerState.SPACESHIP);
                if (sh && sh instanceof SpaceshipStateHandler) {
                    sh.setThirdPerson(this.thirdPerson);
                }
            }
            this.prevVPressed = vPressed;

            this.playerData.position.copy(this.camera.position);
            this.playerData.rotation.copy(this.camera.rotation);
            const speedEl = document.getElementById('speed');
            const barEl = document.getElementById('speed-bar');
            if (speedEl) {
                const speed = this.playerData.velocity.length();
                speedEl.textContent = `${speed.toFixed(2)} km/s`;
                if (barEl) {
                    const max = 1000;
                    const pct = Math.max(0, Math.min(100, (speed / max) * 100));
                    (barEl as HTMLElement).style.width = `${pct}%`;
                }
            }
            const driftEl = document.getElementById('drift-reticle');
            if (driftEl) {
                const v = this.playerData.velocity.clone();
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                const dot = v.dot(forward);
                const s = v.length();
                let ox = 0, oy = 0;
                if (s > 0.0001 && dot > 0) {
                    const target = this.camera.position.clone().add(v.clone().normalize().multiplyScalar(1000));
                    const ndc = target.clone().project(this.camera as THREE.PerspectiveCamera);
                    ox = ndc.x * (window.innerWidth / 2);
                    oy = -ndc.y * (window.innerHeight / 2);
                    const maxX = window.innerWidth * 0.45;
                    const maxY = window.innerHeight * 0.45;
                    ox = Math.max(-maxX, Math.min(maxX, ox));
                    oy = Math.max(-maxY, Math.min(maxY, oy));
                }
                const el = driftEl as HTMLElement;
                el.style.left = `calc(50% + ${ox}px)`;
                el.style.top = `calc(50% + ${oy}px)`;
                el.style.opacity = dot > 0 ? '0.5' : '0';
            }
        }
        const mouse = this.inputManager.getMouseState();
        this.mouseNDC.set((mouse.x / window.innerWidth) * 2 - 1, -(mouse.y / window.innerHeight) * 2 + 1);
        this.raycaster.setFromCamera(this.mouseNDC, this.camera as THREE.PerspectiveCamera);
        const intersects = this.raycaster.intersectObjects((this.scene as THREE.Scene).children, true);
        let best: THREE.Object3D | null = null;
        for (const i of intersects) {
            const obj = i.object;
            if (obj.userData && obj.userData.radius && obj.userData.name) {
                best = obj;
                break;
            }
        }
        this.hoverTarget = best as Object3DType | null;
        const tName = document.getElementById('t-name') as HTMLElement | null;
        const tSys = document.getElementById('t-system') as HTMLElement | null;
        const tSize = document.getElementById('t-size') as HTMLElement | null;
        const tDist = document.getElementById('t-dist') as HTMLElement | null;
        const tSpeed = document.getElementById('t-speed') as HTMLElement | null;
        const tStatus = document.getElementById('t-status') as HTMLElement | null;
        const apStatus = document.getElementById('ap-status') as HTMLElement | null;
        if (tName && tSys && tSize && tDist && tSpeed && tStatus) {
            if (this.hoverTarget) {
                const d = this.hoverTarget.userData;
                tName.textContent = d.name ?? '---';
                tSys.textContent = `SISTEMA: ${d.system ?? '---'}`;
                tSize.textContent = `DIMENSIONE: ${(d.radius ? (d.radius * 2).toFixed(0) : '---')}`;
                tDist.textContent = `DISTANZA: ${d.distance?.toFixed(0) ?? '---'}`;
                tSpeed.textContent = `VEL. PIANETA: ${d.orbitSpeed?.toFixed(4) ?? '---'}`;
            } else {
                tName.textContent = 'SEARCHING...';
                tSys.textContent = 'SISTEMA: ---';
                tSize.textContent = 'DIMENSIONE: ---';
                tDist.textContent = 'DISTANZA: ---';
                tSpeed.textContent = 'VEL. PIANETA: ---';
            }
            tStatus.textContent = this.trackingTarget ? 'LOCKED' : 'SEARCHING';
        }
        if (apStatus) {
            apStatus.style.display = this.autopilotOn ? 'block' : 'none';
        }
        const lPressed = this.inputManager.isKeyPressed('KeyL');
        if (lPressed && !this.prevLPressed) {
            if (this.trackingTarget) {
                this.trackingTarget = null;
            } else {
                this.trackingTarget = this.hoverTarget;
            }
        }
        this.prevLPressed = lPressed;
        if (this.trackingTarget) {
            const wp = (this.trackingTarget as THREE.Object3D).getWorldPosition(new THREE.Vector3());
            (this.camera as THREE.PerspectiveCamera).lookAt(wp);
        }
        const oPressed = this.inputManager.isKeyPressed('KeyO');
        if (oPressed && !this.prevOPressed && this.trackingTarget) {
            if (this.autopilotOn) {
                this.autopilotOn = false;
                if (this.flightControls) this.flightControls.stopAutopilot();
            } else {
                this.autopilotOn = true;
                if (this.flightControls) this.flightControls.startAutopilot();
            }
        }
        this.prevOPressed = oPressed;
        if (this.flightControls && this.trackingTarget && this.autopilotOn) {
            const target = this.trackingTarget as THREE.Object3D;
            const d = target.userData;
            const center: THREE.Vector3 = d.orbitCenter ? d.orbitCenter.clone() : new THREE.Vector3();
            const radius = d.radius ? d.radius : 100;
            const dist = d.distance ? d.distance : 1000;
            const ang = d.orbitAngle ? d.orbitAngle : 0;
            const omega = d.orbitSpeed ? d.orbitSpeed : 0.001;
            const shipPos = (this.camera as THREE.PerspectiveCamera).position.clone();
            const rVec = target.getWorldPosition(new THREE.Vector3()).clone().sub(shipPos);
            const speed = this.playerData.velocity.length();
            const tArr = Math.max(1, rVec.length() / Math.max(1, speed));
            const predAng = ang + omega * tArr;
            const predPos = new THREE.Vector3(
                center.x + Math.cos(predAng) * dist,
                center.y,
                center.z + Math.sin(predAng) * dist
            );
            const approach = radius * 6;
            const dirToCenter = shipPos.clone().sub(predPos).normalize();
            const stopPos = predPos.clone().add(dirToCenter.multiplyScalar(approach));
            (this.camera as THREE.PerspectiveCamera).lookAt(stopPos);
            const toStop = stopPos.clone().sub(shipPos);
            const distToStop = toStop.length();
            const userAccel = this.flightControls.getManualAccelForward();
            const userBrake = this.flightControls.getManualAccelReverseBoost();
            const brakeDist = (speed * speed) / (2 * Math.max(0.0001, userBrake));
            let desiredWorldAccel: THREE.Vector3;
            if (distToStop > brakeDist + 2) {
                desiredWorldAccel = toStop.clone().normalize().multiplyScalar(userAccel).sub(this.playerData.velocity.clone().multiplyScalar(0.2));
            } else {
                desiredWorldAccel = this.playerData.velocity.clone().normalize().multiplyScalar(-userBrake).add(toStop.clone().normalize().multiplyScalar(userAccel * 0.05));
            }
            const invQ = (this.camera as THREE.PerspectiveCamera).quaternion.clone().invert();
            const desiredLocal = desiredWorldAccel.clone().applyQuaternion(invQ);
            this.flightControls.setAutopilotAccel(desiredLocal);
            const stopTolerance = Math.max(1, approach * 0.01);
            if (distToStop <= stopTolerance && speed <= 0.2) {
                this.flightControls.stopAutopilot();
                this.trackingTarget = null;
                this.autopilotOn = false;
            }
        }
    }

    setScreenshake(value01: number): void {
        this.screenshake = Math.max(0, Math.min(1, value01));
    }

    dispose(): void {
        // Clean up state handlers
        this.stateHandlers.clear();
        this.fpsControls = undefined;
        this.flightControls = undefined;
    }
    
    setRotationMode(mode: 'steer' | 'look'): void {
        if (this.flightControls) {
            this.flightControls.setRotationMode(mode);
        }
    }
    setControlsEnabled(enabled: boolean): void {
        if (this.flightControls) {
            this.flightControls.setControlsEnabled(enabled);
        }
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
    update(playerData: PlayerData, dt: number, camera: PerspectiveCameraType, scene: SceneType): void;
    exit(playerData: PlayerData): void;
}

/**
 * Spaceship state handler.
 */
class SpaceshipStateHandler implements IStateHandler {
    private flightControls: FlightControls;
    private camera: PerspectiveCamera;
    private shipModel: Group | null = null;
    private thirdPerson: boolean = false;
    private loader: GLTFLoader = new GLTFLoader();
    private gltfLoaded: boolean = false;
    private exhaust?: THREE.Points;
    private exhaustGeom?: THREE.BufferGeometry;
    private exhaustMat?: THREE.PointsMaterial;

    constructor(flightControls: FlightControls, camera: PerspectiveCamera) {
        this.flightControls = flightControls;
        this.camera = camera;
    }

    enter(playerData: PlayerData): void {
        if (!playerData.spaceshipData) {
            playerData.spaceshipData = new SpaceshipData();
        }
        
        if (!this.shipModel) {
            this.shipModel = new Group();
            this.tryLoadGLTF();
            if (this.shipModel.children.length === 0) {
                const bodyGeo = new BoxGeometry(6, 6, 6);
                const bodyMat = new MeshBasicMaterial({ color: 0x00aaff });
                const body = new Mesh(bodyGeo, bodyMat);
                this.shipModel.add(body);
                const pyramidGeo = new ConeGeometry(3, 6, 4);
                const pyramidMat = new MeshBasicMaterial({ color: 0x0088cc });
                const pyramid = new Mesh(pyramidGeo, pyramidMat);
                pyramid.rotation.x = -Math.PI / 2;
                pyramid.position.set(0, 0, -6);
                this.shipModel.add(pyramid);
            }

            this.shipModel.position.set(0, -2.5, -8);
            this.camera.add(this.shipModel);
            const particleCount = 200;
            this.exhaustGeom = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            for (let i = 0; i < particleCount; i++) {
                positions[i*3] = 0;
                positions[i*3+1] = 0;
                positions[i*3+2] = 0;
            }
            this.exhaustGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            this.exhaustMat = new THREE.PointsMaterial({ color: 0xffaa00, size: 0.2, transparent: true, opacity: 0.7 });
            this.exhaust = new THREE.Points(this.exhaustGeom, this.exhaustMat);
            this.shipModel.add(this.exhaust);
        }
        
        this.shipModel.visible = true;
    }

    update(_playerData: PlayerData, dt: number, _camera: PerspectiveCameraType, _scene: SceneType): void {
        // Only update flight controls if this is the active state
        this.flightControls.update(dt);
        if (this.shipModel) {
            if (this.thirdPerson) {
                if (this.shipModel.parent !== (_scene as THREE.Scene)) {
                    this.camera.remove(this.shipModel);
                    (_scene as THREE.Scene).add(this.shipModel);
                }
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
                const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
                const pos = this.camera.position.clone().add(forward.multiplyScalar(90)).add(up.multiplyScalar(-30));
                this.shipModel.position.copy(pos);
                this.shipModel.quaternion.copy(this.camera.quaternion);
                this.shipModel.rotateY(Math.PI);
                const swayPitch = (this.flightControls?.getPitchInput() ?? 0) * 0.08;
                const swayRoll = (this.flightControls?.getRollInput() ?? 0) * 0.12;
                this.shipModel.rotateX(swayPitch);
                this.shipModel.rotateZ(swayRoll);
            } else {
                if (this.shipModel.parent !== this.camera) {
                    (_scene as THREE.Scene).remove(this.shipModel);
                    this.camera.add(this.shipModel);
                }
                this.shipModel.position.set(0, -2.5, -8);
                this.shipModel.rotation.set(0, Math.PI, 0);
                const swayPitch = (this.flightControls?.getPitchInput() ?? 0) * 0.05;
                const swayRoll = (this.flightControls?.getRollInput() ?? 0) * 0.08;
                this.shipModel.rotateX(swayPitch);
                this.shipModel.rotateZ(swayRoll);
            }
            if (this.exhaust && this.exhaustGeom) {
                const posAttr = this.exhaustGeom.getAttribute('position') as THREE.BufferAttribute;
                const thrusting = this.flightControls.getThrustingForward();
                const dir = new THREE.Vector3(0,0,1).applyQuaternion(this.shipModel.quaternion);
                for (let i = 0; i < posAttr.count; i++) {
                    let x = posAttr.getX(i);
                    let y = posAttr.getY(i);
                    let z = posAttr.getZ(i);
                    if (thrusting) {
                        x += (Math.random()-0.5)*0.2;
                        y += (Math.random()-0.5)*0.2;
                        z += (Math.random()*0.8 + 0.2);
                    } else {
                        z += 0.2;
                    }
                    if (z > 5) {
                        x = (Math.random()-0.5)*0.5;
                        y = (Math.random()-0.5)*0.5;
                        z = 0;
                    }
                    posAttr.setXYZ(i, x, y, z);
                }
                posAttr.needsUpdate = true;
                this.exhaust.position.copy(dir.clone().multiplyScalar(-3));
            }
        }
        // TODO: Implement spaceship physics and controls
        // - Thrust, rotation, autopilot
        // - Collision detection
        // - Landing logic
    }

    exit(_playerData: PlayerData): void {
        if (this.shipModel) {
            this.shipModel.visible = false;
        }
    }

    setThirdPerson(enabled: boolean): void {
        this.thirdPerson = enabled;
    }

    private tryLoadGLTF(): void {
        if (this.gltfLoaded) return;
        const url = '/spaceship.glb';
        this.loader.load(url, (gltf) => {
            this.gltfLoaded = true;
            const model = gltf.scene;
            model.scale.set(3, 3, 3);
            model.rotation.x = 0;
            model.rotation.y = 0;
            const group = new Group();
            group.add(model);
            this.shipModel = group;
            this.shipModel.position.set(0, -2.5, -8);
            this.camera.add(this.shipModel);
        }, undefined, (_err) => {
            this.gltfLoaded = true;
        });
    }
}

/**
 * FPS state handler.
 */
class FPSStateHandler implements IStateHandler {
    private fpsControls: FPSControls;

    constructor(fpsControls: FPSControls) {
        this.fpsControls = fpsControls;
    }

    enter(playerData: PlayerData): void {
        if (!playerData.fpsData) {
            playerData.fpsData = new FPSData();
        }
        // TODO: Parent player to planet surface
        // TODO: Enable FPS controls (WASD, mouse look)
        // TODO: Add gravity and collision
    }

    update(_playerData: PlayerData, dt: number, _camera: PerspectiveCameraType, _scene: SceneType): void {
        // Only update FPS controls if this is the active state
        this.fpsControls.update(dt);
        // TODO: Implement FPS movement
        // - Walking, jumping
        // - Terrain interaction
        // - Planetary physics
    }

    exit(_playerData: PlayerData): void {
        // TODO: Unparent from planet
        // TODO: Disable FPS controls
    }
}

/**
 * Orbit state handler.
 */
class OrbitStateHandler implements IStateHandler {
    private flightControls: FlightControls;

    constructor(flightControls: FlightControls) {
        this.flightControls = flightControls;
    }

    enter(playerData: PlayerData): void {
        if (!playerData.orbitData) {
            playerData.orbitData = new OrbitData();
        }
        // TODO: Set up orbital camera controls
        // TODO: Calculate stable orbit
    }

    update(_playerData: PlayerData, dt: number, _camera: PerspectiveCameraType, _scene: SceneType): void {
        // Only update flight controls if this is the active state
        this.flightControls.update(dt);
        // TODO: Implement orbital mechanics
        // - Maintain orbit around target body
        // - Adjust orbit parameters
        // - Orbital transfers
    }

    exit(_playerData: PlayerData): void {
        // TODO: Exit orbital mode
    }
}

/**
 * Warp state handler.
 */
class WarpStateHandler implements IStateHandler {
    private flightControls: FlightControls;

    constructor(flightControls: FlightControls) {
        this.flightControls = flightControls;
    }

    enter(playerData: PlayerData): void {
        if (!playerData.warpData) {
            playerData.warpData = new WarpData();
        }
        // TODO: Initialize warp drive
        // TODO: Visual effects for warp
    }

    update(_playerData: PlayerData, dt: number, _camera: PerspectiveCameraType, _scene: SceneType): void {
        // Only update flight controls if this is the active state
        this.flightControls.update(dt);
        // TODO: Implement warp travel
        // - FTL movement between systems
        // - Warp factor adjustments
        // - Arrival at destination
    }

    exit(_playerData: PlayerData): void {
        // TODO: Exit warp and return to normal space
    }
}

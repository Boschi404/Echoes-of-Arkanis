import * as THREE from 'three';
import { IModule } from '../core/Module';
export { THREE };
export declare const Scene: typeof THREE.Scene;
export declare const PerspectiveCamera: typeof THREE.PerspectiveCamera;
export declare const WebGLRenderer: typeof THREE.WebGLRenderer;
export declare const Vector3: typeof THREE.Vector3;
export declare const Euler: typeof THREE.Euler;
export declare const Object3D: typeof THREE.Object3D;
export declare const Mesh: typeof THREE.Mesh;
export declare const SphereGeometry: typeof THREE.SphereGeometry;
export declare const BoxGeometry: typeof THREE.BoxGeometry;
export declare const MeshBasicMaterial: typeof THREE.MeshBasicMaterial;
export declare const AmbientLight: typeof THREE.AmbientLight;
export declare const HemisphereLight: typeof THREE.HemisphereLight;
export type SceneType = THREE.Scene;
export type PerspectiveCameraType = THREE.PerspectiveCamera;
export type WebGLRendererType = THREE.WebGLRenderer;
export type Vector3Type = THREE.Vector3;
export type EulerType = THREE.Euler;
export type Object3DType = THREE.Object3D;
export type MeshType = THREE.Mesh;
export type SphereGeometryType = THREE.SphereGeometry;
export type MeshBasicMaterialType = THREE.MeshBasicMaterial;
export type AmbientLightType = THREE.AmbientLight;
export type HemisphereLightType = THREE.HemisphereLight;
/**
 * Renderer class that encapsulates Three.js scene, camera, and renderer.
 * Isolates Three.js functionality within this module.
 */
export declare class Renderer implements IModule {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    init(): void;
    update(dt: number): void;
    dispose(): void;
    private onWindowResize;
}
//# sourceMappingURL=Renderer.d.ts.map
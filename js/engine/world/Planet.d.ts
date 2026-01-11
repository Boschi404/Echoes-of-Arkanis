import * as THREE from 'three';
import { MeshType } from '../rendering/Renderer';
export interface Moon {
    name: string;
    radius: number;
    distance: number;
    speed: number;
    mesh: MeshType | null;
}
export declare class Planet {
    name: string;
    radius: number;
    distance: number;
    type: string;
    speed: number;
    moons: Moon[];
    position: THREE.Vector3;
    private mesh;
    constructor(name: string, radius: number, distance: number, type: string, speed: number, moons?: Moon[]);
    getMesh(): MeshType | null;
    createMesh(): void;
    setMesh(mesh: MeshType | null): void;
    private getColor;
    update(dt: number): void;
}
//# sourceMappingURL=Planet.d.ts.map
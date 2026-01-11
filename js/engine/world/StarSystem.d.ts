import * as THREE from 'three';
import { MeshType } from '../rendering/Renderer';
import { Planet } from './Planet';
export interface Star {
    name: string;
    radius: number;
    color: number;
    mesh: MeshType | null;
}
export declare class StarSystem {
    name: string;
    position: THREE.Vector3;
    star: Star;
    planets: Planet[];
    constructor(name: string, position: THREE.Vector3, star: Star, planets?: Planet[]);
    getMeshes(): MeshType[];
    update(dt: number): void;
}
//# sourceMappingURL=StarSystem.d.ts.map
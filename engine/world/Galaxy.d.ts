import { MeshType } from '../rendering/Renderer';
import { Vector3D } from './FloatingOrigin';
import { StarSystem } from './StarSystem';
export declare class Galaxy {
    name: string;
    position: Vector3D;
    systems: StarSystem[];
    constructor(name: string, position: Vector3D, systems?: StarSystem[]);
    getMeshes(): MeshType[];
    update(dt: number): void;
}
//# sourceMappingURL=Galaxy.d.ts.map
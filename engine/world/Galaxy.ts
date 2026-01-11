import { MeshType } from '../rendering/Renderer';
import { Vector3D } from './FloatingOrigin';
import { StarSystem } from './StarSystem';

export class Galaxy {
    public name: string;
    public position: Vector3D;
    public systems: StarSystem[];

    constructor(name: string, position: Vector3D, systems: StarSystem[] = []) {
        this.name = name;
        this.position = position;
        this.systems = systems;
    }

    getMeshes(): MeshType[] {
        const meshes: MeshType[] = [];
        this.systems.forEach(system => {
            meshes.push(...system.getMeshes());
        });
        return meshes;
    }

    update(dt: number): void {
        this.systems.forEach(system => system.update(dt));
    }
}

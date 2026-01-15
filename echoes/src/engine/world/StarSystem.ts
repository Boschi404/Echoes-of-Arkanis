import * as THREE from 'three';
import type { MeshType } from '../rendering/Renderer';
import { SphereGeometry, MeshBasicMaterial, Mesh } from '../rendering/Renderer';
// import { Vector3D } from './FloatingOrigin';
import { Planet } from './Planet';

export interface Star {
    name: string;
    radius: number;
    color: number;
    mesh: MeshType | null;
}

export class StarSystem {
    public name: string;
    public position: THREE.Vector3;
    public star: Star;
    public planets: Planet[];

    constructor(name: string, position: THREE.Vector3, star: Star, planets: Planet[] = []) {
        this.name = name;
        this.position = position;
        this.star = star;
        this.planets = planets;
    }

    getMeshes(): MeshType[] {
        const meshes: MeshType[] = [];

        // Create star mesh if not exists
        if (!this.star.mesh) {
            const geometry = new SphereGeometry(this.star.radius, 32, 32);
            const material = new MeshBasicMaterial({ color: this.star.color });
            this.star.mesh = new Mesh(geometry, material);
            this.star.mesh.position.copy(this.position);
        }
        meshes.push(this.star.mesh);

        // Get planet meshes
        this.planets.forEach(planet => {
            const mesh = planet.getMesh();
            if (mesh) {
                meshes.push(mesh);
            }
        });

        return meshes;
    }

    update(dt: number): void {
        this.planets.forEach(planet => planet.update(dt));
    }
}

import * as THREE from 'three';
import { MeshType, SphereGeometry, MeshBasicMaterial, Mesh } from '../rendering/Renderer';

export interface Moon {
    name: string;
    radius: number;
    distance: number;
    speed: number;
    mesh: MeshType | null;
}

export class Planet {
    public name: string;
    public radius: number;
    public distance: number;
    public type: string;
    public speed: number;
    public moons: Moon[];
    public position: THREE.Vector3;

    private mesh: MeshType | null = null;

    constructor(name: string, radius: number, distance: number, type: string, speed: number, moons: Moon[] = []) {
        this.name = name;
        this.radius = radius;
        this.distance = distance;
        this.type = type;
        this.speed = speed;
        this.moons = moons;
        this.position = new THREE.Vector3(distance, 0, 0);
    }

    getMesh(): MeshType | null {
        return this.mesh;
    }

    createMesh(): void {
        if (!this.mesh) {
            const geometry = new SphereGeometry(this.radius, 16, 16);
            const material = new MeshBasicMaterial({ color: this.getColor() });
            this.mesh = new Mesh(geometry, material);
            this.mesh.position.copy(this.position);
        }
    }

    setMesh(mesh: MeshType | null): void {
        this.mesh = mesh;
    }

    private getColor(): number {
        switch (this.type) {
            case 'terrestrial': return 0x0000ff;
            case 'gas giant': return 0xffa500;
            default: return 0xffffff;
        }
    }

    update(dt: number): void {
        if (this.mesh) {
            this.mesh.rotation.y += this.speed * dt;
        }
    }
}

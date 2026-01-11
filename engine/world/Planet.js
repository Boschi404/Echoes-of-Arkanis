import * as THREE from 'three';
import { SphereGeometry, MeshBasicMaterial, Mesh } from '../rendering/Renderer.js';
export class Planet {
    constructor(name, radius, distance, type, speed, moons = []) {
        this.mesh = null;
        this.name = name;
        this.radius = radius;
        this.distance = distance;
        this.type = type;
        this.speed = speed;
        this.moons = moons;
        this.position = new THREE.Vector3(distance, 0, 0);
    }
    getMesh() {
        return this.mesh;
    }
    createMesh() {
        if (!this.mesh) {
            const geometry = new SphereGeometry(this.radius, 16, 16);
            const material = new MeshBasicMaterial({ color: this.getColor() });
            this.mesh = new Mesh(geometry, material);
            this.mesh.position.copy(this.position);
        }
    }
    setMesh(mesh) {
        this.mesh = mesh;
    }
    getColor() {
        switch (this.type) {
            case 'terrestrial': return 0x0000ff;
            case 'gas giant': return 0xffa500;
            default: return 0xffffff;
        }
    }
    update(dt) {
        if (this.mesh) {
            this.mesh.rotation.y += this.speed * dt;
        }
    }
}
//# sourceMappingURL=Planet.js.map
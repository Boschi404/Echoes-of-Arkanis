import { SphereGeometry, MeshBasicMaterial, Mesh } from '../rendering/Renderer';
export class StarSystem {
    constructor(name, position, star, planets = []) {
        this.name = name;
        this.position = position;
        this.star = star;
        this.planets = planets;
    }
    getMeshes() {
        const meshes = [];
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
    update(dt) {
        this.planets.forEach(planet => planet.update(dt));
    }
}
//# sourceMappingURL=StarSystem.js.map
export class Galaxy {
    constructor(name, position, systems = []) {
        this.name = name;
        this.position = position;
        this.systems = systems;
    }
    getMeshes() {
        const meshes = [];
        this.systems.forEach(system => {
            meshes.push(...system.getMeshes());
        });
        return meshes;
    }
    update(dt) {
        this.systems.forEach(system => system.update(dt));
    }
}
//# sourceMappingURL=Galaxy.js.map
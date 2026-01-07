const GALAXY_CONFIG = {
    "project_name": "Echoes of Arkanis",
    "seed": 69,
    "galaxy": [
        {
            "region": "Core Worlds",
            "systems": [
                { "name": "Coruscant System", "planets": [{ "name": "Coruscant", "radius": 120, "type": "city", "dist": 15000 }] },
                { "name": "Corellia System", "planets": [{ "name": "Corellia", "radius": 100, "type": "industrial", "dist": 25000 }] }
            ]
        },
        {
            "region": "Outer Rim",
            "systems": [
                { "name": "Tatoo System", "stars": ["Tatoo I", "Tatoo II"], "planets": [{ "name": "Tatooine", "radius": 80, "type": "desert", "dist": 35000 }] },
                { "name": "Hoth System", "planets": [{ "name": "Hoth", "radius": 70, "type": "ice", "dist": 50000 }] },
                { "name": "Bespin System", "planets": [{ "name": "Bespin", "radius": 500, "type": "gas_giant", "dist": 70000 }] }
            ]
        }
    ]
};

class GalaxyManager {
    constructor(scene) {
        this.scene = scene;
        this.rng = new MathUtils(GALAXY_CONFIG.seed);
        this.planets = [];
        this.systems = [];
        this.biomes = {
            city: { color: 0x444455, roughness: 0.8, metalness: 0.5, emissive: 0x111122 },
            industrial: { color: 0x554433, roughness: 0.9, metalness: 0.7, emissive: 0x221100 },
            desert: { color: 0xedc9af, roughness: 1.0, metalness: 0.0, emissive: 0x000000 },
            ice: { color: 0xddffff, roughness: 0.1, metalness: 0.2, emissive: 0x001122 },
            gas_giant: { color: 0xffaa44, roughness: 0.5, metalness: 0.0, emissive: 0x221100, transparent: true, opacity: 0.8 },
            volcanic: { color: 0x221111, roughness: 0.9, metalness: 0.1, emissive: 0xff2200 }
        };

        this.init();
    }

    init() {
        this.container = new THREE.Group();
        this.scene.add(this.container);

        // 1. Process Canon Systems
        GALAXY_CONFIG.galaxy.forEach(region => {
            region.systems.forEach(sysData => {
                this.createSystem(sysData, region.region);
            });
        });

        // 2. Generate Procedural Systems (Deterministic expansion)
        for (let i = 0; i < 15; i++) {
            const procSys = {
                name: `Sector-7G-${i}`,
                planets: [
                    {
                        name: `PX-${i}`,
                        radius: this.rng.range(50, 300),
                        type: this.rng.choice(['ice', 'desert', 'volcanic', 'industrial']),
                        dist: 100000 + i * 20000 + this.rng.range(0, 5000)
                    }
                ]
            };
            this.createSystem(procSys, "Unknown Space");
        }
    }

    createSystem(data, regionName) {
        const systemGroup = new THREE.Group();
        // Spread systems in 3D space based on distance from center
        const angle = this.rng.range(0, Math.PI * 2);
        const orbitRadius = data.planets[0]?.dist || 50000;
        systemGroup.position.set(
            Math.cos(angle) * orbitRadius,
            this.rng.range(-5000, 5000),
            Math.sin(angle) * orbitRadius
        );

        this.container.add(systemGroup);
        this.systems.push(systemGroup);

        data.planets.forEach(pData => {
            const planet = this.createPlanet(pData);
            // In this hierarchical view, distances in JSON are relative to system center
            planet.position.set(this.rng.range(-1000, 1000), 0, this.rng.range(-1000, 1000));
            systemGroup.add(planet);

            planet.userData.region = regionName;
            planet.userData.system = data.name;
            this.planets.push(planet);
        });
    }

    createPlanet(data) {
        const biome = this.biomes[data.type] || this.biomes.industrial;
        const geo = new THREE.SphereGeometry(data.radius, 64, 64);
        const mat = new THREE.MeshStandardMaterial({
            color: biome.color,
            roughness: biome.roughness,
            metalness: biome.metalness,
            emissive: biome.emissive,
            emissiveIntensity: data.type === 'volcanic' ? 2 : 0.5,
            transparent: biome.transparent || false,
            opacity: biome.opacity || 1
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = data.name;

        // Physics Data (SOI)
        mesh.userData = {
            radius: data.radius,
            type: data.type,
            soi: data.radius * 6, // Sphere of Influence
            gravity: data.radius * 0.01,
            isGasGiant: data.type === 'gas_giant'
        };

        // Atmosphere visual for all non-gas giants
        if (!mesh.userData.isGasGiant) {
            const atmoGeo = new THREE.SphereGeometry(data.radius * 1.05, 32, 32);
            const atmoMat = new THREE.MeshBasicMaterial({
                color: biome.color,
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide
            });
            mesh.add(new THREE.Mesh(atmoGeo, atmoMat));
        }

        return mesh;
    }

    update(time) {
        // Slow rotation of systems and planets
        this.systems.forEach((sys, idx) => {
            sys.rotation.y += 0.0001 * (idx % 2 === 0 ? 1 : -1);
        });
        this.planets.forEach(p => {
            p.rotation.y += 0.001;
        });
    }
}
window.GalaxyManager = GalaxyManager;

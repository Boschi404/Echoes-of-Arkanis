const GALAXY_CONFIG = {
    "project_name": "Echoes of Arkanis",
    "seed": 69,
    "galaxy": [
        {
            "region": "Core Worlds",
            "systems": [
                {
                    "name": "Coruscant System",
                    "star": { "name": "Coruscant Prime", "radius": 10000, "color": 0xffaa00 },
                    "planets": [
                        { "name": "Coruscant", "radius": 120, "dist": 40000, "type": "city", "speed": 0.00005, "moons": [{ "name": "Centax-1", "radius": 30, "dist": 600, "type": "ice" }, { "name": "Centax-2", "radius": 25, "dist": 900, "type": "ice" }] }
                    ]
                },
                {
                    "name": "Corellia System",
                    "star": { "name": "Corell", "radius": 12000, "color": 0xffdd44 },
                    "planets": [
                        { "name": "Corellia", "radius": 140, "dist": 55000, "type": "industrial", "speed": 0.00003, "moons": [{ "name": "Gus Talon", "radius": 40, "dist": 500, "type": "desert" }] }
                    ]
                }
            ]
        },
        {
            "region": "Outer Rim",
            "systems": [
                {
                    "name": "Tatoo System",
                    "star": { "name": "Tatoo I", "radius": 9000, "color": 0xffcc00 }, // Binary not supported yet, simplifying to 1 star
                    "planets": [
                        { "name": "Tatooine", "radius": 110, "dist": 60000, "type": "desert", "speed": 0.00004, "moons": [{ "name": "Ghomrassen", "radius": 20, "dist": 400, "type": "rock" }, { "name": "Guermessa", "radius": 15, "dist": 700, "type": "rock" }] }
                    ]
                },
                {
                    "name": "Hoth System",
                    "star": { "name": "Hoth Prime", "radius": 8500, "color": 0xaaccff },
                    "planets": [
                        { "name": "Hoth", "radius": 100, "dist": 80000, "type": "ice", "speed": 0.00002, "moons": [] }
                    ]
                },
                {
                    "name": "Bespin System",
                    "star": { "name": "Bespin Star", "radius": 9500, "color": 0xffaa44 },
                    "planets": [
                        { "name": "Bespin", "radius": 1100, "dist": 120000, "type": "gas_giant", "speed": 0.00001, "moons": [] }
                    ]
                },
                {
                    "name": "Endor System",
                    "star": { "name": "Endor Prime", "radius": 8000, "color": 0xffffff },
                    "planets": [
                        {
                            "name": "Endor Prime (Gas Giant)", "radius": 900, "dist": 90000, "type": "gas_giant", "speed": 0.00002, "moons": [
                                { "name": "Forest Moon of Endor", "radius": 90, "dist": 2500, "type": "forest" }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

class GalaxyManager {
    constructor(scene) {
        this.scene = scene;
        this.rng = new MathUtils(GALAXY_CONFIG.seed);
        this.rng = new MathUtils(GALAXY_CONFIG.seed);
        this.celestialBodies = []; // All interactable bodies: Stars, Planets, Moons
        this.systems = [];
        this.markerTexture = this.createMarkerTexture();
        this.biomes = {
            city: { color: 0x444455, roughness: 0.6, metalness: 0.8, emissive: 0x111122 },
            industrial: { color: 0x554433, roughness: 0.8, metalness: 0.6, emissive: 0x221100 },
            desert: { color: 0xedc9af, roughness: 1.0, metalness: 0.0, emissive: 0x000000 },
            ice: { color: 0xddffff, roughness: 0.2, metalness: 0.3, emissive: 0x001122 },
            gas_giant: { color: 0xffaa44, roughness: 0.4, metalness: 0.0, emissive: 0x110000 },
            volcanic: { color: 0x221111, roughness: 0.9, metalness: 0.1, emissive: 0xff2200 },
            forest: { color: 0x228b22, roughness: 0.8, metalness: 0.1, emissive: 0x000000 },
            rock: { color: 0x888888, roughness: 0.9, metalness: 0.1, emissive: 0x000000 }
        };

        this.init();
    }

    createMarkerTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(0, 243, 255, 1)');
        grad.addColorStop(0.3, 'rgba(0, 243, 255, 0.5)');
        grad.addColorStop(1, 'rgba(0, 243, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }

    init() {
        this.container = new THREE.Group();
        this.scene.add(this.container);

        // 1. Process Canon Systems
        let sysIndex = 0;
        GALAXY_CONFIG.galaxy.forEach(region => {
            region.systems.forEach((sysData) => {
                // FORCE Deterministic Grid Placement
                // System 0 (Coruscant) is at 0,0,0
                // Others are spaced out by 500,000 units
                let x = 0, z = 0;

                if (sysIndex > 0) {
                    // Spiral layout or simple grid
                    const shell = Math.ceil(Math.sqrt(sysIndex + 1));
                    const angle = sysIndex * 1.5; // Radians
                    const dist = 400000 * shell;
                    x = Math.cos(angle) * dist;
                    z = Math.sin(angle) * dist;
                }

                const systemPos = new THREE.Vector3(x, 0, z); // Keep them on the plane for easier navigation
                this.createSystem(sysData, systemPos, region.region);
                sysIndex++;
            });
        });
    }

    createSystem(data, position, regionName) {
        const systemGroup = new THREE.Group();
        systemGroup.position.copy(position);
        this.container.add(systemGroup);
        this.systems.push(systemGroup);

        // --- STAR ---
        // Using "Real-ish" scale: Stars are ~100x bigger than planets
        const starGeo = new THREE.SphereGeometry(data.star.radius, 64, 64);
        const starMat = new THREE.MeshBasicMaterial({ color: data.star.color });
        const star = new THREE.Mesh(starGeo, starMat);
        star.name = data.star.name;

        // Star Glow/Corona
        const corona = new THREE.Mesh(
            new THREE.SphereGeometry(data.star.radius * 1.5, 32, 32),
            new THREE.MeshBasicMaterial({ color: data.star.color, transparent: true, opacity: 0.15, side: THREE.BackSide })
        );
        star.add(corona);

        // Light Source
        const light = new THREE.PointLight(data.star.color, 2, 500000);
        star.add(light);

        star.userData = {
            radius: data.star.radius,
            type: 'star',
            soi: data.star.radius * 20, // Massive gravity well
            gravity: data.star.radius * 2, // Strong pull
            marker: this.createMapMarker(data.star.radius * 2)
        };
        star.add(star.userData.marker);

        systemGroup.add(star);
        this.celestialBodies.push(star);

        // --- PLANETS ---
        data.planets.forEach(pData => {
            const planet = this.createCelestialBody(pData, false);
            planet.userData.parentSystem = star;
            planet.userData.orbitSpeed = pData.speed;
            planet.userData.orbitDist = pData.dist;
            planet.userData.angle = this.rng.range(0, Math.PI * 2);

            // Set initial position
            planet.position.set(
                Math.cos(planet.userData.angle) * pData.dist,
                0,
                Math.sin(planet.userData.angle) * pData.dist
            );

            systemGroup.add(planet);
            this.celestialBodies.push(planet); // Add to global list for logic

            // ADD ORBIT LINE FOR PLANET
            if (pData.dist > 0) {
                const orbit = this.createOrbitLine(pData.dist, 0x44aaff);
                systemGroup.add(orbit);
            }

            // Start Position for Satellites relative to this planet
            if (pData.moons) {
                pData.moons.forEach(mData => {
                    const moon = this.createCelestialBody(mData, true);
                    moon.userData.parentBody = planet; // Orbits the planet
                    moon.userData.orbitSpeed = this.rng.range(0.001, 0.003); // Faster moon orbits
                    moon.userData.orbitDist = mData.dist;
                    moon.userData.angle = this.rng.range(0, Math.PI * 2);

                    // Add moon to the SYSTEM group, but mathematically it orbits the planet
                    // We render it as a child of the Planet mesh? 
                    // No, for cleaner physics/world transform, let's keep it in system group but update relative to planet
                    // Actually, parenting to planet makes logic easier for "sticking".
                    // Let's parent to the Planet Mesh.

                    moon.position.set(
                        Math.cos(moon.userData.angle) * mData.dist,
                        0,
                        Math.sin(moon.userData.angle) * mData.dist
                    );
                    planet.add(moon);

                    // ADD ORBIT LINE FOR MOON
                    if (mData.dist > 0) {
                        const moonOrbit = this.createOrbitLine(mData.dist, 0xaaaaaa);
                        planet.add(moonOrbit);
                    }

                    // Add moon to collision list
                    this.celestialBodies.push(moon);
                });
            }
        });

        // Add System Marker for Map
        const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.markerTexture, color: data.star.color, transparent: true }));
        marker.scale.set(5000, 5000, 1);
        marker.position.copy(position);
        marker.userData.isSystemMarker = true;
        // this.scene.add(marker); // Maybe add to map layer? Keeping it simple for now.
    }

    createCelestialBody(data, isMoon) {
        const biome = this.biomes[data.type] || this.biomes.rock;
        const geo = new THREE.SphereGeometry(data.radius, 64, 64);
        const mat = new THREE.MeshStandardMaterial({
            color: biome.color,
            roughness: biome.roughness,
            metalness: biome.metalness,
            emissive: biome.emissive,
            emissiveIntensity: 0.5,
            transparent: data.type === 'gas_giant',
            opacity: data.type === 'gas_giant' ? 0.8 : 1
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = data.name;

        // Physics & Gameplay Data
        mesh.userData = {
            radius: data.radius,
            type: data.type,
            soi: data.radius * 4,
            gravity: data.radius * 0.02,
            isGasGiant: data.type === 'gas_giant',
            isMoon: isMoon,
            marker: this.createMapMarker(data.radius) // Function below
        };

        // Atmosphere visual
        if (!mesh.userData.isGasGiant && data.radius > 50) {
            const atmoGeo = new THREE.SphereGeometry(data.radius * 1.03, 32, 32);
            const atmoMat = new THREE.MeshBasicMaterial({
                color: biome.color,
                transparent: true,
                opacity: 0.12,
                side: THREE.BackSide
            });
            mesh.add(new THREE.Mesh(atmoGeo, atmoMat));
        }

        // Attach Marker
        mesh.add(mesh.userData.marker);

        return mesh;
    }

    createMapMarker(radius) {
        const markerMat = new THREE.SpriteMaterial({ map: this.markerTexture, color: 0xffffff, transparent: true, depthTest: false });
        const marker = new THREE.Sprite(markerMat);
        // Significantly reduced scale for "halo" effect rather than giant blob
        const scale = radius * 2.5;
        marker.scale.set(scale, scale, 1);
        marker.visible = false;
        marker.parentPlanet = null;
        return marker;
    }

    createOrbitLine(radius, color) {
        const segments = 256;
        const pts = [];
        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(pts);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.08, // Very subtle lines
            linewidth: 1
        });
        const line = new THREE.Line(geometry, material);
        // Default lies on XZ plane, exactly what we want
        return line;
    }

    update(time, isMapOpen) {
        // Update Orbital Mechanics
        this.systems.forEach(sys => {
            // Stars don't move (relative to system)
        });

        // Planets orbit stars
        // Since we pushed all bodies to this.planets, we need to distinguish
        // For physics parenting, satellites are children of planets in ThreeJS graph.
        // Planets are children of system group.

        // We only need to animate the "Planets" (children of System) manually for orbits.
        // Moons (children of Planets) will move with planets automatically, 
        // but we need to rotate them around the planet.

        // We updates all celestial bodies
        this.celestialBodies.forEach(p => {
            // Rotate on axis
            p.rotation.y += 0.0005;

            // Map Marker Visibility
            if (p.userData.marker) {
                p.userData.marker.visible = isMapOpen;
            }

            // Orbital Logic
            if (p.parent && p.parent.type === 'Group') {
                // This is a Planet orbiting a Star (System Group Center)
                if (p.userData.orbitDist) {
                    p.userData.angle += p.userData.orbitSpeed;
                    p.position.set(
                        Math.cos(p.userData.angle) * p.userData.orbitDist,
                        0,
                        Math.sin(p.userData.angle) * p.userData.orbitDist
                    );
                }
            } else if (p.parent && p.parent.type === 'Mesh') {
                // This is a Moon orbiting a Planet
                if (p.userData.orbitDist) {
                    p.userData.angle += p.userData.orbitSpeed;
                    p.position.set(
                        Math.cos(p.userData.angle) * p.userData.orbitDist,
                        0,
                        Math.sin(p.userData.angle) * p.userData.orbitDist
                    );
                }
            }
        });
    }
}
window.GalaxyManager = GalaxyManager;

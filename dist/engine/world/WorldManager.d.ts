import { IModule } from '../core/Module';
import { IScene, IObject3D } from '../rendering/Renderer';
/**
 * Manages the game world, including objects, physics, and spatial partitioning.
 * This replaces Three.js Scene functionality.
 */
export declare class WorldManager implements IModule {
    private scene;
    private objects;
    private physicsWorld;
    constructor();
    init(): void;
    update(dt: number): void;
    dispose(): void;
    /**
     * Add an object to the world.
     * @param id Unique identifier for the object.
     * @param object The object to add.
     */
    addObject(id: string, object: IObject3D): void;
    /**
     * Remove an object from the world.
     * @param id The id of the object to remove.
     */
    removeObject(id: string): void;
    /**
     * Get an object by id.
     * @param id The object id.
     * @returns The object or undefined if not found.
     */
    getObject(id: string): IObject3D | undefined;
    /**
     * Get all objects in the world.
     */
    getAllObjects(): IObject3D[];
    /**
     * Get the scene for rendering.
     */
    getScene(): IScene;
}
//# sourceMappingURL=WorldManager.d.ts.map
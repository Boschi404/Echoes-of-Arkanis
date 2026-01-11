# TODO for InputManager Enhancement

## Current Task: Enhance InputManager.ts for Unified Action-Based Input

### Steps:
1. ✅ Add InputMode enum (FPS, Spaceship)
2. ✅ Define action mappings for FPS mode (e.g., moveForward -> ['KeyW'], etc.)
3. ✅ Define action mappings for Spaceship mode (e.g., thrust -> ['KeyW'], etc.)
4. ✅ Define axis mappings for both modes (e.g., lookX -> mouseDeltaX, etc.)
5. ✅ Add setInputMode(mode: InputMode) method
6. ✅ Add isActionPressed(action: string): boolean method
7. ✅ Add getAxis(axis: string): number method
8. ✅ Implement logic in isActionPressed and getAxis to use mappings based on current mode

### Followup Steps (after current task):
- ✅ Update FPSControls.ts to use new action-based methods
- ✅ Update FlightControls.ts to use new action-based methods
- Test input handling in the game

---

## Completed: Streaming Manager Implementation

### Task: Create engine/streaming/StreamingManager.ts and implement Star systems LOD, Planet LOD, Chunk placeholders, Velocity-based preload. No real terrain yet.

### Steps Completed:
1. ✅ Created StreamingManager.ts as IModule with pure decision layer architecture
2. ✅ Implemented star systems LOD using macro LOD thresholds from LODManager
3. ✅ Implemented planet LOD using chunk LOD with placeholders
4. ✅ Added velocity-based preload predicting player position ahead (5 seconds)
5. ✅ Added chunk placeholders (wireframe cubes) for terrain chunks
6. ✅ Integrated StreamingManager into Engine via Game.ts
7. ✅ Added streaming methods to WorldManager (activateSystem, activatePlanet, activateChunk, etc.)
8. ✅ Added BoxGeometry export to Renderer.ts for chunk placeholders

### Architecture:
- StreamingManager queries PlayerStateMachine for position/velocity
- Uses LODManager to determine required LOD levels
- Asks WorldManager to activate/deactivate entities at required LOD
- WorldManager handles all Three.js mesh creation/destruction
- Velocity-based preload uses predictedPosition = position + velocity * preloadTime

### Next Steps:
- Test streaming behavior with player movement
- Add more sophisticated chunk management (tracking active chunks)
- Implement real terrain generation (future task)

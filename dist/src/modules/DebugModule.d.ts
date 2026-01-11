import { IModule } from '../interfaces/IModule';
/**
 * Debug Module provides debugging and tooling support.
 * Can be toggled on/off for development builds.
 */
export declare class DebugModule implements IModule {
    private fpsCounter;
    private performanceMonitor;
    private debugUI;
    private showFPS;
    private showPerformance;
    private showDebugUI;
    init(): void;
    update(dt: number): void;
    dispose(): void;
    private onKeyDown;
}
//# sourceMappingURL=DebugModule.d.ts.map
import { Engine } from './engine/core/Engine';
import { Renderer } from './engine/rendering/Renderer';
import { WorldManager } from './engine/world/WorldManager';
import { PlayerStateMachine } from './engine/modules/PlayerStateMachine';
import { LODManager } from './engine/modules/LODManager';
import { StreamingManager } from './engine/streaming/StreamingManager';
import { InputManager } from './engine/input/InputManager';
import { DebugModule } from './engine/modules/DebugModule';

/**
 * Game class that encapsulates the creation and management of all game modules.
 * This class is responsible for setting up the game logic and adding modules to the engine.
 */
export class Game {
    private engine: Engine;

    constructor(engine: Engine) {
        this.engine = engine;
        this.initializeModules();
        this.initializeUI();
    }

    /**
     * Initialize UI event listeners.
     */
    private initializeUI(): void {
        const startBtn = document.getElementById('start-btn');
        const uiLayer = document.getElementById('ui-layer');
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const settingsCloseBtn = document.getElementById('settings-close-btn');
        const controlMode = document.getElementById('control-mode') as HTMLSelectElement | null;
        const tabGame = document.getElementById('tab-game');
        const tabVideo = document.getElementById('tab-video');
        const tabAudio = document.getElementById('tab-audio');
        const tabControls = document.getElementById('tab-controls');
        const paneGame = document.getElementById('pane-game');
        const paneVideo = document.getElementById('pane-video');
        const paneAudio = document.getElementById('pane-audio');
        const paneControls = document.getElementById('pane-controls');
        const shakeSlider = document.getElementById('shake-slider') as HTMLInputElement | null;
        const renderRes = document.getElementById('render-res') as HTMLSelectElement | null;
        // Placeholder references for future graphics pipeline hooks
        document.getElementById('shadow-quality');
        document.getElementById('aa');
        document.getElementById('ao');
        document.getElementById('bloom');
        document.getElementById('ca');
        document.getElementById('lens');
        const controlList = document.getElementById('control-list');

        // Use existing HUD container
        const hudContainer = document.getElementById('hud-container');
        const psm = this.engine.getModule<PlayerStateMachine>('playerStateMachine');
        if (psm) psm.setControlsEnabled(false);

        if (startBtn && uiLayer) {
            startBtn.addEventListener('click', () => {
                console.log('Starting mission...');
                uiLayer.style.display = 'none';
                if (hudContainer) {
                    hudContainer.style.display = 'grid'; // Enable grid layout
                    let panel = document.getElementById('target-info') as HTMLElement | null;
                    if (!panel) {
                        panel = document.createElement('div');
                        panel.id = 'target-info';
                        panel.style.position = 'absolute';
                        panel.style.bottom = '20px';
                        panel.style.left = '50%';
                        panel.style.transform = 'translateX(-50%)';
                        panel.style.padding = '6px 10px';
                        panel.style.background = 'rgba(0,0,0,0.6)';
                        panel.style.color = '#fff';
                        panel.style.fontFamily = 'monospace';
                        panel.style.fontSize = '12px';
                        panel.style.borderRadius = '6px';
                        panel.style.display = 'block';
                        panel.textContent = 'ANALISI OBBIETTIVO searching';
                        hudContainer.appendChild(panel);
                    }
                }
                if (psm) psm.setControlsEnabled(true);
                
                // Lock pointer controls - DISABLED for cursor-based flight
                // @ts-ignore - accessing public property directly
                // if (this.engine.modules.get('inputManager')) {
                //      // @ts-ignore
                //     this.engine.modules.get('inputManager').lockPointer();
                // }
            });
        }

        if (settingsBtn && settingsModal) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.style.display = 'block';
                if (psm) psm.setControlsEnabled(false);
            });
        }

        if (settingsCloseBtn && settingsModal) {
            settingsCloseBtn.addEventListener('click', () => {
                settingsModal.style.display = 'none';
                if (psm) psm.setControlsEnabled(true);
            });
        }

        // ESC toggles settings
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && settingsModal) {
                const showing = settingsModal.style.display === 'block';
                settingsModal.style.display = showing ? 'none' : 'block';
                if (psm) psm.setControlsEnabled(showing ? true : false);
            }
        });

        const showPane = (pane: HTMLElement | null) => {
            if (!paneGame || !paneVideo || !paneAudio || !paneControls) return;
            paneGame.style.display = pane === paneGame ? 'block' : 'none';
            paneVideo.style.display = pane === paneVideo ? 'block' : 'none';
            paneAudio.style.display = pane === paneAudio ? 'block' : 'none';
            paneControls.style.display = pane === paneControls ? 'block' : 'none';
        };
        if (tabGame) tabGame.addEventListener('click', () => showPane(paneGame));
        if (tabVideo) tabVideo.addEventListener('click', () => showPane(paneVideo));
        if (tabAudio) tabAudio.addEventListener('click', () => showPane(paneAudio));
        if (tabControls) tabControls.addEventListener('click', () => showPane(paneControls));
        showPane(paneGame || null);

        if (shakeSlider) {
            shakeSlider.addEventListener('input', () => {
                const v = parseInt(shakeSlider.value, 10);
                const norm = Math.max(0, Math.min(1, v / 100));
                const psm2 = this.engine.getModule<PlayerStateMachine>('playerStateMachine');
                if (psm2) psm2.setScreenshake(norm);
            });
        }
        if (controlMode) {
            controlMode.addEventListener('change', () => {
                const psm2 = this.engine.getModule<PlayerStateMachine>('playerStateMachine');
                if (psm2) {
                    const v = controlMode.value;
                    psm2.setRotationMode(v === 'look' ? 'look' : 'steer');
                }
            });
        }
        if (renderRes) {
            renderRes.addEventListener('change', () => {
                const r = this.engine.getModule<Renderer>('renderer');
                if (r) {
                    const scale = parseFloat(renderRes.value);
                    r.renderer.setPixelRatio(scale);
                    r.renderer.setSize(window.innerWidth, window.innerHeight);
                }
            });
        }
        // Simple controls remap UI
        if (controlList) {
            const im = this.engine.getModule<InputManager>('inputManager');
            const cmds = ['thrust','reverse','brake','pitchUp','pitchDown','rollLeft','rollRight'];
            cmds.forEach(cmd => {
                const rowLabel = document.createElement('div');
                rowLabel.textContent = cmd;
                const rowKey = document.createElement('button');
                rowKey.className = 'btn-futuristic';
                rowKey.textContent = (im?.getCommandKey(cmd) ?? '---');
                rowKey.addEventListener('click', () => {
                    rowKey.textContent = '[premi un tasto]';
                    const handler = (ev: KeyboardEvent) => {
                        if (ev.code === 'Escape') {
                            im?.setCommandKey(cmd, null);
                            rowKey.textContent = '---';
                        } else {
                            im?.setCommandKey(cmd, ev.code);
                            rowKey.textContent = ev.code;
                        }
                        window.removeEventListener('keydown', handler);
                    };
                    window.addEventListener('keydown', handler);
                });
                controlList.appendChild(rowLabel);
                controlList.appendChild(rowKey);
            });
        }
    }

    /**
     * Initialize and add all game modules to the engine.
     */
    private initializeModules(): void {
        // Create modules
        const renderer = new Renderer();
        const inputManager = new InputManager();
        const worldManager = new WorldManager(renderer.scene);
        const playerStateMachine = new PlayerStateMachine(renderer.camera, renderer.scene, inputManager);
        const lodManager = new LODManager(renderer.camera, worldManager);
        const streamingManager = new StreamingManager(lodManager, worldManager, playerStateMachine);
        const debugModule = new DebugModule();

        // Add modules to the engine
        this.engine.addModule('renderer', renderer);
        this.engine.addModule('inputManager', inputManager);
        this.engine.addModule('worldManager', worldManager);
        this.engine.addModule('playerStateMachine', playerStateMachine);
        this.engine.addModule('lodManager', lodManager);
        this.engine.addModule('streamingManager', streamingManager);
        this.engine.addModule('debugModule', debugModule);
    }
}

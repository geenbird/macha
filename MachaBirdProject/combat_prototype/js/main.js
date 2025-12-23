import { BattleManager } from './game.js';
import { Renderer } from './renderer.js';
import { UIManager } from './ui.js';

// Global Engine instances
const battleManager = new BattleManager();
const renderer = new Renderer('battle-canvas');

// Game Loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Cap dt for safety (e.g. if tab backgrounded)
    const safeDt = Math.min(dt, 0.1);

    battleManager.update(safeDt);
    renderer.draw(battleManager);

    requestAnimationFrame(gameLoop);
}

// Initialization
window.onload = () => {
    const ui = new UIManager(battleManager, (config) => {
        battleManager.initialize(config);
        battleManager.start();
    });

    // Start with a default init so it's not empty
    const defaultConfig = ui.buildConfig();
    battleManager.initialize(defaultConfig);

    // Start Loop
    requestAnimationFrame(gameLoop);
};

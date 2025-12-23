import { BattleCharacter, CHAR_STATE } from './entities.js';

export class BattleManager {
    constructor() {
        this.characters = []; // All characters
        this.onLog = (msg) => { }; // Callback for logging
        this.running = false;
    }

    // configs: { teamA: {char, w1, w2, skillQueue}, teamB: ... }
    initialize(charConfigs) {
        this.characters = [];
        this.running = false;

        // Spawn Team A at X=100
        this.spawnTeam('A', charConfigs.teamA, 100);
        // Spawn Team B at X=700
        this.spawnTeam('B', charConfigs.teamB, 700);

        this.log("Battle Initialized (1D Lane).");
    }

    spawnTeam(teamId, configList, startX) {
        // configList is now an array of {template, skillQueue}
        configList.forEach((cfg, idx) => {
            const char = new BattleCharacter(
                `${teamId}_${idx + 1}`,
                teamId,
                cfg.template,
                cfg.skillQueue,
                startX
            );
            this.characters.push(char);
        });
    }

    start() {
        if (this.characters.length === 0) return;
        this.running = true;
        this.log("Battle Started!");
    }

    pause() {
        this.running = false;
        this.log("Battle Paused.");
    }

    update(dt) {
        if (!this.running) return;

        const teamA = this.characters.filter(c => c.teamId === 'A');
        const teamB = this.characters.filter(c => c.teamId === 'B');

        // Check Win Condition
        if (this.isTeamDead(teamA)) {
            this.running = false;
            this.log("Team B Wins!");
            return;
        }
        if (this.isTeamDead(teamB)) {
            this.running = false;
            this.log("Team A Wins!");
            return;
        }

        // Update Characters
        this.characters.forEach(char => {
            const enemies = char.teamId === 'A' ? teamB : teamA;
            const allies = char.teamId === 'A' ? teamA : teamB;
            char.update(dt, enemies, allies);
        });

        // Resolve Visual Overlaps (Perspective)
        this.resolveVisualPositions(dt);
    }

    resolveVisualPositions(dt) { // dt passed for frame-independent lerp if desired, or fixed
        // Base Lane Y
        const centerY = 200;

        // Sort by X first to find clusters
        const sorted = [...this.characters].sort((a, b) => a.x - b.x);

        // 1. Calculate TARGET Ys
        for (let i = 0; i < sorted.length; i++) {
            const char = sorted[i];

            // Gather neighbors within 40px
            const cluster = [char];
            let j = i + 1;
            while (j < sorted.length && Math.abs(sorted[j].x - char.x) < 40) {
                cluster.push(sorted[j]);
                j++;
            }

            // Distribute cluster on Y
            if (cluster.length > 1) {
                const spread = 30;
                // Start Y for top item.
                const startOff = -((cluster.length - 1) * spread) / 2;

                cluster.forEach((c, idx) => {
                    const offY = startOff + (idx * spread);
                    c.targetVisualY = centerY + offY;
                });

                // Skip processed in main loop
                i = j - 1;
            } else {
                char.targetVisualY = centerY;
            }
        }

        // 2. Apply Smoothing (Lerp) & Scale
        this.characters.forEach(char => {
            // Lerp factor (0.1 means 10% closer per frame). 
            // Frame rate independent approach: char.visualPos.y += (char.targetVisualY - char.visualPos.y) * (1 - Math.pow(0.01, dt));
            // Simple approach:
            char.visualPos.y += (char.targetVisualY - char.visualPos.y) * 0.1;

            // Sync X (Instant, as game logic dictates X)
            char.visualPos.x = char.x;

            // Update Scale based on current Visual Y
            const offY = char.visualPos.y - centerY;
            // Normalized Y offset from -45 to +45
            const norm = (offY + 45) / 90; // approx 0 to 1
            char.visualPos.scale = 0.85 + (norm * 0.3); // 0.85 to 1.15
        });
    }

    isTeamDead(team) {
        return team.every(c => c.state === CHAR_STATE.DEAD);
    }

    setLogCallback(fn) {
        this.onLog = fn;
    }

    log(msg) {
        if (this.onLog) this.onLog(msg);
        console.log(`[Battle] ${msg}`);
    }
}

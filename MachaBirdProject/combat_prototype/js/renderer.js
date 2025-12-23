import { CHAR_STATE } from './entities.js';
import { SKILLS } from './data.js';

export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    draw(battleManager) {
        this.clear();
        this.drawBackground();

        // Z-SORT: Draw characters with lower Y (back) first.
        // Wait, Y increases downwards in Canvas.
        // If we want "Higher Y = Closer", we draw Lower Y first.
        const sortedChars = [...battleManager.characters].sort((a, b) => a.visualPos.y - b.visualPos.y);

        sortedChars.forEach(char => {
            this.drawCharacter(char);
        });

        // Debug/Overlay info?
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawBackground() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Main Lane
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 200);
        this.ctx.lineTo(this.width, 200);
        this.ctx.stroke();
    }

    drawCharacter(char) {
        if (char.state === CHAR_STATE.DEAD) return;

        const cx = char.visualPos.x;
        const cy = char.visualPos.y;
        const scale = char.visualPos.scale || 1;
        const radius = 20 * scale;

        // Draw Cast Selection Ring or Range
        if (char.state === CHAR_STATE.CASTING) {
            const skill = char.getCurrentSkill();
            if (skill) {
                this.ctx.beginPath();
                // Conceptually range is X-based now, but drawing circle helps visualize radius
                // Flatten circle to ellipse for perspective?
                this.ctx.ellipse(cx, cy, skill.range * scale, (skill.range * 0.3) * scale, 0, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
                this.ctx.stroke();
            }
        }

        // Body
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = char.color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Direction Indicator (to Target)
        if (char.target) {
            // Visualize 1D direction
            const dirX = Math.sign(char.target.x - char.x);
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + (dirX * 30 * scale), cy);
            this.ctx.strokeStyle = '#fff';
            this.ctx.stroke();
        }

        // HP Bar (Scaled)
        const hpPct = char.hp / char.maxHp;
        const barW = 40 * scale;
        const barH = 5 * scale;
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(cx - (barW / 2), cy - radius - (15 * scale), barW, barH);
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(cx - (barW / 2), cy - radius - (15 * scale), barW * hpPct, barH);

        // Name
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `${10 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(char.name, cx, cy + radius + (15 * scale));

        // State Text
        this.ctx.fillStyle = '#aaa';
        this.ctx.fillText(char.state, cx, cy - radius - (20 * scale));

        // Casting Bar
        if (char.state === CHAR_STATE.CASTING) {
            const skill = char.getCurrentSkill();
            const pct = 1.0 - (char.stateTimer / skill.castTime);

            this.ctx.fillStyle = 'yellow';
            this.ctx.fillRect(cx - (barW / 2), cy - radius - (10 * scale), barW * pct, 3 * scale);
        }
    }
}

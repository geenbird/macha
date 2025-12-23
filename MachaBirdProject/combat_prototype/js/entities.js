import { SKILLS, SKILL_TYPE } from './data.js';

export const CHAR_STATE = {
    IDLE: 'IDLE',
    MOVING: 'MOVING',
    CASTING: 'CASTING',
    RECOVER: 'RECOVER', // Post-cast delay
    DEAD: 'DEAD'
};

export class BattleCharacter {
    constructor(id, teamId, template, skillQueue, startX) {
        this.id = id;
        this.teamId = teamId;
        this.name = template.name;
        this.maxHp = template.hp;
        this.hp = template.hp;
        this.moveSpeed = template.speed; // pixels per second
        this.color = template.color;
        this.classType = template.classType;

        // Logical Position (1D)
        this.x = startX;

        // Visual Position (Calculated later)
        this.visualPos = { x: startX, y: 200, scale: 1 };
        this.targetVisualY = 200; // Target Y for lerping

        this.target = null; // Current target character

        // Combat state
        this.state = CHAR_STATE.IDLE;
        this.stateTimer = 0; // Generic timer for states

        // Skill Logic
        this.skillQueue = skillQueue; // Array of skill IDs
        this.queueIndex = 0; // Current index in loop
        this.currentSkillId = null;
    }

    update(dt, enemies, allies) {
        if (this.state === CHAR_STATE.DEAD) return;

        // 1. Find Target if none or dead
        if (!this.target || this.target.state === CHAR_STATE.DEAD) {
            this.findTarget(enemies);
        }

        // If still no target (enemies all dead), just idle
        if (!this.target) {
            this.state = CHAR_STATE.IDLE;
            return;
        }

        // 2. Logic State Machine
        switch (this.state) {
            case CHAR_STATE.IDLE:
                // Pick next skill
                this.pickNextSkill();
                // Check range immediately
                if (this.checkRange()) {
                    this.startCasting();
                } else {
                    this.state = CHAR_STATE.MOVING;
                }
                break;

            case CHAR_STATE.MOVING:
                // Move towards target
                if (this.checkRange()) {
                    this.state = CHAR_STATE.IDLE; // Arrived, next frame will switch to casting
                } else {
                    this.moveTowards(this.target.x, dt);
                }
                break;

            case CHAR_STATE.CASTING:
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.applySkillEffect(enemies); // Pass enemies for AOE
                    // Go to recover or idle
                    this.state = CHAR_STATE.RECOVER;
                    this.stateTimer = 0.2; // Small backswing
                }
                break;

            case CHAR_STATE.RECOVER:
                this.stateTimer -= dt;
                if (this.stateTimer <= 0) {
                    this.advanceQueue();
                    this.state = CHAR_STATE.IDLE;
                }
                break;
        }
    }

    findTarget(enemies) {
        // Simple logic: closest live enemy
        let minDist = Infinity;
        let closest = null;
        for (const e of enemies) {
            if (e.state === CHAR_STATE.DEAD) continue;
            const d = this.getDist(e);
            if (d < minDist) {
                minDist = d;
                closest = e;
            }
        }
        this.target = closest;
    }

    pickNextSkill() {
        // Find next VALID skill based on class logic
        // We might need to loop if we skip
        const startIdx = this.queueIndex;
        let loops = 0;

        while (loops < this.skillQueue.length + 1) {
            let skillId = null;
            if (this.skillQueue.length === 0) {
                skillId = 'punch';
            } else {
                skillId = this.skillQueue[this.queueIndex];
            }

            const skill = SKILLS[skillId];
            this.currentSkillId = skillId; // Temporarily set to check range

            // AI SKIP LOGIC
            const inRange = this.checkRange();

            const isMeleeClass = (this.classType === 'MELEE');
            const isRangedSkill = (skill.type === SKILL_TYPE.RANGED || skill.type === SKILL_TYPE.HEAL); // Heal treat as ranged?

            let skip = false;

            // Warrior (Melee) skips Ranged Attack if NOT in range.
            // "Warrior skips remote attack if not in range."
            if (isMeleeClass && isRangedSkill && !inRange) {
                skip = true;
            }

            // Archer/Mage (Ranged) skips Melee Attack if NOT in range.
            // "Archer or Mage skips melee skill if not in range."
            if (!isMeleeClass && !isRangedSkill && !inRange) {
                skip = true;
            }

            if (skip) {
                console.log(`${this.name} skipped ${skill.name} (Out of Range)`);
                this.advanceQueue();
                loops++;
                // If queue empty or single item, might loop forever if we don't break
                if (this.skillQueue.length === 0) break;
            } else {
                // Found a valid skill to try (either in range, or we need to move to it)
                break;
            }
        }
    }

    getCurrentSkill() {
        return SKILLS[this.currentSkillId];
    }

    checkRange() {
        if (!this.target) return false;
        const skill = this.getCurrentSkill();
        const dist = this.getDist(this.target);
        return dist <= (skill.range + 20); // +20 buffer
    }

    moveTowards(targetX, dt) {
        // Move towards target but STOP at skill range
        // This prevents face-clipping

        const skill = this.getCurrentSkill();
        const requiredRange = skill ? skill.range : 20;

        const diff = targetX - this.x;
        const dist = Math.abs(diff);

        // Stop if we are already close enough within range
        // e.g. dist is 40. Range is 50. We are good.
        // Wait, moveTowards is called when checkRange() is FALSE.
        // So dist > range.

        if (dist > requiredRange) {
            const dir = Math.sign(diff);
            const moveAmt = this.moveSpeed * dt;

            // Move only as much as needed to reach range
            // Target X to stop is: targetX - (dir * requiredRange)
            // But simpler: just move.
            this.x += dir * moveAmt;
        }
    }

    startCasting() {
        const skill = this.getCurrentSkill();
        this.state = CHAR_STATE.CASTING;
        this.stateTimer = skill.castTime;
    }

    // Helper to actually apply damage
    applySkillEffect(enemies) {
        if (!this.target) return; // Allow dead target for AOE center?

        const skill = this.getCurrentSkill();

        if (skill.id === 'fireball') {
            // AOE LOGIC
            // "Fireball skill can attack multiple in x-axis range"
            const aoeCenter = this.target.x;
            const aoeRadius = 100; // Arbitrary AOE width

            let hitCount = 0;
            enemies.forEach(e => {
                if (e.state === CHAR_STATE.DEAD) return;
                if (Math.abs(e.x - aoeCenter) <= aoeRadius) {
                    e.takeDamage(skill.damage);
                    hitCount++;
                }
            });
            console.log(`${this.name} cast Fireball hitting ${hitCount} enemies`);

        } else if (skill.type === SKILL_TYPE.HEAL) {
            this.hp -= skill.damage;
            if (this.hp > this.maxHp) this.hp = this.maxHp;
            console.log(`${this.name} cast ${skill.name} on self`);
        } else {
            // Single Target
            if (this.target.state !== CHAR_STATE.DEAD) {
                this.target.takeDamage(skill.damage);
                console.log(`${this.name} cast ${skill.name} on ${this.target.name}`);
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.state = CHAR_STATE.DEAD;
        }
    }

    advanceQueue() {
        this.queueIndex++;
        if (this.queueIndex >= this.skillQueue.length) {
            this.queueIndex = 0;
        }
    }

    getDist(other) {
        return Math.abs(this.x - other.x);
    }
}

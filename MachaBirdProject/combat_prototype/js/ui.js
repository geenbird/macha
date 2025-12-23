import { CHARACTERS, WEAPONS, SKILLS } from './data.js';
import { AIOpponent } from './ai.js';

export class UIManager {
    constructor(battleManager, onConfigChange) {
        this.battleRef = battleManager;
        this.onConfigChange = onConfigChange; // Call when user hits start

        // MULTI-SLOT STATE
        // Each team has 3 slots.
        this.teams = {
            A: this.createDefaultTeamConfig('warrior'),
            B: this.createDefaultTeamConfig('archer')
        };

        // Currently selected slot index for UI editing
        this.currentSlots = { A: 0, B: 0 };
        this.vsAI = true;

        this.initDOM();
    }

    createDefaultTeamConfig(defaultType) {
        return [0, 1, 2].map(() => ({
            type: defaultType,
            w1: 'fists',
            w2: 'fists',
            queue: []
        }));
    }

    initDOM() {
        this.setupPanel('A');
        this.setupPanel('B');

        document.getElementById('btn-start').onclick = () => {
            // Build current config and start
            const config = this.buildConfig();
            this.onConfigChange(config);
        };

        document.getElementById('btn-reset').onclick = () => {
            // Reset battle
            this.battleRef.initialize(this.buildConfig());
        };

        // AI Toggle
        const aiChk = document.getElementById('chk-vs-ai');
        if (aiChk) {
            this.vsAI = aiChk.checked;
            this.toggleAiMode(this.vsAI);

            aiChk.onchange = (e) => {
                this.vsAI = e.target.checked;
                this.toggleAiMode(this.vsAI);
            };
        }

        // Log hook
        this.logElem = document.getElementById('log-console');
        this.battleRef.setLogCallback((msg) => {
            const div = document.createElement('div');
            div.textContent = msg;
            this.logElem.appendChild(div);
            this.logElem.scrollTop = this.logElem.scrollHeight;
        });
    }

    toggleAiMode(enabled) {
        const teamBPanel = document.getElementById('team-b-section');
        if (!teamBPanel) return;

        if (enabled) {
            teamBPanel.style.opacity = '0.5';
            teamBPanel.style.pointerEvents = 'none';
            teamBPanel.style.filter = 'grayscale(100%)';
        } else {
            teamBPanel.style.opacity = '1';
            teamBPanel.style.pointerEvents = 'auto';
            teamBPanel.style.filter = 'none';
        }
    }

    setupPanel(teamId) {
        const pfx = `char-${teamId.toLowerCase()}`;

        // Slot Selector
        const slotSel = document.getElementById(`team-${teamId.toLowerCase()}-slot`);
        slotSel.onchange = (e) => {
            this.currentSlots[teamId] = parseInt(e.target.value);
            this.refreshPanel(teamId);
        };

        // Character Type
        const typeSel = document.getElementById(`${pfx}-type`);
        this.populateSelect(typeSel, CHARACTERS);
        typeSel.onchange = (e) => this.onSelectionChange(teamId, 'type', e.target.value);

        // Weapons
        const w1Sel = document.getElementById(`${pfx}-w1`);
        this.populateSelect(w1Sel, WEAPONS);
        w1Sel.onchange = (e) => this.onSelectionChange(teamId, 'w1', e.target.value);

        const w2Sel = document.getElementById(`${pfx}-w2`);
        this.populateSelect(w2Sel, WEAPONS);
        w2Sel.onchange = (e) => this.onSelectionChange(teamId, 'w2', e.target.value);

        // Initial View Refresh
        this.refreshPanel(teamId);
    }

    // Refresh inputs to match current Slot data
    refreshPanel(teamId) {
        const slotIdx = this.currentSlots[teamId];
        const data = this.teams[teamId][slotIdx];
        const pfx = `char-${teamId.toLowerCase()}`;

        document.getElementById(`${pfx}-type`).value = data.type;
        document.getElementById(`${pfx}-w1`).value = data.w1;
        document.getElementById(`${pfx}-w2`).value = data.w2;

        this.updateSkillPool(teamId);
    }

    populateSelect(elem, sourceObj) {
        elem.innerHTML = '';
        for (const [key, val] of Object.entries(sourceObj)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = val.name;
            elem.appendChild(opt);
        }
    }

    onSelectionChange(teamId, field, value) {
        const slotIdx = this.currentSlots[teamId];
        this.teams[teamId][slotIdx][field] = value;

        // Refresh pool and VALDIATE QUEUE
        this.updateSkillPool(teamId);
    }

    updateSkillPool(teamId) {
        const pfx = `char-${teamId.toLowerCase()}`;
        const poolDiv = document.getElementById(`${pfx}-pool`);
        const slotIdx = this.currentSlots[teamId];
        const data = this.teams[teamId][slotIdx];

        poolDiv.innerHTML = '';

        // Gather available skills
        const availableSkills = new Set();
        // 1. Character Innate
        const charData = CHARACTERS[data.type];
        if (charData.baseSkill) availableSkills.add(charData.baseSkill);

        // 2. Weapon 1
        const w1Data = WEAPONS[data.w1];
        if (w1Data && w1Data.skills) w1Data.skills.forEach(s => availableSkills.add(s));

        // 3. Weapon 2
        const w2Data = WEAPONS[data.w2];
        if (w2Data && w2Data.skills) w2Data.skills.forEach(s => availableSkills.add(s));

        // Render Chips
        availableSkills.forEach(skillId => {
            const skillDef = SKILLS[skillId];
            if (!skillDef) return;

            const chip = document.createElement('div');
            chip.className = 'skill-chip';
            chip.textContent = skillDef.name;
            chip.onclick = () => this.addToQueue(teamId, skillId);
            poolDiv.appendChild(chip);
        });

        // BUG FIX: Validate Queue
        // Remove skills that are no longer in availableSkills
        const newQueue = data.queue.filter(sId => availableSkills.has(sId));
        if (newQueue.length !== data.queue.length) {
            data.queue = newQueue;
        }

        // Also refresh the Queue view
        this.renderQueue(teamId);
    }

    addToQueue(teamId, skillId) {
        const slotIdx = this.currentSlots[teamId];
        this.teams[teamId][slotIdx].queue.push(skillId);
        this.renderQueue(teamId);
    }

    removeFromQueue(teamId, index) {
        const slotIdx = this.currentSlots[teamId];
        this.teams[teamId][slotIdx].queue.splice(index, 1);
        this.renderQueue(teamId);
    }

    renderQueue(teamId) {
        const pfx = `char-${teamId.toLowerCase()}`;
        const queueDiv = document.getElementById(`${pfx}-queue`);
        const slotIdx = this.currentSlots[teamId];
        const data = this.teams[teamId][slotIdx];

        queueDiv.innerHTML = '';

        data.queue.forEach((skillId, idx) => {
            const skillDef = SKILLS[skillId];
            const chip = document.createElement('div');
            chip.className = 'skill-chip in-queue';
            chip.textContent = `${idx + 1}. ${skillDef ? skillDef.name : skillId}`;
            chip.onclick = () => this.removeFromQueue(teamId, idx);
            queueDiv.appendChild(chip);
        });
    }

    buildConfig() {
        // Team A is always Manual
        const configTeamA = this.teams.A.map(d => ({
            template: CHARACTERS[d.type],
            skillQueue: [...d.queue]
        }));

        // Team B: AI or Manual
        let configTeamB;
        if (this.vsAI) {
            // Generate Random Team
            const randomTeam = AIOpponent.generateRandomTeam('B', CHARACTERS, WEAPONS);
            configTeamB = randomTeam.map(d => ({
                template: CHARACTERS[d.type],
                skillQueue: [...d.queue]
            }));
            console.log("Generated AI Team:", configTeamB);
        } else {
            configTeamB = this.teams.B.map(d => ({
                template: CHARACTERS[d.type],
                skillQueue: [...d.queue]
            }));
        }

        return {
            teamA: configTeamA,
            teamB: configTeamB
        };
    }
}

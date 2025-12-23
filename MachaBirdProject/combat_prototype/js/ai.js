export class AIOpponent {
    static generateRandomTeam(teamId, characters, weapons) {
        const team = [];
        for (let i = 0; i < 3; i++) {
            team.push(this.createRandomCharacter(characters, weapons));
        }
        return team;
    }

    static createRandomCharacter(characters, weapons) {
        // 1. Pick a random Class
        const classKeys = Object.keys(characters);
        const type = classKeys[Math.floor(Math.random() * classKeys.length)];

        // 2. Pick Weapons
        const w1 = this.pickRandomWeapon(weapons);
        const w2 = this.pickRandomWeapon(weapons);

        // 3. Generate Skill Queue (5-8 skills)
        const queue = [];
        const queueLength = 5 + Math.floor(Math.random() * 4); // 5 to 8

        // Pool of available skills: Base + W1 + W2
        const pool = [];
        if (characters[type].baseSkill) pool.push(characters[type].baseSkill);
        if (weapons[w1].skills) pool.push(...weapons[w1].skills);
        if (weapons[w2].skills) pool.push(...weapons[w2].skills);

        for (let k = 0; k < queueLength; k++) {
            const skillId = pool[Math.floor(Math.random() * pool.length)];
            queue.push(skillId);
        }

        return {
            type: type,
            w1: w1,
            w2: w2,
            queue: queue
        };
    }

    static pickRandomWeapon(weapons) {
        const keys = Object.keys(weapons);
        return keys[Math.floor(Math.random() * keys.length)];
    }
}

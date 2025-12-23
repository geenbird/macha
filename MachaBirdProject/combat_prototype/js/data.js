
export const SKILL_TYPE = {
    MELEE: 'MELEE',
    RANGED: 'RANGED',
    HEAL: 'HEAL',
    BUFF: 'BUFF'
};

export class Skill {
    constructor(id, name, range, damage, castTime, cooldown, type = SKILL_TYPE.MELEE) {
        this.id = id;
        this.name = name;
        this.range = range;
        this.damage = damage;
        this.castTime = castTime; // in seconds
        this.cooldown = cooldown; // in seconds
        this.type = type;
    }
}

export const SKILLS = {
    // Basic
    'punch': new Skill('punch', 'Punch', 50, 10, 0.5, 0, SKILL_TYPE.MELEE),
    'shoot': new Skill('shoot', 'Shoot', 300, 8, 0.3, 0, SKILL_TYPE.RANGED),

    // Sword Skills
    'slash': new Skill('slash', 'Slash', 60, 15, 0.8, 0, SKILL_TYPE.MELEE),
    'thrust': new Skill('thrust', 'Thrust', 70, 20, 1.0, 0, SKILL_TYPE.MELEE),

    // Dagger Skills
    'quick_stab': new Skill('quick_stab', 'Quick Stab', 40, 8, 0.3, 0, SKILL_TYPE.MELEE),

    // Axe Skills
    'cleave': new Skill('cleave', 'Cleave', 70, 25, 1.2, 0, SKILL_TYPE.MELEE),
    'smash': new Skill('smash', 'Smash', 60, 35, 1.5, 0, SKILL_TYPE.MELEE),

    // Bow/Crossbow Skills
    'power_shot': new Skill('power_shot', 'Power Shot', 400, 25, 1.5, 0, SKILL_TYPE.RANGED),
    'rapid_fire': new Skill('rapid_fire', 'Rapid Fire', 250, 5, 0.2, 0, SKILL_TYPE.RANGED),
    'snipe': new Skill('snipe', 'Snipe', 500, 40, 2.0, 0, SKILL_TYPE.RANGED),

    // Magic Skills
    'fireball': new Skill('fireball', 'Fireball', 200, 30, 2.0, 0, SKILL_TYPE.RANGED),
    'frostbolt': new Skill('frostbolt', 'Frostbolt', 250, 15, 1.5, 0, SKILL_TYPE.RANGED), // Should slow?
    'ice_wall': new Skill('ice_wall', 'Ice Shard', 300, 20, 1.8, 0, SKILL_TYPE.RANGED),

    // Healing
    'heal': new Skill('heal', 'Heal', 500, -20, 1.5, 0, SKILL_TYPE.HEAL),
    'greater_heal': new Skill('greater_heal', 'Greater Heal', 500, -50, 3.0, 0, SKILL_TYPE.HEAL),
};

export const WEAPONS = {
    'fists': { name: 'Fists', skills: ['punch'] },
    'dagger': { name: 'Dagger', skills: ['quick_stab'] },
    'iron_sword': { name: 'Iron Sword', skills: ['slash', 'thrust'] },
    'great_axe': { name: 'Great Axe', skills: ['cleave', 'smash'] },
    'wood_bow': { name: 'Wooden Bow', skills: ['shoot', 'power_shot'] },
    'crossbow': { name: 'Crossbow', skills: ['shoot', 'snipe'] },
    'magic_wand': { name: 'Magic Wand', skills: ['fireball', 'heal'] },
    'ice_staff': { name: 'Ice Staff', skills: ['frostbolt', 'ice_wall'] },
    'cleric_tome': { name: 'Cleric Tome', skills: ['heal', 'greater_heal'] }
};

export const CHARACTERS = {
    'warrior': { name: 'Warrior', hp: 100, speed: 60, baseSkill: 'punch', color: '#ff4444', classType: 'MELEE' },
    'archer': { name: 'Archer', hp: 80, speed: 100, baseSkill: 'shoot', color: '#44ff44', classType: 'RANGED' },
    'mage': { name: 'Mage', hp: 70, speed: 50, baseSkill: 'punch', color: '#4444ff', classType: 'RANGED' }
};

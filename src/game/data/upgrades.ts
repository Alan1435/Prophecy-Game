// src/game/data/upgrades.ts
import { GameState } from '../interfaces/GameState';
import { Upgrade } from '../interfaces/Upgrade';

export const baseUpgrades: Upgrade[] = [
    // Basic Meditation Upgrades
    {
        id: 'meditation1',
        name: 'Enhanced Meditation',
        description: 'Increase your meditation blessing power by 0.5',
        baseCost: 15,
        currentCost: 15,
        effect: (state: GameState) => { state.blessings.meditation += 0.5; },
        purchased: false,
        visible: true,
        level: 0,
        costScaling: 1.7
    },
    {
        id: 'meditation_focus',
        name: 'Deep Focus',
        description: 'Meditation is 25% more effective',
        baseCost: 50,
        currentCost: 50,
        effect: (state: GameState) => { state.blessings.meditation *= 1.25; },
        purchased: false,
        visible: false,
        requiredProgress: 20,
        level: 0,
        costScaling: 2.0
    },

    // Prayer Chain Upgrades
    {
        id: 'prayer1',
        name: 'Group Prayer',
        description: 'Increase your prayer blessing power by 0.5',
        baseCost: 35,
        currentCost: 35,
        effect: (state: GameState) => { state.blessings.prayer += 0.5; },
        purchased: false,
        visible: true,
        requiredProgress: 15,
        level: 0,
        costScaling: 1.8
    },
    {
        id: 'prayer_circle',
        name: 'Prayer Circle',
        description: 'Prayer affects both active and passive gains 10% more',
        baseCost: 75,
        currentCost: 75,
        effect: (state: GameState) => { state.blessings.prayer *= 1.1; },
        purchased: false,
        visible: false,
        requiredProgress: 30,
        level: 0,
        costScaling: 2.0
    },

    // Ritual Upgrades
    {
        id: 'ritual1',
        name: 'Ancient Rituals',
        description: 'Increase your ritual blessing power by 0.5',
        baseCost: 75,
        currentCost: 75,
        effect: (state: GameState) => { state.blessings.rituals += 0.5; },
        purchased: false,
        visible: false,
        requiredProgress: 35,
        level: 0,
        costScaling: 1.9
    },
    {
        id: 'ritual_mastery',
        name: 'Ritual Mastery',
        description: 'Rituals are 20% more powerful',
        baseCost: 150,
        currentCost: 150,
        effect: (state: GameState) => { state.blessings.rituals *= 1.2; },
        purchased: false,
        visible: false,
        requiredProgress: 45,
        level: 0,
        costScaling: 2.1
    },

    // Wisdom Chain
    {
        id: 'wisdom1',
        name: 'Divine Wisdom',
        description: 'Increase your wisdom blessing power by 0.5',
        baseCost: 150,
        currentCost: 150,
        effect: (state: GameState) => { state.blessings.wisdom += 0.5; },
        purchased: false,
        visible: false,
        requiredProgress: 65,
        level: 0,
        costScaling: 2.1
    },
    {
        id: 'wisdom_synergy',
        name: 'Wisdom Synergy',
        description: 'Wisdom increases based on other blessing levels',
        baseCost: 300,
        currentCost: 300,
        effect: (state: GameState) => { 
            const otherBlessings = state.blessings.meditation + state.blessings.prayer + state.blessings.rituals;
            state.blessings.wisdom += otherBlessings * 0.1;
        },
        purchased: false,
        visible: false,
        requiredProgress: 80,
        level: 0,
        costScaling: 2.5
    },

    // Special Synergy Upgrades
    {
        id: 'meditation_ritual',
        name: 'Meditative Rituals',
        description: 'Meditation and Rituals boost each other by 10%',
        baseCost: 200,
        currentCost: 200,
        effect: (state: GameState) => {
            const bonus = 1.1;
            state.blessings.meditation *= bonus;
            state.blessings.rituals *= bonus;
        },
        purchased: false,
        visible: false,
        requiredProgress: 50,
        level: 0,
        costScaling: 2.2
    },
    {
        id: 'prayer_wisdom',
        name: 'Sacred Knowledge',
        description: 'Prayer and Wisdom enhance each other by 15%',
        baseCost: 250,
        currentCost: 250,
        effect: (state: GameState) => {
            const bonus = 1.15;
            state.blessings.prayer *= bonus;
            state.blessings.wisdom *= bonus;
        },
        purchased: false,
        visible: false,
        requiredProgress: 70,
        level: 0,
        costScaling: 2.3
    }
];
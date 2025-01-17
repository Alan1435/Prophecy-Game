// src/game/interfaces/GameState.ts
import { Upgrade } from './Upgrade';

export interface GameState {
    divineEnergy: number;
    followers: number;
    prophecyProgress: number;
    blessings: {
        meditation: number;
        prayer: number;
        rituals: number;
        wisdom: number;
    };
    upgrades: Upgrade[];
    bonuses: {
        passiveGain: number;
        clickPower: number;
        idleGain: number;
        comboGain: number;
        blessingEffectiveness: number;
        upgradeCostReduction: number;
        consecutiveClicks: number;
        lastClickTime: number;
    };
    completedPaths: {
        patience: number;
        persistence: number;
        piety: number;
    };
}
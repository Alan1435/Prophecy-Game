// src/game/interfaces/GameState.ts
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
        lastClickTime?: number;
        consecutiveClicks: number;
    };
    completedPaths: {
        patience: number;
        persistence: number;
        piety: number;
    };
}
// src/game/interfaces/Upgrade.ts
import type { GameState } from './GameState';

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    baseCost: number;
    currentCost: number;
    effect: (state: GameState) => void;
    purchased: boolean;
    visible: boolean;
    requiredProgress?: number;
    level: number;
    costScaling: number;
}
import * as PIXI from 'pixi.js';
import { GameState } from '../interfaces/GameState';

export class UISystem {
    uiText: {
        divineEnergy: PIXI.Text;
        prophecyProgress: PIXI.Text;
        blessings: PIXI.Text;
    };

    constructor() {
        // Initialize text elements
        this.uiText = {
            divineEnergy: new PIXI.Text('', {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: 0xffd700, // Gold color
                align: 'left'
            }),
            prophecyProgress: new PIXI.Text('', {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xe6e6fa, // Light purple
                align: 'left'
            }),
            blessings: new PIXI.Text('', {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xb19cd9, // Medium purple
                align: 'left'
            })
        };
    }

    updateUI(state: GameState, progressPercentage: number) {
        this.uiText.divineEnergy.text = `Divine Energy: ${Math.floor(state.divineEnergy)}`;
        this.uiText.prophecyProgress.text = `Prophecy Progress: ${Math.floor(progressPercentage)}%`;
        this.uiText.blessings.text = 'Active Blessings:\n' +
            `Meditation: x${state.blessings.meditation}\n` +
            `Prayer: x${state.blessings.prayer}\n` +
            `Rituals: x${state.blessings.rituals}\n` +
            `Wisdom: x${state.blessings.wisdom}`;
    }

    positionElements(width: number, height: number) {
        // Position UI elements on screen
        this.uiText.divineEnergy.position.set(20, 20);
        this.uiText.prophecyProgress.position.set(20, 60);
        this.uiText.blessings.position.set(20, height - 120);
    }
}
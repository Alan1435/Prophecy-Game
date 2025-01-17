import * as PIXI from 'pixi.js';
import { GameState } from '../interfaces/GameState';
import { Upgrade } from '../interfaces/Upgrade';

export class UpgradeSystem {
    container: PIXI.Container;
    buttons: Map<string, PIXI.Container>;

    constructor() {
        this.container = new PIXI.Container();
        this.buttons = new Map();
    }

    createButton(
        upgrade: Upgrade, 
        index: number, 
        state: GameState, 
        onPurchase: (upgrade: Upgrade) => void, 
        showTooltip: Function, 
        hideTooltip: Function
    ): PIXI.Container {
        const button = new PIXI.Container();
        
        // Create button background
        const background = new PIXI.Graphics();
        const canAfford = state.divineEnergy >= upgrade.currentCost;
        background.beginFill(canAfford ? 0x2a4a2a : 0x4a4a4a);
        background.drawRoundedRect(0, 0, 200, 60, 10);
        background.endFill();

        // Create button text
        const text = new PIXI.Text(
            `${upgrade.name} (Level ${upgrade.level})\nCost: ${Math.floor(upgrade.currentCost)}`,
            {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: canAfford ? 0xffffff : 0x888888,
                align: 'center'
            }
        );
        text.position.set(10, 10);

        button.addChild(background);
        button.addChild(text);
        
        // Position button
        button.position.set(window.innerWidth - 220, 20 + (index * 70));

        // Add interactivity
        button.eventMode = 'static';
        button.cursor = 'pointer';
        
        // Add hover effects
        button.on('pointerover', (event) => {
            const mousePosition = event.client;
            const currentValue = this.getBlessingValueById(upgrade.id, state);
            showTooltip(
                `${upgrade.name} (Level ${upgrade.level})`,
                `${upgrade.description}\n\nCurrent Value: ${currentValue}\nNext Level: ${currentValue + 1}\nCost: ${Math.floor(upgrade.currentCost)} Divine Energy`,
                mousePosition.x,
                mousePosition.y,
                'upgrade'
            );
            background.tint = 0x3a5a3a;
        });

        button.on('pointerout', () => {
            hideTooltip();
            background.tint = 0xffffff;
        });

        // Add click handler
        button.on('pointerdown', () => onPurchase(upgrade));

        return button;
    }

    getBlessingValueById(upgradeId: string, state: GameState): number {
        switch(upgradeId) {
            case 'meditation1': return state.blessings.meditation;
            case 'prayer1': return state.blessings.prayer;
            case 'ritual1': return state.blessings.rituals;
            case 'wisdom1': return state.blessings.wisdom;
            default: return 0;
        }
    }

    updateButtons(
        state: GameState, 
        onPurchase: (upgrade: Upgrade) => void, 
        showTooltip: Function, 
        hideTooltip: Function
    ) {
        // Clear existing buttons
        this.container.removeChildren();
        this.buttons.clear();

        // Create new buttons for visible upgrades
        let visibleIndex = 0;
        state.upgrades.forEach(upgrade => {
            if (this.shouldShowUpgrade(upgrade, state)) {
                const button = this.createButton(
                    upgrade, 
                    visibleIndex, 
                    state, 
                    onPurchase, 
                    showTooltip, 
                    hideTooltip
                );
                this.buttons.set(upgrade.id, button);
                this.container.addChild(button);
                visibleIndex++;
            }
        });
    }

    private shouldShowUpgrade(upgrade: Upgrade, state: GameState): boolean {
        if (!upgrade.visible && upgrade.requiredProgress && 
            state.prophecyProgress >= upgrade.requiredProgress) {
            upgrade.visible = true;
        }
        return upgrade.visible;
    }
}
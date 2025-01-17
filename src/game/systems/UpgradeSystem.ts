import * as PIXI from 'pixi.js';
import gsap from 'gsap';
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
        
        // Create button background with gradient effect
        const background = new PIXI.Graphics();
        const canAfford = state.divineEnergy >= upgrade.currentCost;
        
        // Gradient background
        const baseColor = canAfford ? 0x2a4a2a : 0x4a4a4a;
        const gradientStops = [
            { offset: 0, color: baseColor },
            { offset: 0.5, color: (baseColor + 0x111111) & 0xffffff },
            { offset: 1, color: baseColor }
        ];
        
        background.beginFill(baseColor);
        background.lineStyle(2, canAfford ? 0x00ff00 : 0x666666);
        background.drawRoundedRect(0, 0, 220, 80, 10);
        background.endFill();

        // Add shine effect
        const shine = new PIXI.Graphics();
        shine.beginFill(0xffffff, 0.1);
        shine.drawRoundedRect(0, 0, 220, 40, 10);
        shine.endFill();
        shine.alpha = 0.2;

        // Create level indicator
        const levelBadge = new PIXI.Container();
        const badgeBackground = new PIXI.Graphics();
        badgeBackground.beginFill(0xffd700);
        badgeBackground.drawCircle(0, 0, 15);
        badgeBackground.endFill();
        const levelText = new PIXI.Text(upgrade.level.toString(), {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x000000,
            align: 'center'
        });
        levelText.anchor.set(0.5);
        levelBadge.addChild(badgeBackground, levelText);
        levelBadge.position.set(200, 15);

        // Create texts with better styling
        const nameText = new PIXI.Text(upgrade.name, {
            fontFamily: 'Arial',
            fontSize: 16,
            fontWeight: 'bold',
            fill: canAfford ? 0xffffff : 0x888888,
            align: 'left'
        });
        nameText.position.set(15, 15);

        const costText = new PIXI.Text(`Cost: ${Math.floor(upgrade.currentCost)}`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: canAfford ? 0x00ff00 : 0xff0000,
            align: 'left'
        });
        costText.position.set(15, 45);

        // Add everything to button
        button.addChild(background, shine, levelBadge, nameText, costText);
        
        // Position the button
        button.position.set(
            window.innerWidth - 240,
            20 + (index * 90)
        );

        // Add interactivity
        button.eventMode = 'static';
        button.cursor = canAfford ? 'pointer' : 'not-allowed';

        // Interactive effects
        button.on('pointerover', (event) => {
            if (canAfford) {
                background.tint = 0xcccccc;
                shine.alpha = 0.3;
                nameText.style.fontSize = 17;
                gsap.to(button.scale, { x: 1.05, y: 1.05, duration: 0.2 });
            }
            showTooltip(
                upgrade.name,
                `${upgrade.description}\nCost: ${Math.floor(upgrade.currentCost)} Divine Energy\nLevel: ${upgrade.level}`,
                event.client.x,
                event.client.y,
                'upgrade'
            );
        });

        button.on('pointerout', () => {
            background.tint = 0xffffff;
            shine.alpha = 0.2;
            nameText.style.fontSize = 16;
            gsap.to(button.scale, { x: 1, y: 1, duration: 0.2 });
            hideTooltip();
        });

        // Purchase animation
        button.on('pointerdown', () => {
            if (canAfford) {
                // Click effect
                gsap.to(button.scale, {
                    x: 0.95,
                    y: 0.95,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        // Purchase flash effect
                        const flash = new PIXI.Graphics();
                        flash.beginFill(0xffffff);
                        flash.drawRoundedRect(0, 0, 220, 80, 10);
                        flash.endFill();
                        flash.alpha = 0.5;
                        button.addChild(flash);

                        gsap.to(flash, {
                            alpha: 0,
                            duration: 0.3,
                            onComplete: () => {
                                button.removeChild(flash);
                                onPurchase(upgrade);
                            }
                        });
                    }
                });
            }
        });

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
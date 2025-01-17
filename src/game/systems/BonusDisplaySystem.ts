// src/game/systems/BonusDisplaySystem.ts
import * as PIXI from 'pixi.js';
import { GameState } from '../interfaces/GameState';

interface BonusIcon {
    container: PIXI.Container;
    background: PIXI.Graphics;
    icon: PIXI.Text; // Using text emoji as icons for now
    value: PIXI.Text;
    type: string;
}

export class BonusDisplaySystem {
    container: PIXI.Container;
    private icons: Map<string, BonusIcon>;
    private readonly ICON_SIZE = 40;
    private readonly ICON_SPACING = 10;
    private readonly ICONS_CONFIG = [
        { type: 'clickPower', emoji: '👆', label: 'Click Power' },
        { type: 'passiveGain', emoji: '⏳', label: 'Passive Gain' },
        { type: 'comboGain', emoji: '⚡', label: 'Combo Power' },
        { type: 'idleGain', emoji: '💤', label: 'Idle Bonus' },
        { type: 'blessingEffectiveness', emoji: '✨', label: 'Blessing Power' },
        { type: 'upgradeCostReduction', emoji: '💰', label: 'Cost Reduction' }
    ];

    constructor() {
        this.container = new PIXI.Container();
        this.icons = new Map();
        this.initializeIcons();
    }

    private initializeIcons() {
        this.ICONS_CONFIG.forEach((config, index) => {
            const icon = this.createBonusIcon(config.type, config.emoji, config.label, index);
            this.icons.set(config.type, icon);
            this.container.addChild(icon.container);
        });
    }

    private createBonusIcon(type: string, emoji: string, label: string, index: number): BonusIcon {
        const container = new PIXI.Container();
        
        // Create background circle
        const background = new PIXI.Graphics();
        background.beginFill(0x2a1f2d);
        background.lineStyle(2, 0xffd700);
        background.drawCircle(this.ICON_SIZE/2, this.ICON_SIZE/2, this.ICON_SIZE/2);
        background.endFill();

        // Create icon (emoji)
        const icon = new PIXI.Text(emoji, {
            fontSize: 20,
            align: 'center'
        });
        icon.anchor.set(0.5);
        icon.position.set(this.ICON_SIZE/2, this.ICON_SIZE/2);

        // Create value text
        const value = new PIXI.Text('1.0x', {
            fontSize: 12,
            fill: 0xffd700,
            align: 'center'
        });
        value.anchor.set(0.5, 0);
        value.position.set(this.ICON_SIZE/2, this.ICON_SIZE + 5);

        // Add everything to container
        container.addChild(background);
        container.addChild(icon);
        container.addChild(value);

        // Position the container
        container.position.set(
            index * (this.ICON_SIZE + this.ICON_SPACING),
            0
        );

        // Add interactivity
        container.eventMode = 'static';
        container.cursor = 'pointer';

        const bonusIcon: BonusIcon = {
            container,
            background,
            icon,
            value,
            type
        };

        // Add hover effects
        this.addIconInteractivity(bonusIcon, label);

        return bonusIcon;
    }

    private addIconInteractivity(bonusIcon: BonusIcon, label: string) {
        bonusIcon.container.on('pointerover', (event) => {
            bonusIcon.background.tint = 0x3a2f3d;
            if (this.onShowTooltip) {
                const mousePosition = event.client;
                let description = '';
    
                switch (bonusIcon.type) {
                    case 'clickPower':
                        description = `Current: ${bonusIcon.value.text}\n` +
                            `Maximum: Persistence path (+10 per level)\n\n` +
                            `• Increases with rapid clicking\n` +
                            `• Decreases when idle\n` +
                            `• Resets to 1x on long idle`;
                        break;
                        
                    case 'passiveGain':
                        description = `Current: ${bonusIcon.value.text}\n` +
                            `Maximum: Patience path (+10 per level)\n\n` +
                            `• Increases while idle\n` +
                            `• Resets to 1x when clicking\n` +
                            `• Takes time to build up`;
                        break;
    
                    case 'comboGain':
                        description = `Gives bonus energy for consecutive clicks\n` +
                            `Unlocked through Persistence path`;
                        break;
    
                    case 'idleGain':
                        description = `Additional multiplier while idle\n` +
                            `Unlocked through Patience path`;
                        break;
    
                    case 'blessingEffectiveness':
                        description = `Multiplies the power of all blessings\n` +
                            `Unlocked through Piety path`;
                        break;
    
                    case 'upgradeCostReduction':
                        description = `Reduces the cost of all upgrades\n` +
                            `Unlocked through Piety path`;
                        break;
                }
    
                this.onShowTooltip(
                    label, // Just use the label from ICONS_CONFIG
                    description,
                    mousePosition.x,
                    mousePosition.y,
                    'bonus'
                );
            }
        });
    
    
        bonusIcon.container.on('pointerout', () => {
            bonusIcon.background.tint = 0xffffff;
            if (this.onHideTooltip) {
                this.onHideTooltip();
            }
        });
    
        bonusIcon.container.on('pointermove', (event) => {
            if (this.onMoveTooltip) {
                const mousePosition = event.client;
                this.onMoveTooltip(mousePosition.x, mousePosition.y);
            }
        });
    }

    onShowTooltip: ((title: string, desc: string, x: number, y: number, id: string) => void) | null = null;
    onHideTooltip: (() => void) | null = null;
    onMoveTooltip: ((x: number, y: number) => void) | null = null;

    setTooltipCallbacks(
        showTooltip: (title: string, desc: string, x: number, y: number, id: string) => void,
        hideTooltip: () => void,
        moveTooltip: (x: number, y: number) => void
    ) {
        this.onShowTooltip = showTooltip;
        this.onHideTooltip = hideTooltip;
        this.onMoveTooltip = moveTooltip;
    }

    updateBonuses(state: GameState) {
        this.icons.forEach((icon, type) => {
            const value = state.bonuses[type as keyof typeof state.bonuses];
            if (typeof value === 'number' && !['lastClickTime', 'consecutiveClicks'].includes(type)) {
                icon.value.text = value.toFixed(1) + 'x';
                
                // Update visibility based on whether there's a bonus
                icon.container.alpha = value > 1 ? 1 : 0.5;
            }
        });
    }

    positionIcons(width: number, height: number) {
        // Position the entire container at the bottom of the screen
        this.container.position.set(
            width/2 - (this.ICONS_CONFIG.length * (this.ICON_SIZE + this.ICON_SPACING))/2,
            height - this.ICON_SIZE - 20
        );
    }
}
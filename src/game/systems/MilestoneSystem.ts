// src/game/systems/MilestoneSystem.ts
import * as PIXI from 'pixi.js';
import { GameState } from '../interfaces/GameState';

export interface PathBonus {
    type: 'patience' | 'persistence' | 'piety';
    level: number;
    effects: {
        description: string;
        apply: (state: GameState) => void;
    }[];
}

export class MilestoneSystem {
    container: PIXI.Container;
    visible: boolean;
    selectedPath: PathBonus | null = null;
    completions: number = 0;

    private choiceButtons: PIXI.Container[] = [];
    private background!: PIXI.Graphics;
    private titleText!: PIXI.Text;

    constructor() {
        this.container = new PIXI.Container();
        this.visible = false;
        this.setupUI();
    }

    private setupUI() {
        // Create darkened background
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x000000, 0.8);
        this.background.drawRect(0, 0, window.innerWidth, window.innerHeight);
        this.background.endFill();

        // Create title
        this.titleText = new PIXI.Text('Prophecy Fulfilled!', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xffd700,
            align: 'center'
        });

        this.container.addChild(this.background);
        this.container.addChild(this.titleText);
        this.container.visible = false;
    }

    showChoices(state: GameState, onChoice: (path: PathBonus) => void) {
        this.container.visible = true;
        this.visible = true;
        
        // Position title
        this.titleText.position.set(
            window.innerWidth / 2 - this.titleText.width / 2,
            50
        );

        // Clear existing choice buttons
        this.choiceButtons.forEach(button => this.container.removeChild(button));
        this.choiceButtons = [];

        // Create choice buttons
        const choices = this.getPathChoices();
        choices.forEach((choice, index) => {
            const button = this.createChoiceButton(choice, index, onChoice);
            this.choiceButtons.push(button);
            this.container.addChild(button);
        });
    }

    private createChoiceButton(
        choice: PathBonus, 
        index: number, 
        onChoice: (path: PathBonus) => void
    ): PIXI.Container {
        const button = new PIXI.Container();
        
        // Create button background
        const background = new PIXI.Graphics();
        background.beginFill(0x2a1f2d);
        background.lineStyle(2, 0xffd700);
        background.drawRoundedRect(0, 0, 250, 300, 10);
        background.endFill();

        // Create title text
        const title = new PIXI.Text(this.getPathTitle(choice.type), {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffd700,
            align: 'center'
        });
        title.position.set(125 - title.width / 2, 20);

        // Create description text
        const description = new PIXI.Text(this.getPathDescription(choice), {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 230
        });
        description.position.set(10, 60);

        button.addChild(background);
        button.addChild(title);
        button.addChild(description);

        // Position button
        button.position.set(
            window.innerWidth / 2 - 375 + index * 250 + index * 25,
            150
        );

        // Add interactivity
        button.eventMode = 'static';
        button.cursor = 'pointer';

        // Hover effects
        button.on('pointerover', () => {
            background.tint = 0x3a2f3d;
        });

        button.on('pointerout', () => {
            background.tint = 0xffffff;
        });

        // Click handler
        button.on('pointerdown', () => {
            this.selectedPath = choice;
            onChoice(choice);
            this.hide();
        });

        return button;
    }

    private getPathChoices(): PathBonus[] {
        return [
            {
                type: 'patience',
                level: this.completions + 1,
                effects: [
                    {
                        description: 'Increase maximum passive bonus by 10',
                        apply: (state) => { }
                    },
                    {
                        description: 'Energy builds up while idle',
                        apply: (state) => { state.bonuses.idleGain += 0.05; }
                    }
                ]
            },
            {
                type: 'persistence',
                level: this.completions + 1,
                effects: [
                    {
                        description: 'Increase maximum click power by 10',
                        apply: (state) => {}
                    },
                    {
                        description: 'Consecutive clicks give bonus energy',
                        apply: (state) => { state.bonuses.comboGain += 0.05; }
                    }
                ]
            },
            {
                type: 'piety',
                level: this.completions + 1,
                effects: [
                    {
                        description: 'All blessings 25% more effective',
                        apply: (state) => { state.bonuses.blessingEffectiveness *= 1.25; }
                    },
                    {
                        description: 'Upgrade costs reduced by 10%',
                        apply: (state) => { state.bonuses.upgradeCostReduction *= 0.9; }
                    }
                ]
            }
        ];
    }

    private getPathTitle(type: string): string {
        switch(type) {
            case 'patience': return 'Path of Patience';
            case 'persistence': return 'Path of Persistence';
            case 'piety': return 'Path of Piety';
            default: return '';
        }
    }

    private getPathDescription(path: PathBonus): string {
        return `Level ${path.level}\n\nEffects:\n${path.effects.map(e => '• ' + e.description).join('\n')}`;
    }

    hide() {
        this.container.visible = false;
        this.visible = false;
    }

    getNextProgressRequirement(): number {
        // Each completion makes it 50% harder
        return 100 * Math.pow(1.5, this.completions);
    }

    incrementCompletions() {
        this.completions++;
    }
}
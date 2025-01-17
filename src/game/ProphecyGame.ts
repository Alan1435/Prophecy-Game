// src/game/ProphecyGame.ts
import * as PIXI from 'pixi.js';
import { GameState } from './interfaces/GameState';
import { Upgrade } from './interfaces/Upgrade';
import { UISystem } from './systems/UISystem';
import { TooltipSystem } from './systems/TooltipSystem';
import { UpgradeSystem } from './systems/UpgradeSystem';
import { MilestoneSystem } from './systems/MilestoneSystem';
import { PlayStyleSystem } from './systems/PlayStyleSystem';
import { BonusDisplaySystem } from './systems/BonusDisplaySystem';
import { FlameAnimation } from './systems/FlameAnimation';
import { baseUpgrades } from './data/upgrades';

export class ProphecyGame {
    app: PIXI.Application;
    state: GameState;
    textures: { [key: string]: PIXI.Texture };
    flameSpriteSheet!: PIXI.Texture;
    flameAnimation!: FlameAnimation;
    altar!: PIXI.Sprite;
    centerX!: number;
    centerY!: number;
    lastTime!: number;

    // Systems
    uiSystem: UISystem;
    tooltipSystem: TooltipSystem;
    upgradeSystem: UpgradeSystem;
    milestoneSystem: MilestoneSystem;
    playStyleSystem: PlayStyleSystem;
    bonusDisplaySystem: BonusDisplaySystem;

    // Game mechanics constants
    private baseMaxClickPower: number = 10;
    private baseMaxPassiveBonus: number = 10;

    private get MAX_CLICK_POWER(): number {
        return this.baseMaxClickPower + (this.state.completedPaths.persistence * 10);
    }

    private get MAX_PASSIVE_BONUS(): number {
        return this.baseMaxPassiveBonus + (this.state.completedPaths.patience * 10);
    }
    private readonly BASE_DECAY_RATE = 0.1; // Base rate of decay
    private readonly DECAY_ACCELERATION = 2; // How much faster decay gets over time
    private readonly MIN_CLICK_POWER = 1;   
    private readonly PASSIVE_GAIN_INCREASE_RATE = 0.2; // Per second
    private lastClickTime: number = Date.now();

    constructor(width: number, height: number) {
        // Initialize PIXI Application
        this.app = new PIXI.Application({
            width,
            height,
            backgroundColor: 0x2a1f2d,
            antialias: true
        });

        this.centerX = width / 2;
        this.centerY = height / 2;
        this.lastTime = Date.now();

        // Initialize game state
        this.state = {
            divineEnergy: 0,
            followers: 0,
            prophecyProgress: 0,
            blessings: {
                meditation: 1,
                prayer: 1,
                rituals: 1,
                wisdom: 1
            },
            upgrades: [...baseUpgrades],
            bonuses: {
                passiveGain: 1,
                clickPower: 1,
                idleGain: 0,
                comboGain: 0,
                blessingEffectiveness: 1,
                upgradeCostReduction: 1,
                consecutiveClicks: 0,
                lastClickTime: 0
            },
            completedPaths: {
                patience: 0,
                persistence: 0,
                piety: 0
            }
        };

        // Initialize systems
        this.uiSystem = new UISystem();
        this.tooltipSystem = new TooltipSystem(
            () => this.getClickValue(),
            () => this.getPassiveValue()
        );
        this.upgradeSystem = new UpgradeSystem();
        this.milestoneSystem = new MilestoneSystem();
        this.playStyleSystem = new PlayStyleSystem();
        this.bonusDisplaySystem = new BonusDisplaySystem();

        // Initialize textures
        this.textures = {};

        // Start loading assets
        this.loadAssets();
    }

    async loadAssets() {
        try {
            this.flameSpriteSheet = await PIXI.Texture.fromURL('/assets/blue-flame.png');
            this.textures.altar = await PIXI.Texture.fromURL('/assets/altar.png');
            this.startGame();
        } catch (error) {
            console.error('Failed to load texture:', error);
            this.createFallbackTextures();
            this.startGame();
        }
    }

    createFallbackTextures() {
        // Create fallback flame texture
        const flameGraphics = new PIXI.Graphics();
        flameGraphics.beginFill(0x4169E1);
        flameGraphics.drawRect(0, 0, 90, 90);
        flameGraphics.endFill();
        this.flameSpriteSheet = this.app.renderer.generateTexture(flameGraphics);

        // Create fallback altar texture
        const altarGraphics = new PIXI.Graphics();
        altarGraphics.beginFill(0x4a1c7c);
        altarGraphics.drawRect(0, 0, 100, 80);
        altarGraphics.endFill();
        this.textures.altar = this.app.renderer.generateTexture(altarGraphics);
    }

    startGame() {
        // Create and position flame animation
        this.flameAnimation = new FlameAnimation(this.flameSpriteSheet);
        this.flameAnimation.setPosition(this.centerX, this.centerY - 80);
        this.flameAnimation.setScale(0.3);

        // Create and position altar
        this.altar = new PIXI.Sprite(this.textures.altar);
        this.altar.anchor.set(0.5);
        this.altar.scale.set(0.15);
        this.altar.position.set(this.centerX, this.centerY);



        // Position UI elements
        this.uiSystem.positionElements(this.app.screen.width, this.app.screen.height);
        this.bonusDisplaySystem.positionIcons(this.app.screen.width, this.app.screen.height);

        // Add everything to stage in correct order
        this.app.stage.addChild(this.flameAnimation.container);
        this.app.stage.addChild(this.altar);
        this.app.stage.addChild(this.uiSystem.uiText.divineEnergy);
        this.app.stage.addChild(this.uiSystem.uiText.prophecyProgress);
        this.app.stage.addChild(this.uiSystem.uiText.blessings);
        this.app.stage.addChild(this.tooltipSystem.container);
        this.app.stage.addChild(this.upgradeSystem.container);
        this.app.stage.addChild(this.milestoneSystem.container);
        this.app.stage.addChild(this.bonusDisplaySystem.container);

        // Setup tooltip callbacks
        this.bonusDisplaySystem.setTooltipCallbacks(
            (title, desc, x, y, id) => this.tooltipSystem.showTooltip(title, desc, x, y, id, this.state),
            () => this.tooltipSystem.hideTooltip(),
            (x, y) => this.tooltipSystem.updatePosition(x, y)
        );

        // Add interactions to flame
        this.flameAnimation.sprite.on('pointerdown', () => this.onFlameClick());
        this.flameAnimation.sprite.on('pointerover', () => this.flameAnimation.setHoverScale());
        this.flameAnimation.sprite.on('pointerout', () => this.flameAnimation.setNormalScale());

        // Setup tooltip interactions
        this.setupTooltipInteractions();

        // Initialize upgrade buttons
        this.updateUpgradeButtons();

        // Start game loop
        this.app.ticker.add(this.gameLoop.bind(this));
        
        // Initial UI update
        this.updateUI();
    }

    setupTooltipInteractions() {
        Object.values(this.uiSystem.uiText).forEach(text => {
            text.eventMode = 'static';
            text.cursor = 'help';
        });

        const elements = [
            {
                element: this.uiSystem.uiText.divineEnergy,
                id: 'divine-energy',
                title: 'Divine Energy',
                description: 'Generated by clicking the flame and through blessings'
            },
            {
                element: this.uiSystem.uiText.prophecyProgress,
                id: 'prophecy-progress',
                title: 'Prophecy Progress',
                description: 'Your journey towards fulfilling the prophecy'
            },
            {
                element: this.uiSystem.uiText.blessings,
                id: 'blessings',
                title: 'Blessings',
                description: 'Your active divine blessings'
            }
        ];

        elements.forEach(({ element, id, title, description }) => {
            element.on('pointerover', (event) => {
                const mousePosition = event.client;
                this.tooltipSystem.showTooltip(
                    title,
                    description,
                    mousePosition.x,
                    mousePosition.y,
                    id,
                    this.state
                );
            });

            element.on('pointerout', () => {
                this.tooltipSystem.hideTooltip();
            });

            element.on('pointermove', (event) => {
                const mousePosition = event.client;
                this.tooltipSystem.updatePosition(mousePosition.x, mousePosition.y);
            });
        });
    }

    onFlameClick() {
        const now = Date.now();
        
        // Track click behavior and reset passive
        this.playStyleSystem.onPlayerClick(now);
        this.state.bonuses.passiveGain = 1;
        this.lastClickTime = now;
    
        // Handle click power increase
        if (this.state.bonuses.clickPower < this.MAX_CLICK_POWER) {
            this.state.bonuses.clickPower = Math.min(
                this.MAX_CLICK_POWER,
                this.state.bonuses.clickPower + 0.5
            );
        }
    
        // Calculate and apply gains
        const baseClickValue = this.getClickValue();
        this.state.divineEnergy += baseClickValue;
        this.updateProgress(baseClickValue); // Update progress based on energy gained
    
        this.flameAnimation.pulse();
        this.updateUI();
    }
    
    gameLoop(delta: number) {
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
    
        // Calculate time since last click FIRST
        const timeSinceLastClick = (currentTime - this.lastClickTime) / 1000;
    
        // Handle click power decay
        if (this.state.bonuses.clickPower > this.MIN_CLICK_POWER) {
            const decayRate = this.BASE_DECAY_RATE * 
                            Math.pow(this.DECAY_ACCELERATION, timeSinceLastClick / 5);
            
            this.state.bonuses.clickPower = Math.max(
                this.MIN_CLICK_POWER,
                this.state.bonuses.clickPower - (decayRate * elapsedSeconds)
            );
        }
    
        // Handle passive gain increase
        if (timeSinceLastClick > 1) {
            const newPassiveGain = Math.min(
                this.MAX_PASSIVE_BONUS,
                this.state.bonuses.passiveGain + (this.PASSIVE_GAIN_INCREASE_RATE * elapsedSeconds)
            );
            this.state.bonuses.passiveGain = newPassiveGain;
            
            // Calculate and apply passive gain
            const basePassiveGain = this.getPassiveValue();
            const totalPassiveGain = basePassiveGain * elapsedSeconds;
            this.state.divineEnergy += totalPassiveGain;
            this.updateProgress(totalPassiveGain); // Update progress based on passive gain
        }
    
        this.flameAnimation.update();
        this.updateUI();
    }onFlameClick() {
        const now = Date.now();
        
        // Track click behavior and reset passive
        this.playStyleSystem.onPlayerClick(now);
        this.state.bonuses.passiveGain = 1;
        this.lastClickTime = now;
    
        // Handle click power increase
        if (this.state.bonuses.clickPower < this.MAX_CLICK_POWER) {
            this.state.bonuses.clickPower = Math.min(
                this.MAX_CLICK_POWER,
                this.state.bonuses.clickPower + 0.5
            );
        }
    
        // Calculate and apply gains
        const baseClickValue = this.getClickValue();
        this.state.divineEnergy += baseClickValue;
        this.updateProgress(baseClickValue); // Update progress based on energy gained
    
        this.flameAnimation.pulse();
        this.updateUI();
    }
    
    gameLoop(delta: number) {
        const currentTime = Date.now();
        const elapsedSeconds = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
    
        // Calculate time since last click FIRST
        const timeSinceLastClick = (currentTime - this.lastClickTime) / 1000;
    
        // Handle click power decay
        if (this.state.bonuses.clickPower > this.MIN_CLICK_POWER) {
            const decayRate = this.BASE_DECAY_RATE * 
                            Math.pow(this.DECAY_ACCELERATION, timeSinceLastClick / 5);
            
            this.state.bonuses.clickPower = Math.max(
                this.MIN_CLICK_POWER,
                this.state.bonuses.clickPower - (decayRate * elapsedSeconds)
            );
        }
    
        // Handle passive gain increase
        if (timeSinceLastClick > 1) {
            const newPassiveGain = Math.min(
                this.MAX_PASSIVE_BONUS,
                this.state.bonuses.passiveGain + (this.PASSIVE_GAIN_INCREASE_RATE * elapsedSeconds)
            );
            this.state.bonuses.passiveGain = newPassiveGain;
            
            // Calculate and apply passive gain
            const basePassiveGain = this.getPassiveValue();
            const totalPassiveGain = basePassiveGain * elapsedSeconds;
            this.state.divineEnergy += totalPassiveGain;
            this.updateProgress(totalPassiveGain); // Update progress based on passive gain
        }
    
        this.flameAnimation.update();
        this.updateUI();
    }

    private showMilestoneChoices() {
        this.milestoneSystem.showChoices(this.state, (chosenPath) => {
            chosenPath.effects.forEach(effect => effect.apply(this.state));
            this.state.completedPaths[chosenPath.type]++;
            this.state.prophecyProgress = 0;
            this.milestoneSystem.incrementCompletions();
            this.updateUI();
        });
    }

    purchaseUpgrade(upgrade: Upgrade) {
        const actualCost = upgrade.currentCost * this.state.bonuses.upgradeCostReduction;
        if (this.state.divineEnergy >= actualCost) {
            this.state.divineEnergy -= actualCost;
            upgrade.effect(this.state);
            upgrade.level++;
            upgrade.currentCost *= upgrade.costScaling;
            
            this.playStyleSystem.onUpgradePurchase(upgrade.id);
            this.tooltipSystem.hideTooltip();
            this.updateUpgradeButtons();
            this.updateUI();
        }
    }

    updateUpgradeButtons() {
        this.upgradeSystem.updateButtons(
            this.state,
            (upgrade) => this.purchaseUpgrade(upgrade),
            (title, desc, x, y, id) => this.tooltipSystem.showTooltip(title, desc, x, y, id, this.state),
            () => this.tooltipSystem.hideTooltip()
        );
    }

    private getProgressPercentage(): number {
        const requirement = this.milestoneSystem.getNextProgressRequirement();
        return (this.state.prophecyProgress / requirement) * 100;
    }

    getClickValue(): number {
        // Base value from meditation and prayer
        const baseValue = (this.state.blessings.meditation + this.state.blessings.prayer) / 2;
        return baseValue * this.state.bonuses.clickPower * this.state.blessings.wisdom;
    }

    getPassiveValue(): number {
        // Base value from rituals and prayer
        const baseValue = (this.state.blessings.rituals + this.state.blessings.prayer) / 2 * 0.05;
        return baseValue * this.state.bonuses.passiveGain * this.state.blessings.wisdom;
    }

    updateUI() {
        const progressPercentage = (this.state.prophecyProgress / 100) * 100; // Convert to percentage
        
        this.uiSystem.updateUI(this.state, progressPercentage);
        this.updateUpgradeButtons();
        this.bonusDisplaySystem.updateBonuses(this.state);
    
        if (this.tooltipSystem.container.visible) {
            const currentTooltipId = (this.tooltipSystem.container as any).currentTooltipId;
            if (currentTooltipId) {
                const currentText = this.tooltipSystem.text.text;
                const title = currentText.split('\n')[0];
                this.tooltipSystem.showTooltip(
                    title,
                    '',
                    this.tooltipSystem.container.x,
                    this.tooltipSystem.container.y,
                    currentTooltipId,
                    this.state
                );
            }
        }
    }

    private updateProgress(energyGained: number) {
        const requirement = this.milestoneSystem.getNextProgressRequirement();
        const progressGain = (energyGained / requirement) * 100; // Convert to percentage
        this.state.prophecyProgress = Math.min(100, this.state.prophecyProgress + progressGain);
    
        // Check for completion
        if (this.state.prophecyProgress >= 100) {
            this.showMilestoneChoices();
        }
    }

    resize(width: number, height: number) {
        this.centerX = width / 2;
        this.centerY = height / 2;

        if (this.altar) {
            this.altar.position.set(this.centerX, this.centerY);
        }

        if (this.flameAnimation) {
            this.flameAnimation.setPosition(this.centerX, this.centerY - 80);
        }

        this.uiSystem.positionElements(width, height);
        this.bonusDisplaySystem.positionIcons(width, height);
        this.updateUpgradeButtons();
    }
}

export default ProphecyGame;
// src/game/systems/FlameAnimation.ts
import * as PIXI from 'pixi.js';

export class FlameAnimation {
    container: PIXI.Container;
    sprite: PIXI.AnimatedSprite;
    private normalFrames: PIXI.Texture[] = [];
    private clickFrame: PIXI.Texture | null = null;
    private isClickAnimating: boolean = false;

    constructor(spriteSheet: PIXI.BaseTexture) {
        this.container = new PIXI.Container();
        
        // Create frames from sprite sheet (3x3 grid)
        const frameWidth = spriteSheet.width / 3;
        const frameHeight = spriteSheet.height / 3;

        // Extract first 8 frames for normal animation
        for (let i = 0; i < 8; i++) {
            const x = i % 3;
            const y = Math.floor(i / 3);
            const frame = new PIXI.Texture(
                spriteSheet,
                new PIXI.Rectangle(x * frameWidth, y * frameHeight, frameWidth, frameHeight)
            );
            this.normalFrames.push(frame);
        }

        // Store 9th frame separately for click animation
        this.clickFrame = new PIXI.Texture(
            spriteSheet,
            new PIXI.Rectangle(2 * frameWidth, 2 * frameHeight, frameWidth, frameHeight)
        );

        // Create animated sprite with normal frames
        this.sprite = new PIXI.AnimatedSprite(this.normalFrames);
        
        // Configure animation
        this.sprite.animationSpeed = 0.1;
        this.sprite.anchor.set(0.5);
        this.sprite.loop = true;
        this.sprite.play();

        // Make sprite interactive
        this.sprite.eventMode = 'static';
        this.sprite.cursor = 'pointer';

        // Add blue tint
        this.sprite.tint = 0x4169E1;

        // Set initial scale
        this.sprite.scale.set(0.3);

        // Add to container
        this.container.addChild(this.sprite);

        // Listen for animation completion
        this.sprite.onComplete = () => {
            if (this.isClickAnimating) {
                this.returnToNormalAnimation();
            }
        };
    }

    playClickAnimation() {
        if (!this.isClickAnimating && this.clickFrame) {
            this.isClickAnimating = true;
            
            // Store current frame for smooth transition
            const currentFrame = this.sprite.currentFrame;
            
            // Set up click animation
            this.sprite.textures = [this.clickFrame];
            this.sprite.loop = false;
            this.sprite.gotoAndPlay(0);
            
            // Return to normal animation after a short delay
            setTimeout(() => {
                this.returnToNormalAnimation(currentFrame);
            }, 100);
        }
    }

    private returnToNormalAnimation(startFrame: number = 0) {
        this.isClickAnimating = false;
        this.sprite.textures = this.normalFrames;
        this.sprite.loop = true;
        this.sprite.gotoAndPlay(startFrame);
    }

    setPosition(x: number, y: number) {
        this.container.position.set(x, y);
    }

    setScale(scale: number) {
        this.sprite.scale.set(scale);
    }

    update() {
        // Reduced movement amplitude
        if (!this.isClickAnimating) {
            this.sprite.y += Math.sin(Date.now() / 1000) * 0.03;
        }
    }

    setHoverScale() {
        const currentScale = this.sprite.scale.x;
        this.sprite.scale.set(currentScale * 1.05);
    }

    setNormalScale() {
        const currentScale = this.sprite.scale.x;
        this.sprite.scale.set(currentScale / 1.05);
    }

    pulse() {
        const originalScale = this.sprite.scale.x;
        this.sprite.scale.set(originalScale * 1.2);
        
        setTimeout(() => {
            this.sprite.scale.set(originalScale);
        }, 100);
    }
    
}
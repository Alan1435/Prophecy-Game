// src/game/systems/PlayStyleSystem.ts
import { GameState } from '../interfaces/GameState';

interface PlayStyleMetrics {
    // Click patterns
    averageClickInterval: number;   // Average time between clicks
    clickBurstCount: number;        // Number of rapid click sequences
    longestIdleTime: number;        // Longest time without clicking
    
    // Session metrics
    activeSessions: {
        startTime: number;
        endTime: number;
        clickCount: number;
    }[];
    
    // Preferences
    preferredUpgradeTypes: Set<string>;
    
    // Timing patterns
    playTimes: {
        hour: number;
        count: number;
    }[];
}

export class PlayStyleSystem {
    private metrics: PlayStyleMetrics;
    private lastClickTime: number = 0;
    private clickTimes: number[] = [];
    private readonly BURST_THRESHOLD = 300; // ms between clicks to count as burst
    private readonly IDLE_THRESHOLD = 5000; // ms to consider as idle time
    private initialized: boolean = false;

    constructor() {
        this.metrics = {
            averageClickInterval: 0,
            clickBurstCount: 0,
            longestIdleTime: 0,
            activeSessions: [],
            preferredUpgradeTypes: new Set(),
            playTimes: Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }))
        };
    }

    onPlayerClick(timestamp: number) {
        if (!this.initialized) {
            this.initialized = true;
            this.lastClickTime = timestamp;
            return;
        }

        // Calculate interval
        const interval = timestamp - this.lastClickTime;
        this.clickTimes.push(interval);

        // Update metrics
        this.updateClickMetrics(interval, timestamp);
        this.lastClickTime = timestamp;

        // Keep only last 100 clicks for analysis
        if (this.clickTimes.length > 100) {
            this.clickTimes.shift();
        }

        // Update play time statistics
        const hour = new Date(timestamp).getHours();
        this.metrics.playTimes[hour].count++;
    }

    private updateClickMetrics(interval: number, timestamp: number) {
        // Update average click interval
        const totalIntervals = this.clickTimes.reduce((a, b) => a + b, 0);
        this.metrics.averageClickInterval = totalIntervals / this.clickTimes.length;

        // Check for burst clicking
        if (interval < this.BURST_THRESHOLD) {
            this.metrics.clickBurstCount++;
        }

        // Check for idle time
        if (interval > this.metrics.longestIdleTime && interval < 24 * 60 * 60 * 1000) { // Exclude breaks over 24h
            this.metrics.longestIdleTime = interval;
        }
    }

    onUpgradePurchase(upgradeType: string) {
        this.metrics.preferredUpgradeTypes.add(upgradeType);
    }

    getPlayStyle(): { style: string, multiplier: number } {
        const styles = this.calculateStyleWeights();
        const dominantStyle = Object.entries(styles)
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];
        
        // Calculate a bonus multiplier based on how well they match the style
        const styleStrength = styles[dominantStyle];
        const multiplier = 1 + (styleStrength * 0.5); // Up to 50% bonus

        return {
            style: dominantStyle,
            multiplier: multiplier
        };
    }

    private calculateStyleWeights(): { [key: string]: number } {
        const weights = {
            patient: 0,
            active: 0,
            strategic: 0
        };

        // Patient playstyle indicators
        if (this.metrics.averageClickInterval > 1000) {
            weights.patient += 0.3;
        }
        if (this.metrics.longestIdleTime > this.IDLE_THRESHOLD) {
            weights.patient += 0.2;
        }

        // Active playstyle indicators
        if (this.metrics.clickBurstCount > 50) {
            weights.active += 0.3;
        }
        if (this.metrics.averageClickInterval < 500) {
            weights.active += 0.2;
        }

        // Strategic playstyle indicators
        const hasUpgradeVariety = this.metrics.preferredUpgradeTypes.size > 2;
        if (hasUpgradeVariety) {
            weights.strategic += 0.3;
        }
        
        // Normalize weights
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        Object.keys(weights).forEach(key => {
            weights[key] = weights[key] / total;
        });

        return weights;
    }

    getPersonalizedBonuses(state: GameState): { [key: string]: number } {
        const { style, multiplier } = this.getPlayStyle();
        const bonuses = {
            clickPower: 1,
            passiveGain: 1,
            resourceEfficiency: 1
        };
    
        // Reduce bonus multipliers
        switch (style) {
            case 'patient':
                bonuses.passiveGain *= 1 + (multiplier - 1) * 0.01;
                break;
            case 'active':
                bonuses.clickPower *= 1 + (multiplier - 1) * 0.01;
                break;
            case 'strategic':
                bonuses.resourceEfficiency *= 1 + (multiplier - 1) * 0.2;
                break;
        }
    
        return bonuses;
    }

    // Call this periodically to check for and apply bonuses
    applyPlayStyleBonuses(state: GameState) {
        const bonuses = this.getPersonalizedBonuses(state);
        
        // Apply bonuses to state
        state.bonuses.clickPower *= bonuses.clickPower;
        state.bonuses.passiveGain *= bonuses.passiveGain;
        
        // Apply resource efficiency if it's a strategic player
        if (bonuses.resourceEfficiency > 1) {
            state.bonuses.upgradeCostReduction *= (2 - bonuses.resourceEfficiency);
        }
    }

    getStyleAdvice(): string {
        const { style, multiplier } = this.getPlayStyle();
        const strength = Math.floor((multiplier - 1) * 200); // Convert to percentage

        switch (style) {
            case 'patient':
                return `You show a patient playstyle (${strength}% affinity). Your passive gains are boosted!`;
            case 'active':
                return `You show an active playstyle (${strength}% affinity). Your clicks are more powerful!`;
            case 'strategic':
                return `You show a strategic playstyle (${strength}% affinity). Your resources are more efficient!`;
            default:
                return `Still analyzing your playstyle...`;
        }
    }
}
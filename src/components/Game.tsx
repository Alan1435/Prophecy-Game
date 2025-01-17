// src/components/Game.tsx
import { useEffect, useRef } from 'react';
import ProphecyGame from '../game/ProphecyGame';

const Game = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<ProphecyGame | null>(null);

// In Game.tsx's useEffect:
useEffect(() => {
    console.log("Game component mounted");
    if (!gameContainerRef.current) {
        console.log("No container ref");
        return;
    }
    
    try {
        // Get container dimensions
        const container = gameContainerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        console.log("Container dimensions:", width, height);

        // Create game instance
        const game = new ProphecyGame(width, height);
        console.log("Game instance created");
        gameInstanceRef.current = game;

        // Add the PIXI canvas to container
        container.appendChild(game.app.view as HTMLCanvasElement);
        console.log("Canvas added to container");

        // ... rest of the code
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}, []);

    return (
        <div 
            ref={gameContainerRef}
            className="w-full h-screen flex items-center justify-center bg-slate-900"
            style={{ overflow: 'hidden' }}
        />
    );
};

export default Game;
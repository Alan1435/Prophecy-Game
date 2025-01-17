// src/components/Game.tsx
import { useEffect, useRef } from 'react';
import ProphecyGame from '../game/ProphecyGame';

const Game = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<ProphecyGame | null>(null);

    useEffect(() => {
        if (!gameContainerRef.current) {
            console.error('No game container ref');
            return;
        }

        try {
            console.log('Starting game initialization...');
            // Get container dimensions
            const container = gameContainerRef.current;
            const width = container.clientWidth;
            const height = container.clientHeight;
            console.log('Container dimensions:', width, height);

            // Create game instance
            const game = new ProphecyGame(width, height);
            gameInstanceRef.current = game;
            console.log('Game instance created');

            // Add the PIXI canvas to container
            container.appendChild(game.app.view as HTMLCanvasElement);
            console.log('Canvas added to container');

            // Handle window resize
            const handleResize = () => {
                if (!container || !game) return;
                const newWidth = container.clientWidth;
                const newHeight = container.clientHeight;
                game.resize(newWidth, newHeight);
            };

            window.addEventListener('resize', handleResize);

            // Cleanup on unmount
            return () => {
                console.log('Cleaning up game');
                window.removeEventListener('resize', handleResize);
                if (game && game.app) {
                    game.app.destroy(true, { children: true, texture: true, baseTexture: true });
                }
                gameInstanceRef.current = null;
            };
        } catch (error) {
            console.error('Error initializing game:', error);
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
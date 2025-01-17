// src/pages/index.tsx
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';

// Dynamically import the Game component with SSR disabled
const Game = dynamic(() => import('../components/Game'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-screen flex items-center justify-center bg-slate-900">
            <div className="text-white text-2xl">Loading...</div>
        </div>
    )
});

const Home: NextPage = () => {
    return <Game />;
};

export default Home;
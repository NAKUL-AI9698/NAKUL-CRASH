import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Trophy, Zap } from 'lucide-react';

export default function App() {
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('nxt_nakul_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const handleGameOver = (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('nxt_nakul_highscore', finalScore.toString());
    }
  };

  return (
    <div className="min-h-screen bg-neon-dark flex flex-col items-center justify-center p-4 font-sans text-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#050510] to-black">
      
      {/* Header / HUD */}
      <div className="w-full max-w-lg flex justify-between items-end mb-4 px-2">
        <div>
          <h1 className="text-neon-blue font-black italic tracking-tighter text-2xl drop-shadow-[0_0_5px_cyan]">
            NXT NAKUL
          </h1>
          <div className="flex items-center gap-2 text-neon-pink text-sm font-mono font-bold">
            <Trophy size={14} />
            <span>BEST: {highScore}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-gray-500 font-mono tracking-widest mb-1">CURRENT SCORE</div>
          <div className="text-4xl font-mono font-bold text-white tabular-nums leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {currentScore.toString().padStart(6, '0')}
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="w-full max-w-lg aspect-[1/2] md:aspect-[3/4] max-h-[80vh] relative ring-4 ring-gray-800 rounded-xl shadow-[0_0_50px_rgba(0,243,255,0.1)]">
        <GameCanvas 
          onScoreUpdate={setCurrentScore} 
          onGameOver={handleGameOver}
        />
        
        {/* CRT Scanline Effect Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-30 bg-[length:100%_2px,3px_100%] rounded-xl opacity-20"></div>
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] rounded-xl z-30"></div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-gray-600 text-xs font-mono">
        <p className="flex items-center justify-center gap-2">
          <Zap size={12} className="text-neon-purple" /> 
          POWERED BY REACT & CANVAS
        </p>
      </div>
    </div>
  );
}
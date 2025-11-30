import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Entity, Particle } from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_WIDTH, 
  PLAYER_HEIGHT, 
  LANE_WIDTH,
  LANE_COUNT,
  COLORS, 
  INITIAL_SPEED, 
  MAX_SPEED, 
  ACCELERATION,
  BRAND_NAME
} from '../constants';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { NeonButton } from './NeonButton';

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onScoreUpdate, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Game State Refs (using refs for loop performance instead of state)
  const gameStateRef = useRef<GameState>(GameState.MENU);
  const scoreRef = useRef<number>(0);
  const speedRef = useRef<number>(INITIAL_SPEED);
  const playerRef = useRef<Entity>({
    x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: CANVAS_HEIGHT - PLAYER_HEIGHT - 50,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    color: COLORS.neonBlue,
    type: 'player'
  });
  const obstaclesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const roadOffsetRef = useRef<number>(0);
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const touchXRef = useRef<number | null>(null);

  // React State for UI overlays
  const [uiState, setUiState] = useState<GameState>(GameState.MENU);
  const [finalScore, setFinalScore] = useState(0);

  // --- Input Handling ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysPressed.current.add(e.key);
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysPressed.current.delete(e.key);
    if (e.key === 'Escape' && gameStateRef.current === GameState.PLAYING) {
      pauseGame();
    } else if (e.key === 'Escape' && gameStateRef.current === GameState.PAUSED) {
      resumeGame();
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameStateRef.current !== GameState.PLAYING) return;
    const touch = e.touches[0];
    touchXRef.current = touch.clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameStateRef.current !== GameState.PLAYING || !canvasRef.current) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    
    // Calculate relative X in canvas coords
    const canvasX = (touch.clientX - rect.left) * scaleX;
    
    // Smoothly move player towards touch
    playerRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, canvasX - PLAYER_WIDTH / 2));
    
    touchXRef.current = touch.clientX;
  };

  // --- Game Loop Logic ---

  const spawnObstacle = () => {
    const lanes = [0, 1, 2, 3];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const x = lane * LANE_WIDTH + (LANE_WIDTH - PLAYER_WIDTH) / 2;
    
    // Avoid overlap with existing top obstacles
    const tooClose = obstaclesRef.current.some(o => o.y < 200);
    if (!tooClose) {
      const type = Math.random() > 0.9 ? 'pickup' : 'enemy'; // 10% chance for "pickup" (points)
      
      obstaclesRef.current.push({
        x,
        y: -100,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        color: type === 'enemy' ? COLORS.neonPink : COLORS.neonGreen,
        type: type
      });
    }
  };

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: Math.random() * 5 + 2
      });
    }
  };

  const checkCollision = (rect1: Entity, rect2: Entity) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  const resetGame = () => {
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    obstaclesRef.current = [];
    particlesRef.current = [];
    playerRef.current.x = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
    gameStateRef.current = GameState.PLAYING;
    setUiState(GameState.PLAYING);
    onScoreUpdate(0);
    lastTimeRef.current = performance.now();
  };

  const gameOver = () => {
    gameStateRef.current = GameState.GAME_OVER;
    setUiState(GameState.GAME_OVER);
    setFinalScore(Math.floor(scoreRef.current));
    onGameOver(Math.floor(scoreRef.current));
    createExplosion(playerRef.current.x + PLAYER_WIDTH/2, playerRef.current.y + PLAYER_HEIGHT/2, COLORS.neonBlue);
  };

  const pauseGame = () => {
    gameStateRef.current = GameState.PAUSED;
    setUiState(GameState.PAUSED);
  };

  const resumeGame = () => {
    gameStateRef.current = GameState.PLAYING;
    setUiState(GameState.PLAYING);
    lastTimeRef.current = performance.now();
  };

  const update = (dt: number) => {
    if (gameStateRef.current !== GameState.PLAYING) return;

    // Update Difficulty
    speedRef.current = Math.min(MAX_SPEED, speedRef.current + ACCELERATION);
    
    // Update Score
    scoreRef.current += (speedRef.current * dt) / 100;
    onScoreUpdate(Math.floor(scoreRef.current));

    // Player Movement (Keyboard)
    const moveSpeed = 8 * (dt / 16); // normalize to ~60fps
    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
      playerRef.current.x = Math.max(0, playerRef.current.x - moveSpeed);
    }
    if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
      playerRef.current.x = Math.min(CANVAS_WIDTH - PLAYER_WIDTH, playerRef.current.x + moveSpeed);
    }

    // Road Loop
    roadOffsetRef.current = (roadOffsetRef.current + speedRef.current) % 800; // Loop every 800px

    // Obstacle Spawning
    if (Math.random() < 0.02) {
      spawnObstacle();
    }

    // Update Obstacles
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      let obs = obstaclesRef.current[i];
      obs.y += speedRef.current;

      // Collision
      if (checkCollision(playerRef.current, obs)) {
        if (obs.type === 'enemy') {
          gameOver();
        } else {
          // It's a pickup/coin
          scoreRef.current += 500; // Bonus points
          createExplosion(obs.x + obs.width/2, obs.y + obs.height/2, COLORS.neonGreen);
          obstaclesRef.current.splice(i, 1);
          continue;
        }
      }

      // Cleanup off-screen
      if (obs.y > CANVAS_HEIGHT) {
        obstaclesRef.current.splice(i, 1);
      }
    }

    // Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      let p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Road Grid/Lines
    ctx.save();
    ctx.strokeStyle = COLORS.roadLine;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    
    // Vertical Lanes
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Moving Horizontal Lines (Perspective illusion)
    const gridGap = 100;
    for (let y = roadOffsetRef.current - gridGap; y < CANVAS_HEIGHT; y += gridGap) {
      if (y < -gridGap) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.strokeStyle = `rgba(26, 26, 58, ${1 - y/CANVAS_HEIGHT})`; // Fade out at bottom
      ctx.stroke();
    }
    
    // "NXT NAKUL" on the road
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, (roadOffsetRef.current + 400) % 800 - 400); // Scroll text
    // Only draw if visible
    ctx.fillText(BRAND_NAME, 0, 0);
    ctx.translate(0, 400); // Second copy for smooth loop
    ctx.fillText(BRAND_NAME, 0, 0);
    ctx.translate(0, 400); // Third copy
    ctx.fillText(BRAND_NAME, 0, 0);
    ctx.restore();

    ctx.restore();

    // Helper to draw Neon Rect
    const drawNeonRect = (entity: Entity) => {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = entity.color;
      ctx.fillStyle = entity.color;
      
      // Car Body
      ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
      
      // Car Detail (Windshield)
      ctx.fillStyle = '#000';
      ctx.fillRect(entity.x + 5, entity.y + 20, entity.width - 10, 20); // Front glass
      ctx.fillRect(entity.x + 5, entity.y + 60, entity.width - 10, 15); // Rear glass
      
      // Car Lights
      ctx.fillStyle = '#fff';
      if (entity.type === 'enemy') {
        // Red Tail lights only (if they are facing away, assuming traffic moves same way or static)
        // Let's assume oncoming traffic for difficulty = headlights
        ctx.shadowColor = '#fff';
        ctx.fillRect(entity.x + 5, entity.y + 80, 10, 5);
        ctx.fillRect(entity.x + entity.width - 15, entity.y + 80, 10, 5);
      } else {
        // Player headlights
        ctx.shadowColor = '#fff';
        ctx.fillRect(entity.x + 5, entity.y, 10, 5);
        ctx.fillRect(entity.x + entity.width - 15, entity.y, 10, 5);
        
        // Brand on Car
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("NXT", entity.x + entity.width/2, entity.y + 55);
      }

      ctx.restore();
    };

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
      if (obs.type === 'pickup') {
         // Draw Coin/Pickup
         ctx.save();
         ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
         // Rotate animation based on time could go here
         ctx.shadowBlur = 15;
         ctx.shadowColor = obs.color;
         ctx.fillStyle = obs.color;
         ctx.beginPath();
         ctx.arc(0, 0, 15, 0, Math.PI * 2);
         ctx.fill();
         ctx.fillStyle = '#000';
         ctx.font = 'bold 20px monospace';
         ctx.fillText('$', -6, 6);
         ctx.restore();
      } else {
         drawNeonRect(obs);
      }
    });

    // Draw Player
    if (gameStateRef.current !== GameState.GAME_OVER) {
      drawNeonRect(playerRef.current);
    }

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.restore();
    });
  };

  // --- Main Loop ---
  const loop = (timestamp: number) => {
    const dt = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) {
       // Only clear/redraw if necessary, but for games we usually redraw all
       if (gameStateRef.current === GameState.PLAYING || gameStateRef.current === GameState.GAME_OVER) {
         update(dt);
       }
       draw(ctx);
    }

    frameIdRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start loop
    lastTimeRef.current = performance.now();
    frameIdRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [handleKeyDown, handleKeyUp]);

  // --- Rendering UI on top of canvas ---

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full max-w-lg mx-auto bg-gray-900 shadow-2xl overflow-hidden rounded-xl border-4 border-gray-800"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      <canvas 
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-full block object-cover"
      />
      
      {/* UI OVERLAYS */}
      
      {/* MENU */}
      {uiState === GameState.MENU && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-10 animate-in fade-in duration-300">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-neon-blue to-neon-purple drop-shadow-[0_0_15px_rgba(0,243,255,0.8)] mb-2 text-center tracking-tighter">
            NXT NAKUL
          </h1>
          <h2 className="text-2xl text-neon-pink font-mono mb-12 tracking-[0.5em] animate-pulse">NEON DRIFT</h2>
          
          <div className="space-y-4 w-full max-w-xs">
            <NeonButton fullWidth variant="blue" onClick={resetGame}>
              <div className="flex items-center justify-center gap-2">
                <Play size={20} /> START ENGINE
              </div>
            </NeonButton>
            
            <div className="text-gray-400 text-xs text-center mt-8 font-mono">
              <p>USE ARROW KEYS OR TOUCH TO STEER</p>
              <p>AVOID RED CARS. COLLECT GREEN ORBS.</p>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {uiState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-900/40 backdrop-blur-sm flex flex-col items-center justify-center p-8 z-20">
          <h2 className="text-6xl font-black text-neon-pink drop-shadow-[0_0_20px_rgba(255,0,255,0.8)] mb-4 -rotate-6">
            CRASHED!
          </h2>
          
          <div className="bg-black/50 p-6 rounded-lg border border-neon-purple mb-8 text-center w-full max-w-xs backdrop-blur-md">
            <p className="text-gray-400 font-mono text-sm mb-2">FINAL SCORE</p>
            <p className="text-5xl font-mono text-white font-bold">{finalScore}</p>
          </div>

          <NeonButton fullWidth variant="green" onClick={resetGame} className="max-w-xs mb-4">
             <div className="flex items-center justify-center gap-2">
                <RotateCcw size={20} /> TRY AGAIN
              </div>
          </NeonButton>
          
          <NeonButton fullWidth variant="pink" onClick={() => setUiState(GameState.MENU)} className="max-w-xs">
             MAIN MENU
          </NeonButton>
        </div>
      )}

      {/* PAUSE */}
      {uiState === GameState.PAUSED && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
          <h2 className="text-4xl font-bold text-white mb-8 tracking-widest">PAUSED</h2>
          <NeonButton variant="blue" onClick={resumeGame} className="w-48">
            RESUME
          </NeonButton>
        </div>
      )}

      {/* PAUSE BUTTON (In-game) */}
      {uiState === GameState.PLAYING && (
        <button 
          onClick={pauseGame}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <Pause size={24} />
        </button>
      )}

       {/* MOBILE CONTROLS HINT */}
       {uiState === GameState.PLAYING && (
        <div className="absolute bottom-4 w-full text-center text-white/20 text-sm font-mono pointer-events-none animate-pulse">
          TOUCH & DRAG TO STEER
        </div>
      )}
    </div>
  );
};
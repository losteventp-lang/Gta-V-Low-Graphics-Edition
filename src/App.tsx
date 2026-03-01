import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, MapPin, Shield, Trophy, Zap } from 'lucide-react';
import { GameState } from './game/types';
import { createInitialState, updateGame } from './game/logic';
import { COLORS, CITY_SIZE } from './game/constants';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const [hudState, setHudState] = useState<GameState>(stateRef.current);
  const [keys] = useState<Set<string>>(new Set());
  const [isGameOver, setIsGameOver] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      setGameStarted(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Update canvas internal dimensions to match display size
      if (canvas.width !== canvasSize.width || canvas.height !== canvasSize.height) {
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
      }

      // Update logic at 60fps
      const dt = time - lastTime;
      if (dt > 16) {
        stateRef.current = updateGame(stateRef.current, keys);
        setHudState(stateRef.current);
        lastTime = time;
      }
        
      const next = stateRef.current;
      // Drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const camX = next.camera.x - canvas.width / 2;
      const camY = next.camera.y - canvas.height / 2;

      // Draw Background (Grass)
      ctx.fillStyle = COLORS.GRASS;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-camX, -camY);

      // Draw City Boundary
      ctx.strokeStyle = '#27ae60';
      ctx.lineWidth = 10;
      ctx.strokeRect(-CITY_SIZE/2, -CITY_SIZE/2, CITY_SIZE, CITY_SIZE);

      // Draw Roads (Simple grid)
      ctx.fillStyle = COLORS.ROAD;
      for (let x = -CITY_SIZE/2; x < CITY_SIZE/2; x += 400) {
        ctx.fillRect(x, -CITY_SIZE/2, 60, CITY_SIZE);
      }
      for (let y = -CITY_SIZE/2; y < CITY_SIZE/2; y += 400) {
        ctx.fillRect(-CITY_SIZE/2, y, CITY_SIZE, 60);
      }

      // Draw Buildings
      ctx.fillStyle = COLORS.BUILDING;
      next.buildings.forEach(b => {
        ctx.fillRect(b.pos.x - b.width/2, b.pos.y - b.height/2, b.width, b.height);
        // Add some "low poly" detail
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.strokeRect(b.pos.x - b.width/2, b.pos.y - b.height/2, b.width, b.height);
      });

      // Draw Player
      ctx.save();
      ctx.translate(next.player.pos.x, next.player.pos.y);
      ctx.rotate(next.player.angle);
      
      // Car Body
      ctx.fillStyle = next.player.color;
      ctx.fillRect(-next.player.width/2, -next.player.height/2, next.player.width, next.player.height);
      
      // Windshield
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-next.player.width/2 + 2, -next.player.height/2 + 5, next.player.width - 4, 10);
      
      // Headlights
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(-next.player.width/2 + 2, -next.player.height/2, 4, 2);
      ctx.fillRect(next.player.width/2 - 6, -next.player.height/2, 4, 2);

      ctx.restore();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render(performance.now());

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [keys]);

  const speedKph = Math.round(Math.abs(hudState.player.velocity) * 20);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-neutral-900 flex items-center justify-center overflow-hidden font-sans touch-none">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-black"
        id="game-canvas"
      />

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none p-4 md:p-8 flex flex-col justify-between w-full h-full">
        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-md p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/10 flex items-center gap-2 md:gap-4"
          >
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/50 font-bold">Wanted Level</span>
              <div className="flex gap-0.5 md:gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Shield 
                    key={star} 
                    size={12} 
                    className={star <= hudState.wantedLevel ? "text-yellow-400 fill-yellow-400" : "text-white/20"} 
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/60 backdrop-blur-md p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/10 flex items-center gap-3 md:gap-6"
          >
            <div className="text-right">
              <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/50 font-bold">Balance</span>
              <div className="text-sm md:text-2xl font-mono text-emerald-400 font-bold">${hudState.score.toLocaleString()}</div>
            </div>
            <div className="w-px h-6 md:h-8 bg-white/10" />
            <div className="text-right hidden sm:block">
              <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/50 font-bold">Location</span>
              <div className="text-[10px] md:text-sm text-white font-medium flex items-center gap-1">
                <MapPin size={10} className="text-red-500" />
                Los Santos
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Controls */}
        <div className="flex justify-between items-end pointer-events-auto sm:hidden mb-8 px-2">
          <div className="grid grid-cols-3 gap-4">
            <div />
            <button 
              onPointerDown={(e) => { e.preventDefault(); keys.add('w'); }} 
              onPointerUp={(e) => { e.preventDefault(); keys.delete('w'); }}
              onPointerLeave={(e) => { e.preventDefault(); keys.delete('w'); }}
              className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full border-2 border-white/30 flex items-center justify-center active:scale-95 active:bg-white/40 transition-transform"
            >
              <Zap size={24} className="text-white" />
            </button>
            <div />
            <button 
              onPointerDown={(e) => { e.preventDefault(); keys.add('a'); }} 
              onPointerUp={(e) => { e.preventDefault(); keys.delete('a'); }}
              onPointerLeave={(e) => { e.preventDefault(); keys.delete('a'); }}
              className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full border-2 border-white/30 flex items-center justify-center active:scale-95 active:bg-white/40 transition-transform"
            >
              <div className="rotate-180 text-white text-xl">▶</div>
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); keys.add('s'); }} 
              onPointerUp={(e) => { e.preventDefault(); keys.delete('s'); }}
              onPointerLeave={(e) => { e.preventDefault(); keys.delete('s'); }}
              className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full border-2 border-white/30 flex items-center justify-center active:scale-95 active:bg-white/40 transition-transform"
            >
              <div className="rotate-90 text-white text-xl">▶</div>
            </button>
            <button 
              onPointerDown={(e) => { e.preventDefault(); keys.add('d'); }} 
              onPointerUp={(e) => { e.preventDefault(); keys.delete('d'); }}
              onPointerLeave={(e) => { e.preventDefault(); keys.delete('d'); }}
              className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full border-2 border-white/30 flex items-center justify-center active:scale-95 active:bg-white/40 transition-transform"
            >
              <div className="text-white text-xl">▶</div>
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/60 backdrop-blur-md p-2 md:p-4 rounded-xl md:rounded-2xl border border-white/10 w-32 md:w-48"
            >
              <div className="flex justify-between items-center mb-1 md:mb-2">
                <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/50 font-bold">Health</span>
                <span className="text-[10px] md:text-xs font-mono text-white">{hudState.player.health}%</span>
              </div>
              <div className="h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-emerald-500"
                  initial={{ width: "100%" }}
                  animate={{ width: `${hudState.player.health}%` }}
                />
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black/60 backdrop-blur-md p-3 md:p-6 rounded-full border border-white/10 flex flex-col items-center justify-center w-20 h-20 md:w-32 md:h-32"
          >
            <div className="text-xl md:text-3xl font-mono font-bold text-white leading-none">{speedKph}</div>
            <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/50 font-bold mt-1 text-center">KM/H</div>
          </motion.div>
        </div>
      </div>

      {/* Instructions Overlay */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/30 text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-medium hidden sm:block">
        WASD or Arrows to Drive • Space to Drift
      </div>

      {/* Intro Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center pointer-events-auto"
          >
            <motion.h1 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-8xl font-black text-white italic tracking-tighter uppercase"
            >
              GTA <span className="text-emerald-500">V</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/40 uppercase tracking-[0.5em] text-[8px] md:text-xs mt-4"
            >
              Low Graphics Edition
            </motion.p>
            
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              onClick={() => { setShowIntro(false); setGameStarted(true); }}
              className="mt-12 px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-emerald-500 hover:text-white transition-colors pointer-events-auto"
            >
              Start Game
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

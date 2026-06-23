import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { X, Play, ShieldAlert, Award, TrendingUp } from 'lucide-react';
import { Profile } from '../types';

interface AviatorGameProps {
  userProfile: Profile;
  onClose: () => void;
  onRefreshBalance: () => void;
}

export const AviatorGame: React.FC<AviatorGameProps> = ({ userProfile, onClose, onRefreshBalance }) => {
  const [gameState, setGameState] = useState<'idle' | 'climbing' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState(1.00);
  const [countdown, setCountdown] = useState(6);
  const [betAmount, setBetAmount] = useState(100);
  const [activeBet, setActiveBet] = useState<number | null>(null);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashoutWin, setCashoutWin] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([1.23, 2.50, 1.08, 15.42, 1.95, 3.10]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Refs for Canvas rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const targetMultiplierRef = useRef<number>(1.00);
  const crashPointRef = useRef<number>(1.00);

  // Sound effects fallback using Web Audio API
  const playSound = (type: 'tick' | 'win' | 'crash' | 'start') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'tick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'crash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Web Audio failed to play sound:', e);
    }
  };

  // Game Loop Logic
  useEffect(() => {
    let interval: any;
    if (gameState === 'idle') {
      setHasCashedOut(false);
      setCashoutWin(null);
      setMultiplier(1.00);
      
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            startRound();
            return 6;
          }
          playSound('tick');
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState]);

  const startRound = () => {
    // Generate crash point (90% chance it is over 1.01x, 10% chance it insta-crashes)
    const isInstaCrash = Math.random() < 0.10;
    if (isInstaCrash) {
      crashPointRef.current = 1.00;
    } else {
      // Exponential curve for multiplier crash points
      const randVal = Math.random();
      crashPointRef.current = parseFloat((1.01 + Math.pow(Math.E, randVal * 3) - 1).toFixed(2));
    }

    playSound('start');
    setGameState('climbing');
    setMultiplier(1.00);
    targetMultiplierRef.current = 1.00;
    timeRef.current = Date.now();
    runClimbLoop();
  };

  const runClimbLoop = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const update = () => {
      const elapsed = (Date.now() - timeRef.current) / 1000; // seconds
      
      // Speed coefficient: plane accelerates slightly as it climbs
      const currentMult = 1.00 + Math.pow(elapsed * 0.18, 1.8);
      setMultiplier(parseFloat(currentMult.toFixed(2)));

      if (currentMult >= crashPointRef.current) {
        // CRASHED!
        playSound('crash');
        setGameState('crashed');
        setMultiplier(crashPointRef.current);
        setHistory((prev) => [crashPointRef.current, ...prev.slice(0, 5)]);
        setActiveBet(null);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        
        // Return to lobby/idle after 3 seconds
        setTimeout(() => {
          setGameState('idle');
        }, 3000);
      } else {
        animationRef.current = requestAnimationFrame(update);
      }
    };

    animationRef.current = requestAnimationFrame(update);
  };

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localAnimId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // Draw Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < w; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, h);
        ctx.stroke();
      }
      for (let i = 0; i < h; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(w, i);
        ctx.stroke();
      }

      if (gameState === 'climbing' || gameState === 'crashed') {
        // Draw Curve
        ctx.strokeStyle = '#E53935';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(30, h - 30);

        const currentPct = Math.min((multiplier - 1) / (crashPointRef.current === 1 ? 1.01 : crashPointRef.current), 1);
        const curveEndX = 30 + currentPct * (w - 100);
        const curveEndY = (h - 30) - currentPct * (h - 120);

        ctx.quadraticCurveTo(
          w * 0.4,
          h - 30,
          curveEndX,
          curveEndY
        );
        ctx.stroke();

        // Draw Plane
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.arc(curveEndX, curveEndY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw Flame/Thrust trail
        if (gameState === 'climbing') {
          ctx.fillStyle = '#FED36A';
          ctx.beginPath();
          ctx.arc(curveEndX - 12, curveEndY + 4, 4 + Math.random() * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Crashed text on canvas
        if (gameState === 'crashed') {
          ctx.fillStyle = 'rgba(229, 57, 53, 0.2)';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#E53935';
          ctx.font = 'bold 24px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('FLEW AWAY!', w / 2, h / 2 - 10);
        }
      } else {
        // Idle Screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#E3E3E3';
        ctx.font = '500 13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('WAITING FOR NEXT ROUND...', w / 2, h / 2 - 20);

        ctx.fillStyle = '#FED36A';
        ctx.font = 'bold 36px Outfit, sans-serif';
        ctx.fillText(`${countdown}s`, w / 2, h / 2 + 20);
      }

      localAnimId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(localAnimId);
    };
  }, [gameState, multiplier, countdown]);

  const handlePlaceBet = async () => {
    setErrorMsg('');
    
    if (betAmount < 10) {
      setErrorMsg('Minimum bet is Rs 10.');
      return;
    }

    if (betAmount > userProfile.balance) {
      setErrorMsg('Insufficient balance to place this bet.');
      return;
    }

    setLoading(true);

    try {
      // Deduct balance directly
      const newBalance = userProfile.balance - betAmount;
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userProfile.id);

      if (error) {
        setErrorMsg(error.message);
      } else {
        setActiveBet(betAmount);
        onRefreshBalance();
      }
    } catch (err) {
      setErrorMsg('Bet placement failed.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCashOut = async () => {
    if (!activeBet || hasCashedOut || gameState !== 'climbing') return;

    setLoading(true);
    const winAmount = parseFloat((activeBet * multiplier).toFixed(2));

    try {
      // Credit balance
      const newBalance = userProfile.balance + winAmount;
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userProfile.id);

      if (error) {
        setErrorMsg(error.message);
      } else {
        playSound('win');
        setHasCashedOut(true);
        setCashoutWin(winAmount);
        setActiveBet(null);
        onRefreshBalance();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-[200] flex flex-col justify-center items-center p-3">
      <div className="w-full max-w-[480px] bg-[#0A0A0A] rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        {/* Game Header */}
        <div className="bg-[#02332C] px-4 py-3 flex items-center justify-between border-b border-white/5 select-none">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#E53935]" />
            <h2 className="text-[15px] font-black text-white italic tracking-wider">
              AVIATOR LOBBY
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History Bar */}
        <div className="bg-[#03443C] px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/5 select-none shrink-0">
          <span className="text-[9px] text-[#B8CEC9] font-bold uppercase shrink-0">History:</span>
          {history.map((h, idx) => (
            <span 
              key={idx} 
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                h >= 2 ? 'bg-purple-900/50 text-purple-300 border border-purple-500/20' : 'bg-blue-900/50 text-blue-300 border border-blue-500/20'
              }`}
            >
              {h.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Screen/Canvas Wrapper */}
        <div className="relative w-full aspect-[16/10] bg-[#141414] border-b border-white/5 flex flex-col">
          <canvas 
            ref={canvasRef} 
            width={460} 
            height={288} 
            className="w-full h-full"
          />

          {/* Live multiplier display overlay */}
          {gameState === 'climbing' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none">
              <span className="text-[50px] xs:text-[60px] font-mono font-black text-white leading-none tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                {multiplier.toFixed(2)}x
              </span>
            </div>
          )}
        </div>

        {/* User Balance Bar */}
        <div className="bg-[#02332C] px-4 py-2 flex items-center justify-between border-b border-white/5 select-none text-[11px]">
          <span className="text-[#B8CEC9]">Your Balance:</span>
          <span className="text-[#FED36A] font-black">
            Rs {userProfile.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Bet controls */}
        <div className="p-4 bg-[#03443C] flex flex-col gap-3">
          {errorMsg && (
            <div className="bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeBet ? (
            /* Cash Out State */
            <div className="bg-[#02332C] p-3 rounded-xl border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/80 font-bold">Placed Bet: Rs {activeBet}</span>
                <span className="text-[#FED36A] font-bold">Multiplier: {multiplier.toFixed(2)}x</span>
              </div>
              
              <button
                onClick={handleCashOut}
                disabled={gameState !== 'climbing' || loading}
                className="w-full bg-[#00C853] hover:brightness-110 active:scale-95 text-white font-black py-4 rounded-xl shadow-lg flex flex-col items-center justify-center cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="text-[14px] leading-tight">CASH OUT</span>
                <span className="text-[12px] leading-tight text-white/95 mt-0.5">
                  Rs {(activeBet * multiplier).toFixed(2)}
                </span>
              </button>
            </div>
          ) : hasCashedOut ? (
            /* Cashed Out Success */
            <div className="bg-[#00C853]/15 border border-[#00C853]/30 p-4 rounded-xl text-center flex flex-col items-center gap-1">
              <Award className="w-8 h-8 text-[#00C853] mb-1 animate-bounce" />
              <p className="text-[14px] font-black text-[#00C853] uppercase">Cashed Out Successfully!</p>
              <p className="text-[11px] text-white">
                You won <strong className="text-[#FED36A]">Rs {cashoutWin?.toFixed(2)}</strong> at {multiplier.toFixed(2)}x
              </p>
            </div>
          ) : (
            /* Place Bet Input */
            <div className="grid grid-cols-2 gap-3">
              {/* Amount controls */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#B8CEC9] uppercase font-bold tracking-wider select-none">
                  Bet Amount (Rs)
                </label>
                <div className="flex items-center bg-[#02332C] border border-white/5 rounded-lg overflow-hidden h-[42px] px-2 gap-1.5">
                  <button 
                    onClick={() => setBetAmount(prev => Math.max(10, prev - 50))}
                    className="w-8 text-[16px] text-white font-bold h-full hover:bg-white/5 active:scale-90 cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full text-center bg-transparent border-none text-white font-black text-[13px] focus:outline-none"
                  />
                  <button 
                    onClick={() => setBetAmount(prev => prev + 50)}
                    className="w-8 text-[16px] text-white font-bold h-full hover:bg-white/5 active:scale-90 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Submit Bet button */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={handlePlaceBet}
                  disabled={gameState !== 'idle' || loading}
                  className="h-[42px] bg-gradient-to-r from-[#E53935] to-[#D32F2F] hover:brightness-110 active:scale-95 text-white font-black rounded-lg shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed text-[12px] uppercase select-none"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Place Bet</span>
                </button>
              </div>
            </div>
          )}

          {gameState !== 'idle' && !activeBet && !hasCashedOut && (
            <p className="text-center text-[10px] text-gray-400 italic mt-1 select-none">
              * Waiting for next round to place bets.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

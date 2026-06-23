import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Award, Compass, Gift, Clock, AlertCircle } from 'lucide-react';
import { Profile } from '../types';

interface OffersProps {
  userProfile: Profile | null;
  onNavigate: (page: string) => void;
  onRefreshBalance: () => void;
}

interface SpinSegment {
  label: string;
  value: number;
  color: string;
}

export const Offers: React.FC<OffersProps> = ({ userProfile, onNavigate: _onNavigate, onRefreshBalance }) => {
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [hasFreeSpins, setHasFreeSpins] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Daily check-in state
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInReward, setCheckInReward] = useState<number | null>(null);

  const segments: SpinSegment[] = [
    { label: 'Rs 10', value: 10, color: '#023E37' },
    { label: 'Rs 50', value: 50, color: '#04534A' },
    { label: 'Rs 100', value: 100, color: '#023E37' },
    { label: 'Rs 500', value: 500, color: '#04534A' },
    { label: 'Rs 735', value: 735, color: '#FED36A' }, // Golden mega prize!
    { label: 'Try Again', value: 0, color: '#023E37' },
    { label: 'Rs 20', value: 20, color: '#04534A' },
    { label: 'Rs 200', value: 200, color: '#023E37' }
  ];

  const handleSpin = async () => {
    if (spinning || loading) return;
    if (!userProfile) {
      setErrorMsg('Please log in to spin the wheel.');
      return;
    }
    if (hasFreeSpins <= 0) {
      setErrorMsg('You have 0 spins. Deposit Rs 300 or more to get a lucky spin entry.');
      return;
    }

    setSpinning(true);
    setErrorMsg('');
    setSpinResult(null);
    setLoading(true);

    // Generate random winning segment
    // Let's make it fairer: e.g. segment 0-7
    const segmentCount = segments.length;
    const segmentAngle = 360 / segmentCount;
    
    // Weighted probabilities (Rs 10, 20, 50, 100 are common; Rs 735 is rare)
    const weights = [0.25, 0.20, 0.15, 0.08, 0.02, 0.15, 0.10, 0.05];
    let r = Math.random();
    let winningIndex = 5; // Default to 'Try Again'
    let cumulativeWeight = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (r <= cumulativeWeight) {
        winningIndex = i;
        break;
      }
    }

    // Target rotation: multiple full spins + stop on segment center
    const extraSpins = 5; // 5 full rotations
    // The pointer is at the top (90 deg offset, or we can just spin it relative to segment)
    // To align properly: rotation = (extraSpins * 360) + (360 - (winningIndex * segmentAngle)) - (segmentAngle / 2)
    const targetAngle = (extraSpins * 360) + (360 - (winningIndex * segmentAngle)) - (segmentAngle / 2);
    
    setRotation(targetAngle);

    // Wait for the transition animation to finish (4s)
    setTimeout(async () => {
      const prize = segments[winningIndex];
      setSpinning(false);
      setHasFreeSpins((prev) => Math.max(0, prev - 1));
      setLoading(false);

      if (prize.value > 0) {
        try {
          // Credit balance directly in Supabase
          const newBalance = userProfile.balance + prize.value;
          const { error } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userProfile.id);

          if (error) {
            setErrorMsg('Failed to credit prize: ' + error.message);
          } else {
            setSpinResult(`Congratulations! You won ${prize.label}!`);
            onRefreshBalance();
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setSpinResult('Try again next time! Good luck.');
      }
    }, 4100);
  };

  const handleDailyCheckIn = async () => {
    if (checkedIn || loading || !userProfile) return;

    setLoading(true);
    setErrorMsg('');
    
    // Reward Rs 10-50 randomly
    const reward = Math.floor(Math.random() * 41) + 10;

    try {
      const newBalance = userProfile.balance + reward;
      const { error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userProfile.id);

      if (error) {
        setErrorMsg(error.message);
      } else {
        setCheckedIn(true);
        setCheckInReward(reward);
        onRefreshBalance();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#04534A] pb-[80px] pt-[100px] flex flex-col px-4 overflow-y-auto">
      <div className="flex flex-col gap-4">
        {/* 1. Lucky Spin Segment */}
        <div className="bg-[#03443C] p-5 rounded-2xl border border-[#023E37] flex flex-col items-center shadow-xl">
          <div className="flex items-center gap-1.5 self-start mb-3 select-none">
            <Compass className="w-5 h-5 text-[#FED36A]" />
            <h2 className="text-white text-sm font-bold uppercase tracking-wider">Lucky Spin Wheel</h2>
          </div>

          <p className="text-[11px] text-[#B8CEC9] text-center mb-4 select-none">
            Spin the wheel to win instant cash rewards up to <strong className="text-[#FED36A]">Rs 735</strong>!
          </p>

          {/* Wheel Graphic Container */}
          <div className="relative w-56 h-56 flex items-center justify-center my-2">
            {/* Spinning Wheel */}
            <div
              className="absolute w-full h-full rounded-full border-4 border-[#FED36A] overflow-hidden shadow-2xl transition-transform duration-[4000ms] ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                background: '#02332C',
              }}
            >
              {segments.map((seg, idx) => {
                const angle = 360 / segments.length;
                const rot = idx * angle;
                return (
                  <div
                    key={idx}
                    className="absolute top-0 left-0 w-full h-full flex items-center justify-center origin-center"
                    style={{
                      transform: `rotate(${rot}deg)`,
                    }}
                  >
                    {/* Segment divider line */}
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1/2 bg-[#FED36A]/30 origin-bottom" 
                      style={{ transform: `rotate(${angle / 2}deg)` }}
                    />
                    {/* Segment text */}
                    <span 
                      className={`absolute top-6 text-[10px] font-black tracking-wide ${
                        seg.value === 735 ? 'text-[#FFE600]' : 'text-white'
                      }`}
                      style={{ transform: `rotate(90deg)` }}
                    >
                      {seg.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Spinner Center Pin / Hub */}
            <div className="absolute z-20 w-12 h-12 rounded-full bg-[#FED36A] shadow-lg flex items-center justify-center border-4 border-[#023E37]">
              <span className="text-[#5C4020] font-black text-[9px] uppercase tracking-tighter">WIN</span>
            </div>

            {/* Indicator Arrow at Top */}
            <div className="absolute top-[-10px] z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-[#FFE600] filter drop-shadow" />
          </div>

          {/* Spin Results & errors */}
          {spinResult && (
            <div className="mt-4 bg-[#00C853]/10 border border-[#00C853]/25 px-4 py-2 rounded-xl text-center flex flex-col items-center gap-1 select-none">
              <Award className="w-5 h-5 text-[#00C853] animate-pulse" />
              <p className="text-[12px] font-bold text-white">{spinResult}</p>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] text-[10px] px-3 py-2 rounded-lg flex items-center gap-2 select-none">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mt-4 flex flex-col items-center w-full gap-2">
            <span className="text-[11px] text-[#B8CEC9] font-bold">
              Available Spins: <span className="text-[#FED36A] font-black">{hasFreeSpins}</span>
            </span>
            <button
              onClick={handleSpin}
              disabled={spinning || hasFreeSpins <= 0}
              className="w-full max-w-[200px] bg-gradient-to-r from-[#FED36A] to-[#F5B041] hover:brightness-110 active:scale-95 text-[#5C4020] font-black py-2.5 rounded-full shadow-md text-[13px] uppercase cursor-pointer select-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {spinning ? 'Spinning...' : 'SPIN WHEEL'}
            </button>
          </div>
        </div>

        {/* 2. Daily check-in and bonuses */}
        <div className="bg-[#03443C] p-5 rounded-2xl border border-[#023E37] flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-1.5 select-none">
            <Gift className="w-5 h-5 text-[#FED36A]" />
            <h2 className="text-white text-sm font-bold uppercase tracking-wider">Daily Bonus Reward</h2>
          </div>

          <p className="text-[11px] text-[#B8CEC9] select-none leading-normal">
            Claim your daily login attendance reward. Claim up to <strong className="text-white">Rs 50</strong> free cash daily!
          </p>

          {checkedIn ? (
            <div className="bg-[#00C853]/10 border border-[#00C853]/25 p-3.5 rounded-xl text-center select-none flex flex-col items-center">
              <Clock className="w-5 h-5 text-[#00C853] mb-1" />
              <p className="text-[12px] font-bold text-white">Daily Attendance Claimed</p>
              <p className="text-[10px] text-[#B8CEC9] mt-0.5">
                Rewarded <strong className="text-[#FED36A]">Rs {checkInReward}</strong> today. Come back tomorrow!
              </p>
            </div>
          ) : (
            <button
              onClick={handleDailyCheckIn}
              disabled={!userProfile}
              className="w-full bg-[#00C853] hover:bg-[#00E676] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all shadow cursor-pointer text-[12px] uppercase select-none active:scale-95"
            >
              Claim Daily Bonus
            </button>
          )}

          {!userProfile && (
            <span className="text-[9px] text-[#E53935] text-center italic select-none">
              * Please sign in to claim rewards.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

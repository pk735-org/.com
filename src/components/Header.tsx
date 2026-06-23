import React, { useState } from 'react';
import { X, Menu } from 'lucide-react';
import { Profile } from '../types';

interface HeaderProps {
  userProfile: Profile | null;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ userProfile, onNavigate }) => {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] z-[101]">
      {/* 1. Dismissible Download App Banner */}
      {showBanner && (
        <div className="relative w-full bg-[#03443C] h-[40px] flex items-center px-4 shrink-0 border-b border-[#023E37]">
          <button 
            onClick={() => setShowBanner(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors mr-2 cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <div className="w-6 h-6 bg-[#02332C] rounded-[4px] flex items-center justify-center border border-[#023E37] flex-shrink-0">
              <span className="text-[#FED36A] font-bold text-[10px] italic">PK</span>
            </div>
            <p className="text-[11px] font-medium text-white truncate">
              Download app bonus <span className="text-[#00C853] font-bold ml-1">Rs735</span>
            </p>
          </div>
          <button 
            onClick={() => window.open('https://www.pk735.org/download', '_blank')}
            className="bg-[#00C853] text-white text-[11px] font-bold px-3 py-1 rounded-[4px] hover:brightness-110 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
          >
            Download now
          </button>
        </div>
      )}

      {/* 2. Main Brand Header */}
      <header className="w-full h-[60px] flex items-center shrink-0 bg-[#044D45] border-b border-[#023E37] shadow-md">
        <div className="w-full flex items-center justify-between px-3">
          {/* Menu Icon and Logo */}
          <div className="flex items-center gap-2.5">
            <button 
              type="button" 
              className="cursor-pointer active:scale-95 transition-transform p-1 -ml-1 text-[#B8CEC9] hover:text-white"
              onClick={() => onNavigate('menu')}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div 
              className="flex items-center shrink-0 cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              <img 
                src="/logo.png" 
                alt="PK735" 
                className="w-auto object-contain h-[32px] max-w-[120px]"
                onError={(e) => {
                  // Fallback if logo not found
                  (e.target as HTMLImageElement).src = 'https://www.pk735.org/logo.png';
                }}
              />
            </div>
          </div>

          {/* User Section (Balance & Deposit OR Login Button) */}
          <div className="flex items-center gap-2">
            {userProfile ? (
              <div className="flex items-center gap-2">
                {/* Balance Display */}
                <div className="bg-[#02332C] border border-[#023E37] px-3 py-1 rounded-full flex flex-col justify-center select-none min-w-[90px]">
                  <span className="text-[9px] text-[#B8CEC9] uppercase leading-none font-semibold">Balance</span>
                  <span className="text-[12px] font-bold text-[#FED36A] leading-tight">
                    Rs {userProfile.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Quick Deposit Shortcut */}
                <button
                  onClick={() => onNavigate('deposit')}
                  className="bg-[#00C853] hover:bg-[#00E676] text-white text-[12px] font-bold px-3 py-1.5 rounded-full hover:shadow-[0_0_8px_rgba(0,200,83,0.5)] active:scale-95 transition-all cursor-pointer"
                >
                  Deposit
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="bg-gradient-to-r from-[#FED36A] to-[#F5B041] hover:brightness-110 active:scale-95 text-[#5C4020] text-[12px] font-black px-4 py-1.5 rounded-full transition-all shadow-md cursor-pointer"
              >
                Login / Join
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

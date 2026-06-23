import React from 'react';
import { Volume2, Mail } from 'lucide-react';

interface MarqueeProps {
  onNavigate: (page: string) => void;
}

export const Marquee: React.FC<MarqueeProps> = ({ onNavigate }) => {
  return (
    <div className="w-full px-3 py-1.5 bg-transparent select-none">
      <div className="w-full h-[36px] bg-[#02332C]/90 border border-[#023E37] rounded-full flex items-center px-4 gap-2.5 overflow-hidden shadow-sm">
        {/* Megaphone icon */}
        <div className="flex-shrink-0 flex items-center justify-center text-[#3BA285]">
          <Volume2 className="w-4 h-4 fill-[#3BA285]/20" />
        </div>

        {/* Scrolling text container */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="absolute whitespace-nowrap animate-marquee flex items-center gap-12 text-[11px] text-[#E3E3E3] font-medium">
            <span>
              <strong className="text-[#FED36A] font-bold">Exclusive Offer:</strong> First deposit of <strong className="text-[#FED36A] font-bold">Rs300</strong> or more to get a chance to draw a <strong className="text-[#FED36A] font-bold">lucky spin</strong>!
            </span>
            <span>
              <strong className="text-[#FED36A] font-bold">Safe Gaming:</strong> Double check deposit account numbers before transferring. We update numbers daily!
            </span>
            <span>
              <strong className="text-[#FED36A] font-bold">Exclusive Offer:</strong> First deposit of <strong className="text-[#FED36A] font-bold">Rs300</strong> or more to get a chance to draw a <strong className="text-[#FED36A] font-bold">lucky spin</strong>!
            </span>
            <span>
              <strong className="text-[#FED36A] font-bold">Safe Gaming:</strong> Double check deposit account numbers before transferring. We update numbers daily!
            </span>
          </div>
        </div>

        {/* Inbox / Notification shortcut */}
        <div 
          onClick={() => onNavigate('offers')}
          className="relative flex-shrink-0 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
        >
          <div className="w-[20px] h-[20px] flex items-center justify-center text-[#FED36A]">
            <Mail className="w-[18px] h-[18px] text-[#FED36A]" />
          </div>
          {/* Notification Badge */}
          <div className="absolute -top-2 -right-2 bg-[#E53935] text-white text-[8px] font-black w-[14px] h-[14px] rounded-full flex items-center justify-center border border-[#02332C] shadow-sm">
            6
          </div>
        </div>
      </div>
    </div>
  );
};

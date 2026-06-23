import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Winner {
  phone: string;
  amount: string;
  imgUrl: string;
}

export const WinnerList: React.FC = () => {
  // Exact asset URLs from target site
  const winners: Winner[] = [
    { phone: '1***00', amount: '120K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default.avif' },
    { phone: '2***07', amount: '157K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default%20(9).avif' },
    { phone: '3***14', amount: '194K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default%20(8).avif' },
    { phone: '4***21', amount: '231K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default%20(7).avif' },
    { phone: '5***28', amount: '268K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default%20(6).avif' },
    { phone: '6***35', amount: '305K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default%20(5).avif' },
    { phone: '7***42', amount: '342K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default%20(4).avif' },
    { phone: '8***49', amount: '379K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default%20(20).avif' },
    { phone: '9***56', amount: '416K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default%20(2).avif' },
    { phone: '1***63', amount: '453K', imgUrl: 'https://euagjnrkoprokvooslvc.supabase.co/storage/v1/object/public/games/prizetiker/default%20(19).avif' }
  ];

  return (
    <section className="bg-[#044D45] py-5 overflow-hidden w-full rounded-t-2xl shadow-inner mt-4">
      {/* Header section with decorations */}
      <div className="flex items-center justify-center gap-3 px-4 mb-4 select-none">
        <span className="h-px flex-1 max-w-[72px] bg-gradient-to-r from-transparent to-white/25"></span>
        <span className="text-white/30 text-[10px]">◆</span>
        <h2 className="text-white text-[14px] font-bold tracking-wide uppercase">Grand Prize Record</h2>
        <span className="text-white/30 text-[10px]">◆</span>
        <span className="h-px flex-1 max-w-[72px] bg-gradient-to-l from-transparent to-white/25"></span>
      </div>

      {/* Masked Marquee Wrapper */}
      <div className="grand-prize-marquee-mask relative w-full overflow-hidden">
        {/* Repeating two sets for infinite seamless scroll */}
        <div className="grand-prize-marquee-track flex gap-4 px-3">
          {[...winners, ...winners].map((win, idx) => (
            <div 
              key={idx} 
              className="flex-shrink-0 w-[90px] flex flex-col gap-1.5 bg-[#03443C] p-1.5 rounded-xl border border-white/5 shadow-md hover:scale-105 transition-transform"
            >
              {/* Game Thumbnail */}
              <div className="w-full aspect-[4/5] rounded-lg overflow-hidden bg-[#023E37]">
                <img 
                  src={win.imgUrl} 
                  alt="" 
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Player and Status */}
              <p className="text-[10px] leading-tight pl-0.5 flex justify-between select-none">
                <span className="text-white/80 font-mono">{win.phone}</span>
                <span className="text-[#E85D5D] font-medium">win</span>
              </p>

              {/* Winnings amount */}
              <div className="flex items-center gap-1 pl-0.5 justify-between">
                <div className="flex items-center gap-1">
                  <span className="w-[14px] h-[14px] rounded-full bg-[#FFEA00] flex items-center justify-center text-[7px] font-black text-[#5C4020] shrink-0 font-sans">
                    Rs
                  </span>
                  <span className="text-[#FFEA00] font-bold text-[12px] leading-none font-mono">
                    {win.amount}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#5EB38A] shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

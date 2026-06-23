import React, { useState, useEffect } from 'react';
import { Search, Trophy, Play } from 'lucide-react';
import { BannerSlider } from '../components/BannerSlider';
import { Categories } from '../components/Categories';
import { Marquee } from '../components/Marquee';
import { WinnerList } from '../components/WinnerList';
import { Profile } from '../types';

interface HomeProps {
  userProfile: Profile | null;
  onNavigate: (page: string) => void;
  onPlayGame: (gameId: string) => void;
}

interface Game {
  id: string;
  name: string;
  category: string;
  imgUrl: string;
}

export const Home: React.FC<HomeProps> = ({ userProfile: _userProfile, onNavigate, onPlayGame }) => {
  const [activeCategory, setActiveCategory] = useState('hot');
  const [jackpotValue, setJackpotValue] = useState(148563.80);

  // Auto-ticking jackpot value for a premium casino aesthetic
  useEffect(() => {
    const timer = setInterval(() => {
      setJackpotValue((prev) => prev + (Math.random() * 2.5));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const games: Game[] = [
    {
      id: 'aviator',
      name: 'Aviator',
      category: 'hot',
      imgUrl: 'https://www.pk735.org/game-icons/1.jpeg'
    },
    {
      id: 'slots',
      name: 'Money Slots',
      category: 'slot',
      imgUrl: 'https://www.pk735.org/game-icons/2.jpeg'
    },
    {
      id: 'fortune',
      name: 'Fortune Tiger',
      category: 'slot',
      imgUrl: 'https://www.pk735.org/game-icons/3.jpeg'
    },
    {
      id: 'mines',
      name: 'Mines Cashout',
      category: 'blockchain',
      imgUrl: 'https://www.pk735.org/game-icons/r789.avif'
    },
    // Adding duplicates or other categories for rich list look
    {
      id: 'aviator',
      name: 'Crash Aviator',
      category: 'blockchain',
      imgUrl: 'https://www.pk735.org/game-icons/1.jpeg'
    },
    {
      id: 'slots',
      name: 'Lucky Money',
      category: 'hot',
      imgUrl: 'https://www.pk735.org/game-icons/2.jpeg'
    },
    {
      id: 'fortune',
      name: 'Gold Fortune',
      category: 'hot',
      imgUrl: 'https://www.pk735.org/game-icons/3.jpeg'
    },
    {
      id: 'mines',
      name: 'Diamond Mines',
      category: 'hot',
      imgUrl: 'https://www.pk735.org/game-icons/r789.avif'
    }
  ];

  // Filter games based on active category tab
  const filteredGames = games.filter(
    (g) => activeCategory === 'hot' || g.category === activeCategory
  );

  return (
    <div className="flex-1 w-full bg-[#04534A] pb-[80px] pt-[100px] flex flex-col gap-2 overflow-x-hidden">
      {/* 1. Header Banner Slider */}
      <div className="px-3">
        <BannerSlider />
      </div>

      {/* 2. Announcement Marquee */}
      <Marquee onNavigate={onNavigate} />

      {/* 3. Search Bar */}
      <div className="px-3 py-1">
        <div className="relative w-full h-[40px] bg-[#02332C] border border-[#023E37] rounded-full flex items-center px-4 gap-2">
          <Search className="w-4 h-4 text-[#3BA285]" />
          <input
            type="text"
            placeholder="Search game or provider..."
            className="bg-transparent border-none text-white text-[12px] w-full focus:outline-none placeholder-white/30"
          />
        </div>
      </div>

      {/* 4. Category Tabs */}
      <div className="px-2">
        <Categories activeCategory={activeCategory} onChangeCategory={setActiveCategory} />
      </div>

      {/* 5. Slots Jackpot Display Banner (Only shown in Hot / Slot categories) */}
      {(activeCategory === 'hot' || activeCategory === 'slot') && (
        <div className="px-3 py-1 select-none">
          <div className="relative w-full aspect-[3.5/1] rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-[#02332C] flex items-center justify-center">
            {/* Background image/gradient mock */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/30 via-red-900/40 to-yellow-600/30 z-0" />
            <img 
              src="https://www.pk735.org/jackpot.avif" 
              alt="Jackpot" 
              className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay z-0" 
            />
            {/* Live Jackpot amount */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-3">
              <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-widest drop-shadow">
                ⭐ Mega Slots Jackpot ⭐
              </span>
              <span className="text-[20px] xs:text-[24px] sm:text-[28px] font-mono font-black text-[#FFE600] tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1 animate-pulse">
                Rs {jackpotValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Games List Grid */}
      <div className="px-3 flex-1">
        <div className="grid grid-cols-3 gap-3.5 py-2">
          {filteredGames.map((game, index) => (
            <div
              key={index}
              onClick={() => onPlayGame(game.id)}
              className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shadow-lg active:scale-95 hover:scale-105 transition-all duration-200 bg-[#02332C] cursor-pointer group"
            >
              {/* Game Poster */}
              <img
                src={game.imgUrl}
                alt={game.name}
                className="w-full h-[75%] object-cover group-hover:brightness-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80';
                }}
              />
              {/* Game Label */}
              <div className="h-[25%] bg-[#02332C] flex items-center justify-center px-1 text-center">
                <span className="text-[10px] font-bold text-white truncate w-full">
                  {game.name}
                </span>
              </div>

              {/* Play Overlay Hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <div className="bg-[#FED36A] p-2 rounded-full shadow-md text-[#5C4020]">
                  <Play className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="w-full py-12 flex flex-col items-center justify-center text-center text-white/50">
            <Trophy className="w-10 h-10 stroke-1 mb-2" />
            <p className="text-[12px]">No games found in this category</p>
          </div>
        )}
      </div>

      {/* 7. Winner Announcement List */}
      <WinnerList />
    </div>
  );
};

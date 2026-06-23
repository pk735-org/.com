import React from 'react';
import { Flame, Database, Disc, Anchor, Tv, Trophy, History, Star } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface CategoriesProps {
  activeCategory: string;
  onChangeCategory: (category: string) => void;
}

export const Categories: React.FC<CategoriesProps> = ({ activeCategory, onChangeCategory }) => {
  const categories: CategoryItem[] = [
    { id: 'hot', name: 'Hot', icon: <Flame className="w-[18px] h-[18px]" />, color: '#FED36A' },
    { id: 'slot', name: 'Slot', icon: <Disc className="w-[18px] h-[18px]" />, color: '#3BA285' },
    { id: 'blockchain', name: 'Blockchain', icon: <Database className="w-[18px] h-[18px]" />, color: '#3BA285' },
    { id: 'fishing', name: 'Fishing', icon: <Anchor className="w-[18px] h-[18px]" />, color: '#3BA285' },
    { id: 'live', name: 'Live', icon: <Tv className="w-[18px] h-[18px]" />, color: '#3BA285' },
    { id: 'sport', name: 'Sport', icon: <Trophy className="w-[18px] h-[18px]" />, color: '#3BA285' },
    { id: 'recent', name: 'Recent', icon: <History className="w-[18px] h-[18px]" />, color: '#3BA285' },
    { id: 'favorite', name: 'Favorite', icon: <Star className="w-[18px] h-[18px]" />, color: '#3BA285' }
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-3 bg-transparent select-none">
      <div className="flex items-center gap-6 px-1">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategory;
          const iconColor = isActive ? '#FED36A' : cat.color;
          const textColor = isActive ? '#FED36A' : '#3BA285';
          
          return (
            <button
              key={cat.id}
              onClick={() => onChangeCategory(cat.id)}
              className="flex items-center gap-1.5 transition-all duration-200 flex-shrink-0 cursor-pointer active:scale-95 border-b-2 pb-0.5"
              style={{ 
                color: textColor,
                borderBottomColor: isActive ? '#FED36A' : 'transparent'
              }}
            >
              <div className="flex items-center justify-center" style={{ color: iconColor }}>
                {cat.icon}
              </div>
              <span className="text-[13px] font-bold tracking-tight">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

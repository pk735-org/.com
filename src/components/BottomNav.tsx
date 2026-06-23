import React from 'react';
import { Home, UserPlus, Gift, User, MessageCircle } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate, isAdmin }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'invite', label: 'Invite', icon: <UserPlus className="w-5 h-5" /> },
    { id: 'offers', label: 'Offers', icon: <Gift className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'support', label: 'Support', icon: <MessageCircle className="w-5 h-5" /> }
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] bg-[#044D45] border-t border-[#023E37] py-2 px-3 flex items-center justify-around z-[100] shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
      {tabs.map((tab) => {
        const isActive = currentPage === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 active:scale-95 ${
              isActive ? 'text-[#FED36A] scale-105 font-bold' : 'text-[#B8CEC9] hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}

      {/* Admin dashboard shortcut if user is admin */}
      {isAdmin && (
        <button
          onClick={() => onNavigate('admin')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 active:scale-95 ${
            currentPage === 'admin' ? 'text-[#FED36A] scale-105 font-bold' : 'text-orange-400 hover:text-orange-300'
          }`}
        >
          <span className="bg-orange-500/20 px-2 py-0.5 rounded-full text-[8px] font-black border border-orange-500/30">
            ADM
          </span>
          <span className="text-[10px] tracking-tight">Admin</span>
        </button>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Copy, Gift, DollarSign, Award, Users } from 'lucide-react';
import { Profile } from '../types';

interface InviteProps {
  userProfile: Profile | null;
}

export const Invite: React.FC<InviteProps> = ({ userProfile }) => {
  const [copied, setCopied] = useState(false);

  // Fallback default code if not logged in
  const refCode = userProfile ? userProfile.phone : 'guest735';
  const referralLink = `${window.location.origin}/auth?ref=${refCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { id: 1, title: 'Share Invite Link', desc: 'Copy your unique link and share it on Facebook, WhatsApp, or Telegram.' },
    { id: 2, title: 'Friends Register & Play', desc: 'Your friends sign up using your referral link and place bets.' },
    { id: 3, title: 'Earn Commission', desc: 'Get paid a direct 5% cash commission from every deposit your friends make!' }
  ];

  return (
    <div className="flex-1 w-full bg-[#04534A] pb-[80px] pt-[100px] flex flex-col px-4 overflow-y-auto">
      <div className="flex flex-col gap-4">
        {/* Banner header */}
        <div className="bg-gradient-to-r from-[#03443C] to-[#02332C] p-5 rounded-2xl border border-[#023E37] text-center shadow-xl select-none flex flex-col items-center">
          <Gift className="w-12 h-12 text-[#FED36A] mb-2 animate-bounce" />
          <h2 className="text-[18px] font-black text-white uppercase tracking-wider">Refer & Earn Program</h2>
          <p className="text-[11px] text-[#B8CEC9] mt-1 max-w-[280px] leading-normal">
            Invite your friends to play on PK735 and earn unlimited passive cash bonuses!
          </p>
        </div>

        {/* Invite Link Card */}
        <div className="bg-[#03443C] p-5 rounded-2xl border border-[#023E37] shadow-xl flex flex-col gap-3">
          <div className="flex items-center gap-1.5 select-none">
            <Users className="w-4.5 h-4.5 text-[#FED36A]" />
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">Your Referral Link</h3>
          </div>

          <div className="bg-[#02332C] border border-[#023E37] p-3 rounded-xl flex items-center justify-between mt-1">
            <div className="overflow-hidden mr-2 flex-1">
              <p className="text-[9px] text-[#B8CEC9] uppercase select-none font-bold">Copy Link</p>
              <p className="text-[12px] text-white truncate font-semibold font-mono mt-1 select-all">{referralLink}</p>
            </div>
            <button
              onClick={handleCopy}
              className="bg-[#03443C] border border-[#023E37] text-[#FED36A] text-[10px] font-bold px-4 py-2.5 rounded-lg hover:bg-[#FED36A] hover:text-[#5C4020] cursor-pointer flex items-center gap-1 active:scale-90 transition-all shrink-0 select-none"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Referral stats */}
        <div className="grid grid-cols-2 gap-3 select-none">
          <div className="bg-[#03443C] p-4 rounded-xl border border-[#023E37] flex flex-col items-center text-center shadow-md">
            <Users className="w-5 h-5 text-[#3BA285] mb-1" />
            <span className="text-[9px] text-[#B8CEC9] uppercase font-bold">Total Referred</span>
            <span className="text-[16px] text-white font-black mt-1 font-mono">0 Players</span>
          </div>

          <div className="bg-[#03443C] p-4 rounded-xl border border-[#023E37] flex flex-col items-center text-center shadow-md">
            <DollarSign className="w-5 h-5 text-[#FED36A] mb-1" />
            <span className="text-[9px] text-[#B8CEC9] uppercase font-bold">Earned Commission</span>
            <span className="text-[16px] text-[#FED36A] font-black mt-1 font-mono">Rs 0.00</span>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[#03443C] p-4 rounded-2xl border border-[#023E37] shadow-xl">
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 select-none flex items-center gap-1.5">
            <Award className="w-4.5 h-4.5 text-[#FED36A]" />
            <span>How it works</span>
          </h4>

          <div className="flex flex-col gap-5 select-none">
            {steps.map((step) => (
              <div key={step.id} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-[#02332C] border border-[#FED36A]/20 flex items-center justify-center font-bold text-[11px] text-[#FED36A] shrink-0 mt-0.5 shadow-inner">
                  {step.id}
                </div>
                <div>
                  <h5 className="text-[12px] font-bold text-white leading-tight">{step.title}</h5>
                  <p className="text-[10px] text-[#B8CEC9] mt-1 leading-normal">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

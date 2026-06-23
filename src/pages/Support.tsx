import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, MessageSquare, Send, HelpCircle, ShieldAlert } from 'lucide-react';

interface SupportProps {
  onNavigate: (page: string) => void;
}

export const Support: React.FC<SupportProps> = ({ onNavigate }) => {
  const [telegramLink, setTelegramLink] = useState('https://t.me/pk735_support');

  useEffect(() => {
    const fetchSupport = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('key', 'telegram_link')
          .single();

        if (data && !error) {
          setTelegramLink(data.value);
        }
      } catch (err) {
        console.error('Failed to load support settings:', err);
      }
    };
    fetchSupport();
  }, []);

  const faqs = [
    { q: 'How long does a deposit take?', a: 'Deposits via EasyPaisa and JazzCash usually take 5 to 15 minutes to be verified and credited to your balance.' },
    { q: 'What is the minimum withdrawal amount?', a: 'The minimum withdrawal amount is Rs 300, and it is processed directly to your mobile wallet.' },
    { q: 'How can I get my Rs 735 free bonus?', a: 'You receive the APK app bonus upon successful registration and your first deposit of at least Rs 300.' },
    { q: 'What if my Transaction ID is rejected?', a: 'Please double-check your receipt details. If you submitted the correct TID, click the Live Telegram Support button below and send us your receipt screenshot.' }
  ];

  return (
    <div className="flex-1 w-full bg-[#04534A] pb-[80px] pt-[100px] flex flex-col px-4 overflow-y-auto">
      {/* Header title */}
      <div className="flex items-center gap-2 mb-4 select-none">
        <button 
          onClick={() => onNavigate('home')}
          className="p-1 hover:bg-white/10 rounded-full text-[#B8CEC9] hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white text-base font-bold">Customer Support</h2>
      </div>

      <div className="flex flex-col gap-4 select-none">
        {/* Support Card info */}
        <div className="bg-[#03443C] p-5 rounded-2xl border border-[#023E37] text-center shadow-xl flex flex-col items-center">
          <MessageSquare className="w-12 h-12 text-[#FED36A] mb-2" />
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">Need Help? Contact Us</h3>
          <p className="text-[11px] text-[#B8CEC9] mt-2 max-w-[280px] leading-normal">
            If you have issues with deposits, withdrawals, or game balance, contact our live agents 24/7.
          </p>

          <button
            onClick={() => window.open(telegramLink, '_blank')}
            className="mt-5 bg-[#00C853] hover:brightness-110 active:scale-95 text-white font-black px-6 py-3 rounded-full shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 text-[12px] uppercase select-none w-full max-w-[240px]"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>Telegram Live Chat</span>
          </button>
        </div>

        {/* FAQs */}
        <div className="bg-[#03443C] p-4 rounded-2xl border border-[#023E37] shadow-xl">
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-[#023E37] pb-2">
            <HelpCircle className="w-4 h-4 text-[#FED36A]" />
            <span>Frequently Asked Questions</span>
          </h4>

          <div className="flex flex-col gap-3.5">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-[#023E37]/50 last:border-none pb-3 last:pb-0">
                <p className="text-[11.5px] font-bold text-white leading-tight">
                  Q: {faq.q}
                </p>
                <p className="text-[10px] text-[#B8CEC9] mt-1.5 leading-normal">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Warning card */}
        <div className="bg-[#E53935]/10 border border-[#E53935]/25 p-4 rounded-xl flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[#E53935] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10.5px] font-bold text-[#E53935] uppercase">Security Warning</p>
            <p className="text-[9.5px] text-[#B8CEC9] mt-1 leading-normal">
              We never ask for your account password or wallet PIN numbers. Keep your login credentials private!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

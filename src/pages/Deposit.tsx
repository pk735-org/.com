import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Wallet, CreditCard, Send, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { Profile, SystemSettings } from '../types';

interface DepositProps {
  userProfile: Profile;
  onNavigate: (page: string) => void;
  onRefreshBalance: () => void;
}

export const Deposit: React.FC<DepositProps> = ({ userProfile, onNavigate, onRefreshBalance }) => {
  const [method, setMethod] = useState<'EasyPaisa' | 'JazzCash'>('EasyPaisa');
  const [amount, setAmount] = useState<number>(300);
  const [senderAccount, setSenderAccount] = useState('');
  const [tid, setTid] = useState('');
  const [settings, setSettings] = useState<SystemSettings>({
    easypaisa_number: '03001234567',
    easypaisa_name: 'M. Khalil',
    jazzcash_number: '03127654321',
    jazzcash_name: 'Babar Azam',
    telegram_link: 'https://t.me/pk735_support',
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch Admin active settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('*');
        
        if (data && !error) {
          const fetched: any = {};
          data.forEach(item => {
            fetched[item.key] = item.value;
          });
          setSettings(prev => ({
            ...prev,
            ...fetched
          }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const presets = [300, 500, 1000, 2000, 5000, 10000, 20000, 50000];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeNumber = method === 'EasyPaisa' ? settings.easypaisa_number : settings.jazzcash_number;
  const activeName = method === 'EasyPaisa' ? settings.easypaisa_name : settings.jazzcash_name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (amount < 300) {
      setErrorMsg('Minimum deposit amount is Rs 300.');
      return;
    }

    if (!senderAccount.trim() || senderAccount.length < 10) {
      setErrorMsg('Please enter a valid Sender Wallet Number.');
      return;
    }

    // Typical TIDs in Pak wallets are around 11 digits
    if (tid.trim().length < 8) {
      setErrorMsg('Please enter a valid Transaction ID (TID) from your wallet receipt.');
      return;
    }

    setLoading(true);

    try {
      // Insert deposit row
      const { error } = await supabase
        .from('deposits')
        .insert([
          {
            user_id: userProfile.id,
            phone: userProfile.phone,
            amount: amount,
            payment_method: method,
            sender_account: senderAccount.trim(),
            transaction_id: tid.trim(),
            status: 'pending',
          }
        ]);

      if (error) {
        if (error.message.includes('unique_transaction')) {
          setErrorMsg('This Transaction ID has already been submitted.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setSuccess(true);
        setSenderAccount('');
        setTid('');
        onRefreshBalance();
      }
    } catch (err: any) {
      setErrorMsg('Failed to submit request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#04534A] pb-[80px] pt-[100px] flex flex-col px-4 overflow-y-auto">
      {/* Header title */}
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={() => onNavigate('home')}
          className="p-1 hover:bg-white/10 rounded-full text-[#B8CEC9] hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white text-base font-bold select-none">Deposit Funds</h2>
      </div>

      {success ? (
        <div className="bg-[#03443C] p-6 rounded-2xl border border-[#023E37] text-center shadow-xl my-auto flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-[#00C853] mb-4 animate-bounce" />
          <h3 className="text-white font-bold text-lg">Submission Successful</h3>
          <p className="text-[12px] text-[#B8CEC9] mt-2 max-w-[280px]">
            Your deposit request of <strong className="text-[#FED36A]">Rs {amount}</strong> has been submitted. 
            Once the Admin verifies your Transaction ID (TID), the balance will be added to your account (usually takes 5-15 mins).
          </p>
          <button
            onClick={() => { setSuccess(false); onNavigate('home'); }}
            className="mt-6 bg-[#00C853] hover:brightness-110 text-white font-bold px-6 py-2 rounded-xl transition-all active:scale-95 cursor-pointer text-[13px]"
          >
            Go back to Lobby
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Preset amount selector */}
          <div className="bg-[#03443C] p-4 rounded-xl border border-[#023E37] shadow-md">
            <label className="text-[11px] text-[#B8CEC9] uppercase font-bold tracking-wider block mb-2 select-none">
              Select Deposit Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 text-[12px] font-black rounded-lg border transition-all cursor-pointer active:scale-95 ${
                    amount === val
                      ? 'bg-[#FED36A] text-[#5C4020] border-[#FED36A] shadow'
                      : 'bg-[#02332C] text-white border-white/5 hover:border-[#FED36A]/50'
                  }`}
                >
                  Rs {val}
                </button>
              ))}
            </div>
            
            {/* Custom Input */}
            <div className="relative mt-3 h-[42px] bg-[#02332C] border border-white/5 rounded-lg flex items-center px-3 gap-2">
              <span className="text-[12px] font-black text-[#FED36A]">Rs</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={300}
                placeholder="Enter custom amount..."
                className="bg-transparent border-none text-white text-[13px] font-bold w-full focus:outline-none placeholder-white/20"
              />
            </div>
            <span className="text-[9px] text-[#B8CEC9] mt-1.5 block italic">
              * Minimum deposit: Rs 300. Eligible for 1 Lucky Spin wheel entry on first deposit.
            </span>
          </div>

          {/* Payment Method selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod('EasyPaisa')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                method === 'EasyPaisa'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white border-emerald-500 shadow-md font-bold'
                  : 'bg-[#03443C] text-[#B8CEC9] border-[#023E37]'
              }`}
            >
              <Wallet className="w-4 h-4 shrink-0" />
              <span className="text-[13px]">EasyPaisa</span>
            </button>

            <button
              onClick={() => setMethod('JazzCash')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                method === 'JazzCash'
                  ? 'bg-gradient-to-r from-orange-600 to-yellow-600 text-white border-orange-500 shadow-md font-bold'
                  : 'bg-[#03443C] text-[#B8CEC9] border-[#023E37]'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span className="text-[13px]">JazzCash</span>
            </button>
          </div>

          {/* Active Receiver Account display */}
          <div className="bg-[#02332C] p-4 rounded-xl border border-dashed border-[#FED36A]/30 flex flex-col gap-2">
            <span className="text-[10px] text-[#FED36A] font-bold uppercase tracking-wider select-none">
              Transfer Funds To This Account:
            </span>
            <div className="flex items-center justify-between mt-1">
              <div>
                <p className="text-[10px] text-[#B8CEC9]">Account Method</p>
                <p className="text-[13px] text-white font-bold">{method}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#B8CEC9]">Account Name</p>
                <p className="text-[13px] text-[#FED36A] font-bold">{activeName}</p>
              </div>
            </div>
            
            <div className="bg-[#03443C] p-2.5 rounded-lg border border-[#023E37] flex items-center justify-between mt-1">
              <div>
                <p className="text-[9px] text-[#B8CEC9] leading-none">Account Number</p>
                <p className="text-[16px] text-white font-mono font-black mt-1 leading-none">{activeNumber}</p>
              </div>
              <button
                onClick={() => handleCopy(activeNumber)}
                className="bg-[#02332C] border border-[#023E37] text-white text-[10px] font-bold px-3 py-1.5 rounded-md hover:bg-[#FED36A] hover:text-[#5C4020] cursor-pointer flex items-center gap-1 active:scale-90 transition-all select-none"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="text-[10px] text-[#B8CEC9] mt-1 space-y-1 select-none leading-relaxed">
              <p>1. Open your {method} App.</p>
              <p>2. Transfer <strong className="text-white">Rs {amount}</strong> to the account above.</p>
              <p>3. Note down the 11-digit <strong className="text-[#FED36A]">Transaction ID (TID)</strong> from the SMS or receipt.</p>
            </div>
          </div>

          {/* Form */}
          {errorMsg && (
            <div className="bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] text-[11px] px-3 py-2 rounded-lg flex items-start gap-2 select-none">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#B8CEC9] font-bold uppercase tracking-wider select-none">
                Your Wallet Number (Sender)
              </label>
              <input
                type="tel"
                placeholder="e.g. 03001234567"
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value.replace(/\D/g, ''))}
                required
                className="h-[42px] bg-[#02332C] border border-white/5 rounded-lg px-3 text-[13px] text-white font-semibold focus:outline-none focus:border-[#FED36A]/50 placeholder-white/20"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#B8CEC9] font-bold uppercase tracking-wider select-none">
                Transaction ID (TID)
              </label>
              <input
                type="text"
                placeholder="e.g. 23847291048"
                value={tid}
                onChange={(e) => setTid(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                required
                className="h-[42px] bg-[#02332C] border border-white/5 rounded-lg px-3 text-[13px] text-white font-mono font-bold focus:outline-none focus:border-[#FED36A]/50 placeholder-white/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#FED36A] to-[#F5B041] hover:brightness-110 active:scale-95 text-[#5C4020] font-black py-3.5 rounded-xl shadow-lg mt-2 cursor-pointer flex items-center justify-center gap-2 transition-all select-none disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting Request...' : 'Submit Deposit Request'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Wallet, CreditCard, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Profile } from '../types';

interface WithdrawProps {
  userProfile: Profile;
  onNavigate: (page: string) => void;
  onRefreshBalance: () => void;
}

export const Withdraw: React.FC<WithdrawProps> = ({ userProfile, onNavigate, onRefreshBalance }) => {
  const [method, setMethod] = useState<'EasyPaisa' | 'JazzCash'>('EasyPaisa');
  const [amount, setAmount] = useState<number>(500);
  const [receiverAccount, setReceiverAccount] = useState('');
  const [receiverName, setReceiverName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (amount < 300) {
      setErrorMsg('Minimum withdrawal amount is Rs 300.');
      return;
    }

    if (amount > userProfile.balance) {
      setErrorMsg('Insufficient balance for this withdrawal.');
      return;
    }

    if (!receiverAccount.trim() || receiverAccount.length < 10) {
      setErrorMsg('Please enter a valid payout wallet number.');
      return;
    }

    if (!receiverName.trim()) {
      setErrorMsg('Please enter the recipient account title.');
      return;
    }

    setLoading(true);

    try {
      // Create withdrawal request. 
      // The Supabase trigger we defined in the schema will handle automatically deducting the balance.
      const { error } = await supabase
        .from('withdrawals')
        .insert([
          {
            user_id: userProfile.id,
            phone: userProfile.phone,
            amount: amount,
            payment_method: method,
            receiver_account: receiverAccount.trim(),
            receiver_name: receiverName.trim(),
            status: 'pending',
          }
        ]);

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccess(true);
        setReceiverAccount('');
        setReceiverName('');
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
          onClick={() => onNavigate('profile')}
          className="p-1 hover:bg-white/10 rounded-full text-[#B8CEC9] hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white text-base font-bold select-none">Withdraw Balance</h2>
      </div>

      {success ? (
        <div className="bg-[#03443C] p-6 rounded-2xl border border-[#023E37] text-center shadow-xl my-auto flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-[#FED36A] mb-4 animate-bounce" />
          <h3 className="text-white font-bold text-lg">Withdrawal Requested</h3>
          <p className="text-[12px] text-[#B8CEC9] mt-2 max-w-[280px]">
            Your withdrawal request of <strong className="text-[#FED36A]">Rs {amount}</strong> has been received. 
            Funds will be transferred to your <strong className="text-white">{method}</strong> account within 1-24 hours.
          </p>
          <button
            onClick={() => { setSuccess(false); onNavigate('home'); }}
            className="mt-6 bg-[#FED36A] hover:brightness-110 text-[#5C4020] font-black px-6 py-2 rounded-xl transition-all active:scale-95 cursor-pointer text-[13px]"
          >
            Go back to Lobby
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Available balance card */}
          <div className="bg-[#02332C] p-4 rounded-xl border border-[#023E37] flex flex-col justify-center select-none shadow-md">
            <span className="text-[10px] text-[#B8CEC9] uppercase font-bold tracking-wider">Available Withdraw Balance</span>
            <span className="text-[22px] font-black text-[#FED36A] mt-1">
              Rs {userProfile.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

          {/* Guidelines */}
          <div className="bg-[#03443C] p-3 rounded-xl border border-[#023E37] text-[10px] text-[#B8CEC9] select-none leading-relaxed">
            <p className="text-[#FED36A] font-bold uppercase tracking-wider mb-1">Important Payout Rules:</p>
            <p>• Payout is sent to Pakistani mobile wallets only.</p>
            <p>• Minimum withdrawal: Rs 300. Maximum per transaction: Rs 50,000.</p>
            <p>• Make sure the account details are 100% correct. We are not liable for transfers to incorrect numbers.</p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] text-[11px] px-3 py-2 rounded-lg flex items-start gap-2 select-none">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#B8CEC9] font-bold uppercase tracking-wider select-none">
                Withdraw Amount (Rs)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={300}
                max={50000}
                required
                className="h-[42px] bg-[#02332C] border border-white/5 rounded-lg px-3 text-[13px] text-[#FED36A] font-black focus:outline-none focus:border-[#FED36A]/50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#B8CEC9] font-bold uppercase tracking-wider select-none">
                Receiver Account Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 03001234567"
                value={receiverAccount}
                onChange={(e) => setReceiverAccount(e.target.value.replace(/\D/g, ''))}
                required
                className="h-[42px] bg-[#02332C] border border-white/5 rounded-lg px-3 text-[13px] text-white font-semibold focus:outline-none focus:border-[#FED36A]/50 placeholder-white/20"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#B8CEC9] font-bold uppercase tracking-wider select-none">
                Account Title / Name
              </label>
              <input
                type="text"
                placeholder="e.g. Babar Azam"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
                className="h-[42px] bg-[#02332C] border border-white/5 rounded-lg px-3 text-[13px] text-white font-bold focus:outline-none focus:border-[#FED36A]/50 placeholder-white/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-[#FED36A] hover:brightness-110 active:scale-95 text-[#5C4020] font-black py-3.5 rounded-xl shadow-lg mt-2 cursor-pointer flex items-center justify-center gap-2 transition-all select-none disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Submitting Request...' : 'Submit Withdraw Request'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

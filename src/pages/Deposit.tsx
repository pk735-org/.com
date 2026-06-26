import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Wallet, CreditCard, Send, CheckCircle2, AlertCircle, Copy, Zap, ExternalLink, Loader2 } from 'lucide-react';
import { Profile, SystemSettings } from '../types';

const XPRESSPAY_APP_ID = 's2thlhk75z5861rhnwe44ze6';
const XPRESSPAY_BASE_URL = 'https://gateway-pakistan.com';

interface DepositProps {
  userProfile: Profile;
  onNavigate: (page: string) => void;
  onRefreshBalance: () => void;
}

export const Deposit: React.FC<DepositProps> = ({ userProfile, onNavigate, onRefreshBalance }) => {
  // Tab: 'instant' = XpressPay gateway | 'manual' = Manual TID submission
  const [activeTab, setActiveTab] = useState<'instant' | 'manual'>('instant');
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

  // XpressPay states
  const [xpressLoading, setXpressLoading] = useState(false);
  const [xpressError, setXpressError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('system_settings').select('*');
        if (data && !error) {
          const fetched: any = {};
          data.forEach(item => { fetched[item.key] = item.value; });
          setSettings(prev => ({ ...prev, ...fetched }));
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

  // --- XpressPay Instant Checkout ---
  const handleXpressPayDeposit = async () => {
    if (amount < 300) {
      setXpressError('Minimum deposit amount is Rs 300.');
      return;
    }

    setXpressLoading(true);
    setXpressError('');

    const merOrderNo = `PK735_DEP_${userProfile.id.substring(0, 8)}_${Date.now()}`;
    const returnUrl = window.location.origin + (window.location.pathname || '/');

    const payload = {
      appId: XPRESSPAY_APP_ID,
      merOrderNo,
      amount: String(amount),
      channel: method === 'EasyPaisa' ? 'EASYPAISA' : 'JAZZCASH',
      customerMobile: userProfile.phone.replace(/^0/, '92'),
      customerName: userProfile.phone,
      customerEmail: `${userProfile.phone}@pk735.org`,
      notifyUrl: 'https://pk735-org.github.io/.com/',
      returnUrl,
    };

    try {
      const response = await fetch(`${XPRESSPAY_BASE_URL}/api/v2/payment/order/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (json.code === 0 && json.data?.params?.paymentLink) {
        // Save pending deposit record to Supabase so admin can track it
        await supabase.from('deposits').insert([{
          user_id: userProfile.id,
          phone: userProfile.phone,
          amount,
          payment_method: `XpressPay-${method}`,
          sender_account: userProfile.phone,
          transaction_id: merOrderNo,
          status: 'pending',
        }]);

        // Redirect to XpressPay hosted checkout
        window.location.href = json.data.params.paymentLink;
      } else {
        setXpressError(json.msg || 'Payment gateway error. Please try manual deposit.');
      }
    } catch (err: any) {
      console.error('XpressPay error:', err);
      setXpressError('Could not connect to payment gateway. Please try manual deposit method.');
    } finally {
      setXpressLoading(false);
    }
  };

  // --- Manual TID Submit ---
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
    if (tid.trim().length < 8) {
      setErrorMsg('Please enter a valid Transaction ID (TID) from your wallet receipt.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('deposits').insert([{
        user_id: userProfile.id,
        phone: userProfile.phone,
        amount,
        payment_method: method,
        sender_account: senderAccount.trim(),
        transaction_id: tid.trim(),
        status: 'pending',
      }]);

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
      {/* Header */}
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

          {/* Amount Selector */}
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
              * Minimum deposit: Rs 300.
            </span>
          </div>

          {/* Payment Method */}
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

          {/* Tab Switcher */}
          <div className="flex bg-[#02332C] rounded-xl p-1 border border-[#023E37]">
            <button
              onClick={() => { setActiveTab('instant'); setXpressError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === 'instant'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'text-[#B8CEC9] hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Instant Pay
            </button>
            <button
              onClick={() => { setActiveTab('manual'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-[#03443C] text-white shadow-md border border-[#023E37]'
                  : 'text-[#B8CEC9] hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Manual TID
            </button>
          </div>

          {/* ============ INSTANT PAY TAB ============ */}
          {activeTab === 'instant' && (
            <div className="flex flex-col gap-3">
              {/* XpressPay Info Card */}
              <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/30 p-4 rounded-xl border border-blue-500/20 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-[13px]">XpressPay Gateway</p>
                    <p className="text-[9px] text-blue-300">Powered by gateway-pakistan.com</p>
                  </div>
                  <span className="ml-auto px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase">Live</span>
                </div>
                <ul className="text-[11px] text-[#B8CEC9] space-y-1 mt-3">
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> Secure hosted checkout page
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> Auto-routed to your {method} wallet
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> Balance credited after admin verification
                  </li>
                </ul>
              </div>

              {/* Summary Box */}
              <div className="bg-[#02332C] p-3 rounded-xl border border-[#023E37] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#B8CEC9] uppercase font-bold">You will pay</p>
                  <p className="text-[20px] font-black text-[#FED36A] font-mono">Rs {amount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#B8CEC9] uppercase font-bold">Via</p>
                  <p className="text-[13px] font-bold text-white">{method}</p>
                </div>
              </div>

              {xpressError && (
                <div className="bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] text-[11px] px-3 py-2 rounded-lg flex items-start gap-2 select-none">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{xpressError}</span>
                </div>
              )}

              <button
                onClick={handleXpressPayDeposit}
                disabled={xpressLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 active:scale-95 text-white font-black py-3.5 rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all select-none disabled:opacity-60"
              >
                {xpressLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Gateway...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>Pay Rs {amount.toLocaleString()} via {method}</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-[#B8CEC9] italic">
                You'll be redirected to XpressPay's secure checkout page.
              </p>
            </div>
          )}

          {/* ============ MANUAL TID TAB ============ */}
          {activeTab === 'manual' && (
            <div className="flex flex-col gap-3">
              {/* Receiver Account */}
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
      )}
    </div>
  );
};

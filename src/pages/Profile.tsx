import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Profile as UserProfile, Deposit, Withdrawal } from '../types';
import { User, Wallet, ArrowUpRight, ArrowDownLeft, Shield, LogOut, RefreshCw, Clock } from 'lucide-react';

interface ProfileProps {
  userProfile: UserProfile;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  onRefreshBalance: () => void;
}

type LogItem = 
  | { type: 'deposit'; data: Deposit }
  | { type: 'withdrawal'; data: Withdrawal };

export const Profile: React.FC<ProfileProps> = ({ userProfile, onNavigate, onLogout, onRefreshBalance }) => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactionLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch user deposits
      const { data: depositsData, error: depError } = await supabase
        .from('deposits')
        .select('*')
        .eq('user_id', userProfile.id);

      // 2. Fetch user withdrawals
      const { data: withdrawalsData, error: wdError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userProfile.id);

      if (depError) console.error(depError);
      if (wdError) console.error(wdError);

      const items: LogItem[] = [];
      if (depositsData) {
        depositsData.forEach((d: Deposit) => items.push({ type: 'deposit', data: d }));
      }
      if (withdrawalsData) {
        withdrawalsData.forEach((w: Withdrawal) => items.push({ type: 'withdrawal', data: w }));
      }

      // Sort combined logs by created_at descending
      items.sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime());
      setLogs(items);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionLogs();
  }, [userProfile.id]);

  return (
    <div className="flex-1 w-full bg-[#04534A] pb-[80px] pt-[100px] flex flex-col px-4 overflow-y-auto">
      <div className="flex flex-col gap-4">
        {/* User Card */}
        <div className="bg-[#03443C] p-5 rounded-2xl border border-[#023E37] flex items-center gap-4 shadow-xl select-none">
          <div className="w-14 h-14 rounded-full bg-[#02332C] border border-[#FED36A]/20 flex items-center justify-center shadow-inner">
            <User className="w-6 h-6 text-[#FED36A]" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] text-white font-bold font-mono">
              Phone: {userProfile.phone}
            </p>
            <p className="text-[10px] text-[#B8CEC9] uppercase tracking-wider mt-0.5">
              Account ID: {userProfile.id.slice(0, 8)}...
            </p>
            <div className="flex gap-2 mt-1">
              <span className="text-[9px] font-black bg-[#FED36A]/20 text-[#FED36A] border border-[#FED36A]/30 px-2 py-0.5 rounded-full uppercase">
                VIP Level {userProfile.vip_level}
              </span>
              {userProfile.is_admin && (
                <span className="text-[9px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full uppercase">
                  Administrator
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-[#03443C] to-[#02332C] p-5 rounded-2xl border border-[#023E37] shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#B8CEC9] uppercase font-bold tracking-wider select-none">Total Cash Wallet</span>
            <h3 className="text-[24px] font-black text-[#FED36A] mt-1 select-none">
              Rs {userProfile.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onNavigate('deposit')}
              className="bg-[#00C853] hover:brightness-110 active:scale-95 text-white text-[12px] font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md select-none text-center"
            >
              Deposit
            </button>
            <button
              onClick={() => onNavigate('withdraw')}
              className="bg-[#FED36A] hover:brightness-110 active:scale-95 text-[#5C4020] text-[12px] font-black px-4 py-2 rounded-xl transition-all cursor-pointer shadow-md select-none text-center"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Transaction History Logs */}
        <div className="bg-[#03443C] p-4 rounded-2xl border border-[#023E37] shadow-xl flex-1 flex flex-col min-h-[250px]">
          <div className="flex items-center justify-between mb-3 select-none">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#FED36A]" />
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Transaction History</h4>
            </div>
            
            <button 
              onClick={() => { fetchTransactionLogs(); onRefreshBalance(); }}
              disabled={loading}
              className="text-[#3BA285] hover:text-[#FED36A] transition-colors cursor-pointer disabled:opacity-40 p-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[220px] no-scrollbar">
            {logs.map((item, idx) => {
              const isDep = item.type === 'deposit';
              const dateStr = new Date(item.data.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={idx} 
                  className="bg-[#02332C] border border-[#023E37] p-2.5 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Icon indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isDep ? 'bg-[#00C853]/10 text-[#00C853]' : 'bg-[#E53935]/10 text-[#E53935]'
                    }`}>
                      {isDep ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    {/* Transaction Text details */}
                    <div>
                      <p className="text-[12px] font-bold text-white capitalize leading-tight">
                        {isDep ? 'Deposit Received' : 'Withdrawal Request'}
                      </p>
                      <p className="text-[9px] text-[#B8CEC9] mt-0.5 leading-none flex items-center gap-1">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span className="font-mono">{isDep ? item.data.payment_method : item.data.payment_method}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Status Badge */}
                  <div className="text-right">
                    <p className={`text-[12px] font-bold ${isDep ? 'text-[#00C853]' : 'text-white'}`}>
                      {isDep ? '+' : '-'}Rs {item.data.amount}
                    </p>
                    {/* Status badges */}
                    <div className="mt-1 flex justify-end">
                      {item.data.status === 'pending' && (
                        <span className="text-[8px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded-full uppercase font-black">
                          Pending
                        </span>
                      )}
                      {item.data.status === 'approved' && (
                        <span className="text-[8px] bg-[#00C853]/10 text-[#00C853] border border-[#00C853]/25 px-2 py-0.5 rounded-full uppercase font-black">
                          Success
                        </span>
                      )}
                      {item.data.status === 'rejected' && (
                        <span className="text-[8px] bg-[#E53935]/10 text-[#E53935] border border-[#E53935]/25 px-2 py-0.5 rounded-full uppercase font-black">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {logs.length === 0 && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-white/30 select-none">
                <Clock className="w-8 h-8 stroke-1 mb-1.5" />
                <p className="text-[11px]">No transactions recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2">
          {userProfile.is_admin && (
            <button
              onClick={() => onNavigate('admin')}
              className="w-full bg-[#3BA285] hover:bg-[#3BA285]/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md select-none text-[13px] border border-emerald-500/30"
            >
              <Shield className="w-4 h-4 text-[#FED36A]" />
              <span>Open Admin Controller</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="w-full bg-red-600/10 hover:bg-red-600/20 text-[#E53935] border border-red-600/25 font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all select-none text-[13px] active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

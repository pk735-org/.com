import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Deposit, Withdrawal } from '../types';
import { ArrowLeft, Check, X, Shield, Users, ArrowDown, ArrowUp, Settings as SettingsIcon } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'settings'>('deposits');
  
  // Stats
  const [userCount, setUserCount] = useState(0);
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  
  // Settings form
  const [easypaisaNumber, setEasypaisaNumber] = useState('');
  const [easypaisaName, setEasypaisaName] = useState('');
  const [jazzcashNumber, setJazzcashNumber] = useState('');
  const [jazzcashName, setJazzcashName] = useState('');
  const [telegramLink, setTelegramLink] = useState('');

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user count
      const { count, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (!userError && count !== null) setUserCount(count);

      // 2. Fetch pending deposits
      const { data: depData, error: depError } = await supabase
        .from('deposits')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (!depError && depData) setPendingDeposits(depData);

      // 3. Fetch pending withdrawals
      const { data: wdData, error: wdError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (!wdError && wdData) setPendingWithdrawals(wdData);

      // 4. Fetch system settings
      const { data: setValues, error: setError } = await supabase
        .from('system_settings')
        .select('*');
      
      if (!setError && setValues) {
        setValues.forEach((item) => {
          if (item.key === 'easypaisa_number') setEasypaisaNumber(item.value);
          if (item.key === 'easypaisa_name') setEasypaisaName(item.value);
          if (item.key === 'jazzcash_number') setJazzcashNumber(item.value);
          if (item.key === 'jazzcash_name') setJazzcashName(item.value);
          if (item.key === 'telegram_link') setTelegramLink(item.value);
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveDeposit = async (dep: Deposit) => {
    setStatusMsg('');
    try {
      // Step 1: Update deposit status to approved
      const { error: depError } = await supabase
        .from('deposits')
        .update({ status: 'approved' })
        .eq('id', dep.id);

      if (depError) throw depError;

      // Step 2: Fetch current user profile details
      const { data: userProf, error: getError } = await supabase
        .from('profiles')
        .select('balance, welcome_bonus_claimed, referred_by')
        .eq('id', dep.user_id)
        .single();

      if (getError || !userProf) throw getError || new Error('User profile not found');

      // Step 3: Check if Welcome Bonus applies (deposit >= 300 and welcome_bonus_claimed is false)
      const shouldGiveWelcomeBonus = Number(dep.amount) >= 300 && !userProf.welcome_bonus_claimed;
      const welcomeBonusAmount = 735.00;
      
      let newBal = Number(userProf.balance) + Number(dep.amount);
      if (shouldGiveWelcomeBonus) {
        newBal += welcomeBonusAmount;
      }

      // Step 4: Update user profile balance and welcome_bonus_claimed flag
      const { error: balError } = await supabase
        .from('profiles')
        .update({ 
          balance: newBal,
          welcome_bonus_claimed: userProf.welcome_bonus_claimed || shouldGiveWelcomeBonus
        })
        .eq('id', dep.user_id);

      if (balError) throw balError;

      // Step 5: Check if user was referred by someone and apply 5% commission
      let commissionMsg = '';
      if (userProf.referred_by) {
        const commissionAmount = parseFloat((Number(dep.amount) * 0.05).toFixed(2));
        
        // Fetch referrer profile
        const { data: referrerProf, error: getRefError } = await supabase
          .from('profiles')
          .select('balance, referral_earnings')
          .eq('id', userProf.referred_by)
          .single();

        if (!getRefError && referrerProf) {
          const newRefBal = Number(referrerProf.balance) + commissionAmount;
          const newRefEarnings = Number(referrerProf.referral_earnings) + commissionAmount;

          // Update referrer profile
          await supabase
            .from('profiles')
            .update({ 
              balance: newRefBal,
              referral_earnings: newRefEarnings
            })
            .eq('id', userProf.referred_by);

          commissionMsg = ` (and Rs ${commissionAmount} commission credited to referrer)`;
        }
      }

      setStatusMsg(
        `Successfully approved Rs ${dep.amount} deposit for user ${dep.phone}${
          shouldGiveWelcomeBonus ? ` (Rs 735 Welcome Bonus credited!)` : ''
        }${commissionMsg}`
      );
      fetchAdminData();
    } catch (err: any) {
      setStatusMsg('Error: ' + err.message);
    }
  };

  const handleRejectDeposit = async (dep: Deposit) => {
    setStatusMsg('');
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ status: 'rejected' })
        .eq('id', dep.id);
      
      if (error) throw error;
      setStatusMsg(`Rejected deposit for TID: ${dep.transaction_id}`);
      fetchAdminData();
    } catch (err: any) {
      setStatusMsg('Error: ' + err.message);
    }
  };

  const handleApproveWithdrawal = async (wd: Withdrawal) => {
    setStatusMsg('');
    try {
      // Approve withdrawal request. User balance has already been deducted at insertion.
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'approved' })
        .eq('id', wd.id);

      if (error) throw error;
      setStatusMsg(`Successfully approved Rs ${wd.amount} withdrawal for user ${wd.phone}`);
      fetchAdminData();
    } catch (err: any) {
      setStatusMsg('Error: ' + err.message);
    }
  };

  const handleRejectWithdrawal = async (wd: Withdrawal) => {
    setStatusMsg('');
    try {
      // Reject withdrawal request. 
      // The Database trigger 'on_withdrawal_updated' will automatically refund the user's balance.
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'rejected' })
        .eq('id', wd.id);

      if (error) throw error;
      setStatusMsg(`Rejected withdrawal request. Rs ${wd.amount} has been refunded to ${wd.phone}`);
      fetchAdminData();
    } catch (err: any) {
      setStatusMsg('Error: ' + err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setLoading(true);

    try {
      const updates = [
        { key: 'easypaisa_number', value: easypaisaNumber.trim() },
        { key: 'easypaisa_name', value: easypaisaName.trim() },
        { key: 'jazzcash_number', value: jazzcashNumber.trim() },
        { key: 'jazzcash_name', value: jazzcashName.trim() },
        { key: 'telegram_link', value: telegramLink.trim() },
      ];

      for (const item of updates) {
        await supabase
          .from('system_settings')
          .upsert(item);
      }

      setStatusMsg('Settings successfully updated!');
    } catch (err: any) {
      setStatusMsg('Failed to save: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#04534A] pb-[80px] pt-[100px] flex flex-col px-4 overflow-y-auto">
      {/* Header title */}
      <div className="flex items-center gap-2 mb-4 select-none">
        <button 
          onClick={() => onNavigate('profile')}
          className="p-1 hover:bg-white/10 rounded-full text-[#B8CEC9] hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <Shield className="w-5 h-5 text-[#FED36A]" />
          <h2 className="text-white text-base font-bold">Admin Controller</h2>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5 mb-4 select-none">
        <div className="bg-[#03443C] border border-[#023E37] p-2.5 rounded-xl text-center shadow-md">
          <Users className="w-4 h-4 mx-auto text-[#FED36A] mb-1" />
          <span className="text-[8px] text-[#B8CEC9] uppercase block font-semibold">Total Players</span>
          <span className="text-[12px] font-black text-white font-mono block mt-0.5">{userCount}</span>
        </div>
        
        <div className="bg-[#03443C] border border-[#023E37] p-2.5 rounded-xl text-center shadow-md">
          <ArrowDown className="w-4 h-4 mx-auto text-[#00C853] mb-1" />
          <span className="text-[8px] text-[#B8CEC9] uppercase block font-semibold">Dep Pending</span>
          <span className="text-[12px] font-black text-white font-mono block mt-0.5">{pendingDeposits.length}</span>
        </div>

        <div className="bg-[#03443C] border border-[#023E37] p-2.5 rounded-xl text-center shadow-md">
          <ArrowUp className="w-4 h-4 mx-auto text-orange-400 mb-1" />
          <span className="text-[8px] text-[#B8CEC9] uppercase block font-semibold">Wd Pending</span>
          <span className="text-[12px] font-black text-white font-mono block mt-0.5">{pendingWithdrawals.length}</span>
        </div>
      </div>

      {/* Controller tabs */}
      <div className="flex border-b border-[#023E37] mb-4 select-none">
        <button
          onClick={() => { setActiveTab('deposits'); setStatusMsg(''); }}
          className={`flex-1 pb-2 text-[12px] font-bold text-center border-b-2 cursor-pointer ${
            activeTab === 'deposits' ? 'text-[#FED36A] border-[#FED36A]' : 'text-gray-400 border-transparent'
          }`}
        >
          Deposits
        </button>
        <button
          onClick={() => { setActiveTab('withdrawals'); setStatusMsg(''); }}
          className={`flex-1 pb-2 text-[12px] font-bold text-center border-b-2 cursor-pointer ${
            activeTab === 'withdrawals' ? 'text-[#FED36A] border-[#FED36A]' : 'text-gray-400 border-transparent'
          }`}
        >
          Withdrawals
        </button>
        <button
          onClick={() => { setActiveTab('settings'); setStatusMsg(''); }}
          className={`flex-1 pb-2 text-[12px] font-bold text-center border-b-2 cursor-pointer ${
            activeTab === 'settings' ? 'text-[#FED36A] border-[#FED36A]' : 'text-gray-400 border-transparent'
          }`}
        >
          Gateways
        </button>
      </div>

      {/* Info status popup */}
      {statusMsg && (
        <div className="mb-4 bg-[#02332C] border border-[#FED36A]/30 text-white text-[11px] px-3 py-2 rounded-lg font-medium select-none shadow">
          {statusMsg}
        </div>
      )}

      {/* 1. DEPOSITS MANAGER */}
      {activeTab === 'deposits' && (
        <div className="flex flex-col gap-3">
          {pendingDeposits.map((dep) => {
            const dateStr = new Date(dep.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            return (
              <div key={dep.id} className="bg-[#03443C] border border-[#023E37] p-3.5 rounded-xl flex flex-col gap-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-[#023E37] pb-1.5 select-none">
                  <div>
                    <span className="text-[10px] text-[#B8CEC9]">Player Phone</span>
                    <p className="text-[13px] text-white font-bold leading-tight font-mono">{dep.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#B8CEC9]">Amount</span>
                    <p className="text-[14px] text-[#FED36A] font-black leading-tight">Rs {dep.amount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10.5px] select-none">
                  <div>
                    <span className="text-[#B8CEC9]">Method:</span>
                    <span className="text-white font-bold ml-1">{dep.payment_method}</span>
                  </div>
                  <div>
                    <span className="text-[#B8CEC9]">Sender Account:</span>
                    <span className="text-white font-bold ml-1 font-mono">{dep.sender_account}</span>
                  </div>
                  <div className="col-span-2 mt-0.5">
                    <span className="text-[#B8CEC9]">Transaction ID (TID):</span>
                    <span className="text-[#FFE600] font-black ml-1 font-mono text-[11.5px] select-all bg-[#02332C] px-2 py-0.5 rounded border border-[#023E37]">{dep.transaction_id}</span>
                  </div>
                  <div className="col-span-2 text-white/50 text-[9px] mt-0.5">
                    Date Submitted: {dateStr}
                  </div>
                </div>

                {/* Approve/Reject Buttons */}
                <div className="flex gap-2.5 mt-1 border-t border-[#023E37] pt-2">
                  <button
                    onClick={() => handleRejectDeposit(dep)}
                    className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-[#E53935] border border-red-600/20 py-2 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all select-none"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleApproveDeposit(dep)}
                    className="flex-1 bg-[#00C853] hover:brightness-110 text-white py-2 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all select-none"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            );
          })}

          {pendingDeposits.length === 0 && (
            <div className="py-12 text-center text-white/30 text-[11px] select-none">
              No pending deposits requests.
            </div>
          )}
        </div>
      )}

      {/* 2. WITHDRAWALS MANAGER */}
      {activeTab === 'withdrawals' && (
        <div className="flex flex-col gap-3">
          {pendingWithdrawals.map((wd) => {
            const dateStr = new Date(wd.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            return (
              <div key={wd.id} className="bg-[#03443C] border border-[#023E37] p-3.5 rounded-xl flex flex-col gap-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-[#023E37] pb-1.5 select-none">
                  <div>
                    <span className="text-[10px] text-[#B8CEC9]">Player Phone</span>
                    <p className="text-[13px] text-white font-bold leading-tight font-mono">{wd.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#B8CEC9]">Amount</span>
                    <p className="text-[14px] text-orange-400 font-black leading-tight">Rs {wd.amount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10.5px] select-none">
                  <div>
                    <span className="text-[#B8CEC9]">Method:</span>
                    <span className="text-white font-bold ml-1">{wd.payment_method}</span>
                  </div>
                  <div>
                    <span className="text-[#B8CEC9]">Recipient Title:</span>
                    <span className="text-[#FED36A] font-bold ml-1">{wd.receiver_name}</span>
                  </div>
                  <div className="col-span-2 mt-0.5">
                    <span className="text-[#B8CEC9]">Receiver Wallet Phone:</span>
                    <span className="text-white font-bold ml-1 font-mono text-[11.5px] select-all bg-[#02332C] px-2 py-0.5 rounded border border-[#023E37]">{wd.receiver_account}</span>
                  </div>
                  <div className="col-span-2 text-white/50 text-[9px] mt-0.5">
                    Date Submitted: {dateStr}
                  </div>
                </div>

                {/* Approve/Reject Buttons */}
                <div className="flex gap-2.5 mt-1 border-t border-[#023E37] pt-2">
                  <button
                    onClick={() => handleRejectWithdrawal(wd)}
                    className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-[#E53935] border border-red-600/20 py-2 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all select-none"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject (Refund)</span>
                  </button>

                  <button
                    onClick={() => handleApproveWithdrawal(wd)}
                    className="flex-1 bg-[#00C853] hover:brightness-110 text-white py-2 rounded-lg font-bold text-[11px] cursor-pointer flex items-center justify-center gap-1 active:scale-95 transition-all select-none"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Paid</span>
                  </button>
                </div>
              </div>
            );
          })}

          {pendingWithdrawals.length === 0 && (
            <div className="py-12 text-center text-white/30 text-[11px] select-none">
              No pending withdrawal requests.
            </div>
          )}
        </div>
      )}

      {/* 3. SETTINGS / GATEWAY CONFIG */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-[#03443C] p-4 rounded-xl border border-[#023E37] shadow-md flex flex-col gap-4">
          <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-[#023E37] pb-2 select-none">
            <SettingsIcon className="w-4 h-4 text-[#FED36A]" />
            <span>Deposit Wallet Settings</span>
          </h3>

          {/* EasyPaisa inputs */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-[11px] text-[#00C853] font-bold uppercase select-none">EasyPaisa Account</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[#B8CEC9] uppercase select-none">Number</label>
                <input
                  type="text"
                  value={easypaisaNumber}
                  onChange={(e) => setEasypaisaNumber(e.target.value)}
                  required
                  className="h-[38px] bg-[#02332C] border border-white/5 rounded-lg px-2.5 text-[12px] text-white font-semibold focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[#B8CEC9] uppercase select-none">Account Name</label>
                <input
                  type="text"
                  value={easypaisaName}
                  onChange={(e) => setEasypaisaName(e.target.value)}
                  required
                  className="h-[38px] bg-[#02332C] border border-white/5 rounded-lg px-2.5 text-[12px] text-white font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* JazzCash inputs */}
          <div className="flex flex-col gap-2.5 border-t border-[#023E37] pt-3">
            <h4 className="text-[11px] text-orange-400 font-bold uppercase select-none">JazzCash Account</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[#B8CEC9] uppercase select-none">Number</label>
                <input
                  type="text"
                  value={jazzcashNumber}
                  onChange={(e) => setJazzcashNumber(e.target.value)}
                  required
                  className="h-[38px] bg-[#02332C] border border-white/5 rounded-lg px-2.5 text-[12px] text-white font-semibold focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-[#B8CEC9] uppercase select-none">Account Name</label>
                <input
                  type="text"
                  value={jazzcashName}
                  onChange={(e) => setJazzcashName(e.target.value)}
                  required
                  className="h-[38px] bg-[#02332C] border border-white/5 rounded-lg px-2.5 text-[12px] text-white font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Telegram link */}
          <div className="flex flex-col gap-1.5 border-t border-[#023E37] pt-3">
            <h4 className="text-[11px] text-[#FED36A] font-bold uppercase select-none">Telegram Support Link</h4>
            <input
              type="text"
              value={telegramLink}
              onChange={(e) => setTelegramLink(e.target.value)}
              required
              className="h-[38px] bg-[#02332C] border border-white/5 rounded-lg px-2.5 text-[12px] text-white focus:outline-none"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FED36A] hover:brightness-110 active:scale-95 text-[#5C4020] font-black py-2.5 rounded-xl shadow-md mt-2 cursor-pointer transition-all select-none text-[12px] uppercase disabled:opacity-60"
          >
            Save Gateway Configuration
          </button>
        </form>
      )}
    </div>
  );
};

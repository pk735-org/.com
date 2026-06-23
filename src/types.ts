export interface Profile {
  id: string;
  phone: string;
  balance: number;
  vip_level: number;
  is_admin: boolean;
  created_at: string;
  referred_by?: string | null;
  referral_earnings: number;
  welcome_bonus_claimed: boolean;
  last_check_in?: string | null;
}

export interface Deposit {
  id: string;
  user_id: string;
  phone: string;
  amount: number;
  payment_method: string;
  sender_account: string;
  transaction_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  phone: string;
  amount: number;
  payment_method: string;
  receiver_account: string;
  receiver_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface SystemSettings {
  easypaisa_number: string;
  easypaisa_name: string;
  jazzcash_number: string;
  jazzcash_name: string;
  telegram_link: string;
}

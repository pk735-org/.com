-- ====================================================================
-- PK735 DATABASE SCHEMA SETUP
-- Paste this script into the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ====================================================================

-- 1. Create Profiles Table (Stores player stats)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  vip_level INTEGER DEFAULT 1 NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies for Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can do everything on profiles" ON public.profiles
  FOR ALL USING (
    COALESCE(
      (SELECT is_admin FROM public.profiles WHERE id = auth.uid()), 
      false
    )
  );


-- 2. Create Deposits Table
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL, -- User's phone
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'EasyPaisa' or 'JazzCash'
  sender_account TEXT NOT NULL, -- User's wallet number
  transaction_id TEXT UNIQUE NOT NULL, -- 11-digit TID
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Policies for Deposits
CREATE POLICY "Users can view their own deposits" ON public.deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deposits" ON public.deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on deposits" ON public.deposits
  FOR ALL USING (
    COALESCE(
      (SELECT is_admin FROM public.profiles WHERE id = auth.uid()), 
      false
    )
  );


-- 3. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL, -- User's phone
  amount NUMERIC(12, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'EasyPaisa' or 'JazzCash'
  receiver_account TEXT NOT NULL, -- Target wallet number
  receiver_name TEXT NOT NULL, -- Target wallet name
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies for Withdrawals
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on withdrawals" ON public.withdrawals
  FOR ALL USING (
    COALESCE(
      (SELECT is_admin FROM public.profiles WHERE id = auth.uid()), 
      false
    )
  );


-- 4. Create System Settings Table (Stores active payment numbers, support links, etc.)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for System Settings
CREATE POLICY "Anyone can read system settings" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can edit system settings" ON public.system_settings
  FOR ALL USING (
    COALESCE(
      (SELECT is_admin FROM public.profiles WHERE id = auth.uid()), 
      false
    )
  );


-- 5. Automatically create profile when a user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  phone_val TEXT;
BEGIN
  -- If phone is empty (using email login formatted as phone@pk735.org), extract phone
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' THEN
    phone_val := NEW.phone;
  ELSE
    phone_val := SPLIT_PART(NEW.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (id, phone, balance, vip_level, is_admin)
  VALUES (
    NEW.id,
    phone_val,
    0.00,
    1,
    -- Make first user admin by default for convenience, or false
    CASE WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger linked to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Note: If you get syntax error on EXECURE, change to EXECUTE


-- 6. Insert Default settings
INSERT INTO public.system_settings (key, value) VALUES
  ('easypaisa_number', '03001234567'),
  ('easypaisa_name', 'M. Khalil'),
  ('jazzcash_number', '03127654321'),
  ('jazzcash_name', 'Babar Azam'),
  ('telegram_link', 'https://t.me/pk735_support')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- 7. Trigger to automatically deduct balance when a withdrawal is submitted
CREATE OR REPLACE FUNCTION public.process_withdrawal_deduction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET balance = balance - NEW.amount
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_withdrawal_created
  AFTER INSERT ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.process_withdrawal_deduction();


-- 8. Trigger to automatically refund balance when a withdrawal is rejected
CREATE OR REPLACE FUNCTION public.process_withdrawal_refund()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    UPDATE public.profiles
    SET balance = balance + NEW.amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_withdrawal_updated
  AFTER UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.process_withdrawal_refund();


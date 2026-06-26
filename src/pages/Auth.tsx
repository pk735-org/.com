import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { KeyRound, Phone, AlertCircle, Loader, Eye, EyeOff, Gift, CheckCircle, ArrowRight } from 'lucide-react';

interface AuthProps {
  onNavigate: (page: string) => void;
  onAuthSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onNavigate, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referred_by', ref);
      setReferralCode(ref);
    } else {
      const stored = localStorage.getItem('referred_by');
      if (stored) setReferralCode(stored);
    }
  }, []);

  const validatePhone = (num: string) => {
    return /^(03|3)\d{9}$/.test(num.trim());
  };

  const switchTab = (login: boolean) => {
    setIsLogin(login);
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedPhone = phone.trim();
    if (!validatePhone(trimmedPhone)) {
      setErrorMsg('Valid Pakistani mobile number daalen (maslan: 03001234567).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password kam az kam 6 characters ka hona chahiye.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMsg('Passwords match nahi kar rahe. Dobara check karein.');
      return;
    }

    const mockEmail = `${trimmedPhone}@pk735.org`;

    setLoading(true);

    try {
      if (isLogin) {
        // ── SIGN IN ──
        const { error } = await supabase.auth.signInWithPassword({
          email: mockEmail,
          password: password,
        });

        if (error) {
          const code = (error as any).code || '';
          if (code === 'invalid_credentials' || error.message === 'Invalid login credentials') {
            setErrorMsg('Phone number ya password galat hai. Dobara try karein.');
          } else if (code === 'email_not_confirmed') {
            setErrorMsg('Account confirm nahi hua. Admin se contact karein ya baad mein try karein.');
          } else if (code === 'user_not_found') {
            setErrorMsg('Yeh number register nahi hai. Pehle Register karein.');
          } else {
            setErrorMsg(error.message);
          }
        } else {
          setSuccessMsg('Login kamyab! Redirect ho rahe hain...');
          setTimeout(() => {
            onAuthSuccess();
            onNavigate('home');
          }, 800);
        }
      } else {
        // ── SIGN UP ──
        const referrerPhone = referralCode.trim() || localStorage.getItem('referred_by') || null;

        const { data: signUpData, error } = await supabase.auth.signUp({
          email: mockEmail,
          password: password,
          options: {
            data: {
              phone: trimmedPhone,
              referred_by: referrerPhone || null,
            },
          },
        });

        if (error) {
          const code = (error as any).code || '';
          if (code === 'signup_disabled') {
            setErrorMsg('Registration filhal band hai. Admin se rabta karein.');
          } else if (code === 'user_already_exists' || error.message.includes('already registered') || error.message.includes('already been registered')) {
            setErrorMsg('Yeh number pehle se register hai. Login karein.');
          } else if (code === 'weak_password') {
            setErrorMsg('Password zyada mushkil rakhein (letters + numbers + symbols).');
          } else {
            setErrorMsg(error.message);
          }
        } else if (signUpData?.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
          setErrorMsg('Yeh number pehle se register hai. Login karein.');
        } else {
          // Auto sign-in after sign up
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: mockEmail,
            password: password,
          });

          if (loginError) {
            const loginCode = (loginError as any).code || '';
            if (loginCode === 'email_not_confirmed') {
              setErrorMsg('Account ban gaya! Lekin email confirmation ON hai. Admin se "Confirm email" band karwane ko bolein.');
            } else {
              setErrorMsg('Account ban gaya lekin login fail hua: ' + loginError.message);
            }
          } else {
            localStorage.removeItem('referred_by');
            setSuccessMsg('🎉 Account ban gaya! Rs 735 bonus claim karein!');
            setTimeout(() => {
              onAuthSuccess();
              onNavigate('home');
            }, 1000);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg('Kuch masla hua. Internet connection check karein.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#04534A] pb-[80px] pt-[100px] flex flex-col justify-center px-6">
      <div className="w-full max-w-[400px] mx-auto bg-[#03443C] p-6 rounded-2xl border border-[#023E37] shadow-xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 select-none">
          <div className="w-16 h-16 rounded-full bg-[#02332C] border border-[#FED36A]/20 flex items-center justify-center mb-2 shadow-inner">
            <span className="text-[#FED36A] font-black text-2xl italic">PK</span>
          </div>
          <h2 className="text-[18px] font-black text-white uppercase tracking-wider">
            PK735 Lobby
          </h2>
          <p className="text-[11px] text-[#B8CEC9] mt-0.5">
            {isLogin ? 'Sign in to access your wallet & play' : 'Create an account to claim Rs 735 bonus'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-[#023E37] mb-6 select-none">
          <button
            type="button"
            onClick={() => switchTab(true)}
            className={`flex-1 pb-3 text-[14px] font-bold text-center border-b-2 cursor-pointer transition-colors ${
              isLogin ? 'text-[#FED36A] border-[#FED36A]' : 'text-gray-400 border-transparent'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchTab(false)}
            className={`flex-1 pb-3 text-[14px] font-bold text-center border-b-2 cursor-pointer transition-colors ${
              !isLogin ? 'text-[#FED36A] border-[#FED36A]' : 'text-gray-400 border-transparent'
            }`}
          >
            Register
          </button>
        </div>

        {/* Bonus Banner (only on signup) */}
        {!isLogin && (
          <div className="mb-4 bg-gradient-to-r from-[#00C853]/10 to-[#FED36A]/5 border border-[#00C853]/20 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00C853]/20 flex items-center justify-center shrink-0">
              <Gift className="w-4.5 h-4.5 text-[#00C853]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#FED36A] uppercase tracking-wide leading-none">Welcome Bonus!</p>
              <p className="text-[9.5px] text-[#B8CEC9] leading-tight mt-1">Pehli baar register karein aur <span className="text-[#00C853] font-bold">Rs 735</span> ka bonus payen!</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 bg-[#E53935]/15 border border-[#E53935]/30 text-[#FF6B6B] text-[11px] px-3 py-2 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="mb-4 bg-[#00C853]/15 border border-[#00C853]/30 text-[#00C853] text-[11px] px-3 py-2 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          
          {/* Phone Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#B8CEC9] uppercase font-bold tracking-wider px-1">
              Phone Number
            </label>
            <div className={`relative w-full h-[45px] bg-[#02332C] border rounded-xl flex items-center px-3 gap-2 transition-colors ${
              phone && !validatePhone(phone) ? 'border-[#E53935]/50' : 'border-[#023E37] focus-within:border-[#FED36A]/50'
            }`}>
              <div className="flex items-center gap-1.5 border-r border-[#023E37] pr-2.5 shrink-0 select-none">
                <span className="text-[12px]">🇵🇰</span>
                <span className="text-[11px] text-[#B8CEC9] font-bold">+92</span>
              </div>
              <Phone className="w-4 h-4 text-[#3BA285] shrink-0" />
              <input
                id="auth-phone"
                type="tel"
                placeholder="03001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                required
                disabled={loading}
                maxLength={11}
                className="bg-transparent border-none text-white text-[13px] w-full focus:outline-none placeholder-white/20 font-semibold"
              />
              {phone.length === 11 && validatePhone(phone) && (
                <CheckCircle className="w-4 h-4 text-[#00C853] shrink-0" />
              )}
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#B8CEC9] uppercase font-bold tracking-wider px-1">
              Password
            </label>
            <div className="relative w-full h-[45px] bg-[#02332C] border border-[#023E37] rounded-xl flex items-center px-3 gap-2 focus-within:border-[#FED36A]/50 transition-colors">
              <KeyRound className="w-4 h-4 text-[#3BA285] shrink-0" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-transparent border-none text-white text-[13px] w-full focus:outline-none placeholder-white/20 font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#6a9e91] hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Signup only) */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#B8CEC9] uppercase font-bold tracking-wider px-1">
                Confirm Password
              </label>
              <div className={`relative w-full h-[45px] bg-[#02332C] border rounded-xl flex items-center px-3 gap-2 transition-colors ${
                confirmPassword && confirmPassword !== password ? 'border-[#E53935]/50' : 'border-[#023E37] focus-within:border-[#FED36A]/50'
              }`}>
                <KeyRound className="w-4 h-4 text-[#3BA285] shrink-0" />
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Password dobara daalen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-transparent border-none text-white text-[13px] w-full focus:outline-none placeholder-white/20 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-[#6a9e91] hover:text-white transition-colors shrink-0 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="text-[10px] text-[#E53935] px-1">Passwords match nahi kar rahe</p>
              )}
            </div>
          )}

          {/* Referral Code (Signup only) */}
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#B8CEC9] uppercase font-bold tracking-wider px-1">
                Referral Code (Optional)
              </label>
              <div className="relative w-full h-[45px] bg-[#02332C] border border-[#023E37] rounded-xl flex items-center px-3 gap-2 focus-within:border-[#FED36A]/50 transition-colors">
                <Gift className="w-4 h-4 text-[#3BA285] shrink-0" />
                <input
                  id="auth-referral"
                  type="tel"
                  placeholder="Referrer ka phone number"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  disabled={loading}
                  className="bg-transparent border-none text-white text-[13px] w-full focus:outline-none placeholder-white/20 font-semibold"
                />
                {referralCode && (
                  <span className="text-[10px] text-[#00C853] font-bold shrink-0">Applied ✓</span>
                )}
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            id="auth-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FED36A] to-[#F5B041] hover:brightness-110 active:scale-[0.98] text-[#5C4020] font-black py-3 rounded-xl shadow-lg mt-2 cursor-pointer flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-[13px] tracking-wide"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-[#5C4020]" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Sign Up & Get Rs 735'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-4 flex flex-col items-center gap-2 select-none">
          <p className="text-[11px] text-[#B8CEC9]">
            {isLogin ? "Account nahi hai? " : "Pehle se account hai? "}
            <button
              type="button"
              onClick={() => switchTab(!isLogin)}
              className="text-[#FED36A] font-bold underline cursor-pointer hover:text-white transition-colors"
            >
              {isLogin ? 'Register karein' : 'Login karein'}
            </button>
          </p>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-[11px] text-[#3BA285] hover:text-[#FED36A] underline cursor-pointer transition-colors"
          >
            ← Wapas Lobby mein jayen
          </button>
        </div>

      </div>
    </div>
  );
};

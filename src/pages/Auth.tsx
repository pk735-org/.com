import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { KeyRound, Phone, AlertCircle, Loader } from 'lucide-react';

interface AuthProps {
  onNavigate: (page: string) => void;
  onAuthSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onNavigate, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhone = (num: string) => {
    // Regex for typical Pakistan phone numbers (e.g. 03XXXXXXXXX or 3XXXXXXXXX)
    return /^(03|3)\d{9}$/.test(num.trim());
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedPhone = phone.trim();
    if (!validatePhone(trimmedPhone)) {
      setErrorMsg('Please enter a valid Pakistani mobile number (e.g., 03001234567).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    // Convert phone to email for serverless Supabase Auth
    // E.g., "03001234567" -> "03001234567@pk735.org"
    const mockEmail = `${trimmedPhone}@pk735.org`;

    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email: mockEmail,
          password: password,
        });

        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' 
            ? 'Incorrect phone number or password.' 
            : error.message
          );
        } else {
          onAuthSuccess();
          onNavigate('home');
        }
      } else {
        // Sign Up (Register)
        const { error } = await supabase.auth.signUp({
          email: mockEmail,
          password: password,
          options: {
            data: {
              phone: trimmedPhone
            }
          }
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          // Alert user and automatically log them in
          // Since email confirm is on by default, let's try to sign them in.
          // If it fails, they might need to turn off "Confirm email" in Supabase Auth settings.
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: mockEmail,
            password: password,
          });

          if (loginError) {
            setErrorMsg(
              'Account created! Please make sure "Confirm email" is DISABLED in your Supabase Auth settings so you can log in immediately.'
            );
          } else {
            onAuthSuccess();
            onNavigate('home');
          }
        }
      }
    } catch (err: any) {
      setErrorMsg('Something went wrong. Please check your internet connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#04534A] pb-[80px] pt-[100px] flex flex-col justify-center px-6">
      <div className="w-full max-w-[400px] mx-auto bg-[#03443C] p-6 rounded-2xl border border-[#023E37] shadow-xl">
        {/* Brand/Logo */}
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
        <div className="flex border-b border-[#023E37] mb-6">
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`flex-1 pb-3 text-[14px] font-bold text-center border-b-2 cursor-pointer transition-colors ${
              isLogin ? 'text-[#FED36A] border-[#FED36A]' : 'text-gray-400 border-transparent'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`flex-1 pb-3 text-[14px] font-bold text-center border-b-2 cursor-pointer transition-colors ${
              !isLogin ? 'text-[#FED36A] border-[#FED36A]' : 'text-gray-400 border-transparent'
            }`}
          >
            Register
          </button>
        </div>

        {/* Errors display */}
        {errorMsg && (
          <div className="mb-4 bg-[#E53935]/15 border border-[#E53935]/30 text-[#E53935] text-[11px] px-3 py-2 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {/* Phone Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#B8CEC9] uppercase font-bold tracking-wider">
              Phone Number
            </label>
            <div className="relative w-full h-[45px] bg-[#02332C] border border-[#023E37] rounded-xl flex items-center px-3 gap-2 focus-within:border-[#FED36A]/50 transition-colors">
              <Phone className="w-4 h-4 text-[#3BA285]" />
              <input
                type="tel"
                placeholder="03001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                required
                disabled={loading}
                className="bg-transparent border-none text-white text-[13px] w-full focus:outline-none placeholder-white/20 font-semibold"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#B8CEC9] uppercase font-bold tracking-wider">
              Password
            </label>
            <div className="relative w-full h-[45px] bg-[#02332C] border border-[#023E37] rounded-xl flex items-center px-3 gap-2 focus-within:border-[#FED36A]/50 transition-colors">
              <KeyRound className="w-4 h-4 text-[#3BA285]" />
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-transparent border-none text-white text-[13px] w-full focus:outline-none placeholder-white/20"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FED36A] to-[#F5B041] hover:brightness-110 active:scale-98 text-[#5C4020] font-black py-3 rounded-xl shadow-lg mt-2 cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin text-[#5C4020]" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Sign Up & Get Rs 735'}</span>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="text-[11px] text-[#3BA285] hover:text-[#FED36A] underline cursor-pointer"
          >
            Back to Home Lobby
          </button>
        </div>
      </div>
    </div>
  );
};

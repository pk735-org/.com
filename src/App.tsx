import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Profile } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Deposit } from './pages/Deposit';
import { Withdraw } from './pages/Withdraw';
import { Profile as ProfilePage } from './pages/Profile';
import { Invite } from './pages/Invite';
import { Offers } from './pages/Offers';
import { Support } from './pages/Support';
import { AdminDashboard } from './pages/AdminDashboard';
import { AviatorGame } from './components/AviatorGame';
import { 
  X, Home as HomeIcon, Wallet, CreditCard, Users, Gift, MessageCircle, Shield, LogOut, LogIn, User
} from 'lucide-react';

function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [showAviator, setShowAviator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);

  const fetchUserProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (data && !error) {
        setUserProfile(data);
      } else if (error) {
        console.error('Error fetching profile:', error.message);
      }
    } catch (err) {
      console.error('Error in profile fetch:', err);
    }
  };

  const handleRefreshBalance = () => {
    if (userProfile) {
      fetchUserProfile(userProfile.id);
    }
  };

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Set up listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (page: string) => {
    if (page === 'menu') {
      setShowDrawer(true);
      return;
    }
    // Protected routes: redirect to Auth if not logged in
    const protectedPages = ['deposit', 'withdraw', 'profile', 'admin'];
    if (!userProfile && protectedPages.includes(page)) {
      setCurrentPage('auth');
    } else {
      setCurrentPage(page);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setCurrentPage('home');
  };

  const handlePlayGame = (gameId: string) => {
    if (!userProfile) {
      // User must login to play
      setCurrentPage('auth');
    } else {
      if (gameId === 'aviator') {
        setShowAviator(true);
      } else {
        // Other games just pop up a mock slots/mines message or we can run mini-games!
        alert(`Launching ${gameId === 'slots' ? 'Money Slots' : gameId === 'fortune' ? 'Fortune Tiger' : 'Mines Cashout'} Lobby! Placed under category slots.`);
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#04534A]">
        <div className="relative flex flex-col items-center select-none animate-pulse">
          <div className="w-20 h-20 bg-[#02332C] rounded-full border border-[#FED36A]/20 flex items-center justify-center shadow-lg mb-4">
            <span className="text-[#FED36A] font-black text-3xl italic">PK</span>
          </div>
          <p className="text-white text-xs font-bold uppercase tracking-widest mt-1">
            Loading Premium Experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-[500px] mx-auto min-h-screen bg-[#0A0A0A] flex flex-col shadow-2xl relative">
      {/* Global Header */}
      <Header
        userProfile={userProfile}
        onNavigate={handleNavigate}
      />

      {/* Main Pages Router Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {currentPage === 'home' && (
          <Home
            userProfile={userProfile}
            onNavigate={handleNavigate}
            onPlayGame={handlePlayGame}
          />
        )}
        {currentPage === 'auth' && (
          <Auth
            onNavigate={handleNavigate}
            onAuthSuccess={handleRefreshBalance}
          />
        )}
        {currentPage === 'deposit' && userProfile && (
          <Deposit
            userProfile={userProfile}
            onNavigate={handleNavigate}
            onRefreshBalance={handleRefreshBalance}
          />
        )}
        {currentPage === 'withdraw' && userProfile && (
          <Withdraw
            userProfile={userProfile}
            onNavigate={handleNavigate}
            onRefreshBalance={handleRefreshBalance}
          />
        )}
        {currentPage === 'profile' && userProfile && (
          <ProfilePage
            userProfile={userProfile}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            onRefreshBalance={handleRefreshBalance}
          />
        )}
        {currentPage === 'invite' && (
          <Invite userProfile={userProfile} />
        )}
        {currentPage === 'offers' && (
          <Offers
            userProfile={userProfile}
            onNavigate={handleNavigate}
            onRefreshBalance={handleRefreshBalance}
          />
        )}
        {currentPage === 'support' && (
          <Support onNavigate={handleNavigate} />
        )}
        {currentPage === 'admin' && userProfile?.is_admin && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}
      </div>

      {/* Global Sticky Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isAdmin={userProfile?.is_admin || false}
      />

      {/* Sliding Left Navigation Drawer */}
      <div 
        className={`fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          showDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setShowDrawer(false)}
      >
        <div 
          className={`absolute top-0 left-0 w-[280px] h-full bg-[#044D45] border-r border-[#023E37] shadow-2xl flex flex-col transition-transform duration-300 ease-out select-none ${
            showDrawer ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-4 bg-[#02332C] border-b border-[#023E37] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#03443C] border border-[#FED36A]/20 flex items-center justify-center shadow-inner">
                <span className="text-[#FED36A] font-black text-sm italic">PK</span>
              </div>
              <span className="text-white font-black text-[14px] uppercase tracking-wider">PK735 Navigation</span>
            </div>
            <button 
              onClick={() => setShowDrawer(false)}
              className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card (Inside Drawer) */}
          <div className="p-4 bg-[#03443C] border-b border-[#023E37] flex flex-col gap-2">
            {userProfile ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#02332C] flex items-center justify-center text-white border border-[#FED36A]/20">
                    <User className="w-5 h-5 text-[#FED36A]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#B8CEC9] uppercase leading-none font-bold">Logged In</p>
                    <p className="text-[12.5px] text-white font-bold leading-tight font-mono mt-0.5">{userProfile.phone}</p>
                  </div>
                </div>
                
                <div className="bg-[#02332C] p-2.5 rounded-lg border border-[#023E37] mt-1.5 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-[#B8CEC9] uppercase block leading-none font-semibold">Lobby Balance</span>
                    <span className="text-[14px] font-black text-[#FED36A] block mt-1 font-mono">
                      Rs {userProfile.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button 
                    onClick={() => { setShowDrawer(false); handleNavigate('deposit'); }}
                    className="bg-[#00C853] hover:brightness-110 text-white text-[11px] font-bold px-3 py-1.5 rounded-md transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    Deposit
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2.5 text-center gap-2">
                <p className="text-[11px] text-[#B8CEC9] leading-snug">Sign in to access your wallet, claim bonuses, and play games.</p>
                <button
                  onClick={() => { setShowDrawer(false); handleNavigate('auth'); }}
                  className="w-full bg-gradient-to-r from-[#FED36A] to-[#F5B041] hover:brightness-110 text-[#5C4020] text-[12px] font-black py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login / Join Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1.5">
            <button
              onClick={() => { setShowDrawer(false); handleNavigate('home'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all ${
                currentPage === 'home' ? 'bg-[#FED36A] text-[#5C4020]' : 'text-[#B8CEC9] hover:bg-white/5 hover:text-white'
              }`}
            >
              <HomeIcon className="w-4.5 h-4.5" />
              <span>Lobby Home</span>
            </button>

            {userProfile && (
              <>
                <button
                  onClick={() => { setShowDrawer(false); handleNavigate('deposit'); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all ${
                    currentPage === 'deposit' ? 'bg-[#FED36A] text-[#5C4020]' : 'text-[#B8CEC9] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Wallet className="w-4.5 h-4.5" />
                  <span>Deposit Funds</span>
                </button>

                <button
                  onClick={() => { setShowDrawer(false); handleNavigate('withdraw'); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all ${
                    currentPage === 'withdraw' ? 'bg-[#FED36A] text-[#5C4020]' : 'text-[#B8CEC9] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4.5 h-4.5" />
                  <span>Withdraw Funds</span>
                </button>
              </>
            )}

            <button
              onClick={() => { setShowDrawer(false); handleNavigate('invite'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all ${
                currentPage === 'invite' ? 'bg-[#FED36A] text-[#5C4020]' : 'text-[#B8CEC9] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>Refer & Earn (5%)</span>
            </button>

            <button
              onClick={() => { setShowDrawer(false); handleNavigate('offers'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all ${
                currentPage === 'offers' ? 'bg-[#FED36A] text-[#5C4020]' : 'text-[#B8CEC9] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Gift className="w-4.5 h-4.5" />
              <span>Lucky Spin & Daily Bonus</span>
            </button>

            <button
              onClick={() => { setShowDrawer(false); handleNavigate('support'); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all ${
                currentPage === 'support' ? 'bg-[#FED36A] text-[#5C4020]' : 'text-[#B8CEC9] hover:bg-white/5 hover:text-white'
              }`}
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>Live Support Chat</span>
            </button>

            {userProfile?.is_admin && (
              <button
                onClick={() => { setShowDrawer(false); handleNavigate('admin'); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-bold text-left transition-all ${
                  currentPage === 'admin' ? 'bg-orange-500 text-white' : 'text-orange-400 hover:bg-orange-500/5'
                }`}
              >
                <Shield className="w-4.5 h-4.5" />
                <span>Admin Controller</span>
              </button>
            )}
          </div>

          {/* Download Bonus Banner & Footer inside Drawer */}
          <div className="p-4 bg-[#02332C] border-t border-[#023E37] flex flex-col gap-3">
            <div className="bg-[#03443C] p-2.5 rounded-lg border border-[#023E37] flex items-center justify-between">
              <span className="text-[10px] text-[#B8CEC9] font-medium leading-tight">Get Rs735 Download Bonus</span>
              <button 
                onClick={() => window.open('https://www.pk735.org/download', '_blank')}
                className="bg-[#00C853] hover:brightness-110 text-white text-[9.5px] font-bold px-2 py-1 rounded cursor-pointer transition-all active:scale-95"
              >
                Get App
              </button>
            </div>

            {userProfile && (
              <button
                onClick={() => { setShowDrawer(false); handleLogout(); }}
                className="w-full bg-red-600/10 hover:bg-red-600/20 text-[#E53935] border border-red-600/20 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Modal Game Overlays */}
      {showAviator && userProfile && (
        <AviatorGame
          userProfile={userProfile}
          onClose={() => setShowAviator(false)}
          onRefreshBalance={handleRefreshBalance}
        />
      )}
    </div>
  );
}

export default App;

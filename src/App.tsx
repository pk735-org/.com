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

function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [showAviator, setShowAviator] = useState(false);
  const [loading, setLoading] = useState(true);

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

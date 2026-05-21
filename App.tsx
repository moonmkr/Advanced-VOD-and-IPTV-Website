import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Background3D from './components/Background3D';
import ChatBot from './components/ChatBot';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Watch from './pages/Watch';
import Login from './pages/Login';
import Register from './pages/Register';
import RequestContent from './pages/RequestContent';
import { Settings } from './pages/Settings';
import { Zap, LayoutGrid, Radio, User as UserIcon, LogOut, MessageSquarePlus, Settings as SettingsIcon, Globe } from 'lucide-react';
import { dataService } from './services/dataService';
import { User } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    // Initial load from sync cache
    setUser(dataService.getCurrentUserSync());
    
    // Attempt refresh from server to ensure validity
    dataService.refreshUser().then(u => setUser(u));

    const checkUser = () => setUser(dataService.getCurrentUserSync());
    window.addEventListener('storage', checkUser);
    
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, [key, value]);
        if (key === 'eddit_current_user_cache') checkUser();
    };

    return () => {
        localStorage.setItem = originalSetItem;
        window.removeEventListener('storage', checkUser);
    }
  }, [location]);

  const handleLogout = () => {
    dataService.logout();
    setUser(null);
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'mod';

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/50 border-b border-white/5">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dodgerblue to-blue-700 flex items-center justify-center shadow-[0_0_15px_rgba(30,144,255,0.5)] group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
           </div>
           <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">eddit<span className="text-dodgerblue">.site</span></span>
        </Link>
        
        <div className="flex items-center gap-6">
            <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-white' : 'text-gray-400 hover:text-white'}`}>{t('browse')}</Link>
            <Link to="/tv" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${location.pathname === '/tv' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-400 hover:text-green-400'}`}>
                <Radio className="w-4 h-4" /> {t('liveTv')}
            </Link>
            
            {/* Lang Switcher */}
            <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                <button onClick={() => setLang('pl')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'pl' ? 'bg-dodgerblue text-white' : 'text-gray-400'}`}>PL</button>
                <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'en' ? 'bg-dodgerblue text-white' : 'text-gray-400'}`}>EN</button>
            </div>

            {user ? (
                <>
                     <Link to="/request" className={`flex items-center gap-2 text-sm ${location.pathname === '/request' ? 'text-dodgerblue' : 'text-gray-400 hover:text-white'}`}>
                        <MessageSquarePlus className="w-4 h-4" /> {t('request')}
                    </Link>

                    {isAdmin && (
                        <Link to="/admin" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${location.pathname === '/admin' ? 'bg-dodgerblue/20 text-dodgerblue border border-dodgerblue/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <LayoutGrid className="w-4 h-4" /> {t('admin')}
                        </Link>
                    )}

                    <div className="w-px h-6 bg-white/10 mx-2"></div>
                    
                    <div className="flex items-center gap-3">
                         <Link to="/settings" className="flex items-center gap-2 group hover:text-white text-gray-400 transition-colors">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover:border-dodgerblue" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-dodgerblue transition-colors"><UserIcon className="w-4 h-4" /></div>
                            )}
                            <span className="text-sm font-bold text-gray-300 hidden md:block group-hover:text-white">{user.username}</span>
                        </Link>
                        
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors ml-2" title={t('logout')}>
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </>
            ) : (
                <Link to="/login" className="bg-dodgerblue hover:bg-blue-600 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20">
                    {t('login')}
                </Link>
            )}
        </div>
      </div>
    </nav>
  );
};

const Footer = () => {
    const { t } = useLanguage();
    return (
        <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl py-8 mt-auto">
            <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} {t('footer_text')}</p>
            </div>
        </footer>
    );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <LanguageProvider>
        <Background3D>
            <Navbar />
            <main className="flex-grow relative z-10">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tv" element={<Home isTvMode={true} />} />
                <Route path="/watch/:id" element={<Watch />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/request" element={<RequestContent />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
            </main>
            <Footer />
            <ChatBot />
        </Background3D>
      </LanguageProvider>
    </HashRouter>
  );
};

export default App;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowDownUp, Radio, Star, Heart, Clock, Bell, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../services/dataService';
import { ContentItem, CATEGORIES, User, SystemNotification, SiteSettings } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface HomeProps {
    isTvMode?: boolean;
}

const Home: React.FC<HomeProps> = ({ isTvMode = false }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [hits, setHits] = useState<ContentItem[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'a-z'>('newest');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [user, setUser] = useState<User | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const data = await dataService.getContent();
        setContent(data);
        setHits(data.filter(i => i.isHit && !isTvMode && (i.type === 'movie' || i.type === 'series')));
        
        const notifs = await dataService.getNotifications();
        setNotifications(notifs);
        
        const sets = await dataService.getSettings();
        setSettings(sets);
        
        setLoading(false);
    };
    
    fetchData();
    setUser(dataService.getCurrentUserSync());
    
    const dismissed = localStorage.getItem('eddit_dismissed_notifs');
    if (dismissed) setDismissedNotifs(JSON.parse(dismissed));
    
    setActiveCategory('All');
    setSearchTerm('');
    setShowFavorites(false);
    setShowHistory(false);
  }, [isTvMode]);

  useEffect(() => {
    let result = [...content];

    // Filter by Mode
    if (isTvMode) {
        result = result.filter(item => item.type === 'tv');
    } else {
        result = result.filter(item => item.type === 'movie' || item.type === 'series');
    }

    // Special User Filters
    if (showFavorites && user) {
        result = result.filter(item => user.favorites.includes(item.id));
    } else if (showHistory && user) {
        const historyIds = Object.keys(user.watchHistory);
        result = result.filter(item => historyIds.includes(item.id));
    } else {
        if (activeCategory !== 'All') {
            result = result.filter(item => item.categories.includes(activeCategory));
        }
    }

    if (searchTerm) {
        result = result.filter(item => item.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    } else if (sortBy === 'a-z') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredContent(result);
  }, [content, activeCategory, sortBy, searchTerm, isTvMode, showFavorites, showHistory, user]);

  const dismissNotification = (id: string) => {
      const newDismissed = [...dismissedNotifs, id];
      setDismissedNotifs(newDismissed);
      localStorage.setItem('eddit_dismissed_notifs', JSON.stringify(newDismissed));
  };

  const getWatchProgressPercent = (itemId: string) => {
      if (!user) return 0;
      const history = user.watchHistory[itemId];
      if (!history || history.duration === 0) return 0;
      return Math.min((history.timestamp / history.duration) * 100, 100);
  };

  const visibleNotifications = notifications.filter(n => n.isSticky || !dismissedNotifs.includes(n.id));

  // Discord Icon
  function DiscordIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2763-3.68-.2763-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z"/></svg>
    );
  }
  
  if (loading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-dodgerblue" /></div>
  }

  return (
    <div className="container mx-auto px-6 py-12">

      {/* SYSTEM NOTIFICATIONS */}
      {visibleNotifications.length > 0 && !isTvMode && (
          <div className="mb-12 space-y-4">
              <AnimatePresence>
                  {visibleNotifications.map(notif => (
                      <motion.div 
                        key={notif.id}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-4 rounded-xl border border-l-4 flex gap-4 items-start relative shadow-lg ${
                            notif.isSticky 
                            ? 'bg-dodgerblue/10 border-dodgerblue/30 border-l-dodgerblue' 
                            : 'bg-white/5 border-white/10 border-l-white/50'
                        }`}
                      >
                          <div className={`p-2 rounded-full ${notif.isSticky ? 'bg-dodgerblue/20 text-dodgerblue' : 'bg-white/10 text-gray-300'}`}>
                              <Bell className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                              <h3 className="font-bold text-lg mb-1">{notif.title}</h3>
                              <p className="text-gray-300 text-sm leading-relaxed">{notif.message}</p>
                              <div className="text-[10px] text-gray-500 mt-2">{new Date(notif.createdAt).toLocaleString()}</div>
                          </div>
                          {!notif.isSticky && (
                              <button 
                                onClick={() => dismissNotification(notif.id)}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                              >
                                  <X className="w-4 h-4" />
                              </button>
                          )}
                          {notif.isSticky && (
                               <div className="absolute top-2 right-2">
                                   <div className="w-2 h-2 rounded-full bg-dodgerblue animate-pulse"></div>
                               </div>
                          )}
                      </motion.div>
                  ))}
              </AnimatePresence>
          </div>
      )}
      
      {/* HITS SECTION */}
      {!isTvMode && hits.length > 0 && !showFavorites && !showHistory && !searchTerm && activeCategory === 'All' && (
        <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-yellow-500">
                <Star className="fill-current" /> {t('hits')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {hits.slice(0, 2).map(item => (
                    <Link key={item.id} to={`/watch/${item.id}`} className="group relative rounded-3xl overflow-hidden aspect-video border border-white/10 shadow-2xl block">
                        <img src={item.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-8">
                            <h3 className="text-4xl font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-gray-300 line-clamp-2 mb-4">{item.description}</p>
                            <span className="inline-flex items-center gap-2 bg-dodgerblue text-white px-6 py-2 rounded-full font-bold group-hover:bg-blue-600 transition-colors w-fit">
                                <Play className="w-4 h-4 fill-current" /> {t('watch_now')}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-4 flex items-center gap-4">
            {isTvMode ? (
                <>
                 <span className="text-green-500"><Radio className="w-12 h-12 md:w-16 md:h-16" /></span> {t('liveTv')}
                </>
            ) : (
                t('browse')
            )}
          </h1>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-2">
            <input 
                type="text" 
                placeholder={isTvMode ? t('search_channels') : t('search_placeholder')} 
                className="flex-1 md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-dodgerblue focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {settings?.discordLink && (
                <a href={settings.discordLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white transition-colors" title="Join our Discord">
                    <DiscordIcon className="w-6 h-6" />
                </a>
            )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="sticky top-20 z-40 bg-black/80 backdrop-blur-xl border-y border-white/5 py-4 mb-8 -mx-6 px-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar mask-gradient items-center">
          
          {user && !isTvMode && (
              <>
                <button onClick={() => { setShowFavorites(!showFavorites); setShowHistory(false); setActiveCategory('All'); }} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${showFavorites ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <Heart className="w-3 h-3" /> {t('favorites')}
                </button>
                <button onClick={() => { setShowHistory(!showHistory); setShowFavorites(false); setActiveCategory('All'); }} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${showHistory ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    <Clock className="w-3 h-3" /> {t('history')}
                </button>
                <div className="w-px h-6 bg-white/10 mx-2"></div>
              </>
          )}

          <button onClick={() => { setActiveCategory('All'); setShowFavorites(false); setShowHistory(false); }} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeCategory === 'All' && !showFavorites && !showHistory ? 'bg-dodgerblue text-white shadow-[0_0_15px_rgba(30,144,255,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{t('all')}</button>
          
          {!showFavorites && !showHistory && CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-dodgerblue text-white shadow-[0_0_15px_rgba(30,144,255,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{cat}</button>
          ))}
        </div>

        <div className="flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-gray-500" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer">
                <option value="newest" className="bg-darkbg">Newest</option>
                <option value="oldest" className="bg-darkbg">Oldest</option>
                <option value="a-z" className="bg-darkbg">A-Z</option>
            </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <AnimatePresence mode='popLayout'>
        {filteredContent.map((item) => (
          <motion.div layout key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
            <Link to={`/watch/${item.id}`} className="group block h-full">
              {/* Image Container - Switched to aspect-[2/3] for posters */}
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-900 border border-white/5 shadow-2xl z-10 transform-gpu">
                <img 
                    src={item.thumbnailUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100 will-change-transform" 
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-20">
                    <div className="flex gap-1">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${item.type === 'series' ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : item.type === 'tv' ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-blue-500/20 border-blue-500/30 text-blue-300'}`}>
                            {item.type === 'tv' ? 'LIVE' : item.type}
                        </span>
                        {item.quality && <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/10 text-white border border-white/20">{item.quality}</span>}
                    </div>
                    {item.isHit && <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-yellow-500 text-black border border-yellow-400">HIT</span>}
                </div>

                {item.type === 'tv' && (<div className="absolute top-3 right-3 flex items-center gap-1 z-20"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></span></div>)}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-4 z-20 pointer-events-none">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-lg font-bold text-white mb-1 leading-tight group-hover:text-dodgerblue transition-colors line-clamp-2">{item.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {item.categories.slice(0, 2).map(c => (<span key={c} className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">{c}</span>))}
                    </div>
                  </div>
                </div>

                {/* Watch Progress Bar */}
                {user && getWatchProgressPercent(item.id) > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800/50 z-30 backdrop-blur-sm">
                        <div 
                            className="h-full bg-dodgerblue shadow-[0_0_10px_dodgerblue]" 
                            style={{ width: `${getWatchProgressPercent(item.id)}%` }} 
                        />
                    </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
      
      {filteredContent.length === 0 && (
        <div className="text-center py-20 text-gray-500">
            {t('no_content')}
        </div>
      )}
    </div>
  );
};

export default Home;
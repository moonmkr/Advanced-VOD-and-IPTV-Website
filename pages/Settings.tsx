import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Camera, Clock, Save, PlayCircle, Calendar, Activity, Star, Mail } from 'lucide-react';
import { dataService } from '../services/dataService';
import { ContentItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState(dataService.getCurrentUserSync());
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [historyItems, setHistoryItems] = useState<{ content: ContentItem, progress: number, duration: number, percent: number }[]>([]);

  useEffect(() => {
    const init = async () => {
        const currentUser = dataService.getCurrentUserSync();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        setAvatarUrl(currentUser.avatarUrl || '');
    
        // Process History
        const allContent = await dataService.getContent();
        const historyData = [];
        for (const [id, data] of Object.entries(currentUser.watchHistory)) {
            const content = allContent.find(c => c.id === id);
            if (content) {
                let progress = 0;
                let duration = 0;
                
                if (typeof data === 'number') {
                    progress = data;
                    duration = 0; 
                } else {
                    progress = data.timestamp;
                    duration = data.duration;
                }
    
                const percent = duration > 0 ? (progress / duration) * 100 : 0;
                historyData.push({ content, progress, duration, percent });
            }
        }
        setHistoryItems(historyData.reverse());
    }
    init();

  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updatedUser = { ...user, avatarUrl };
    if (newPassword) {
        updatedUser.password = newPassword;
    }

    await dataService.updateUser(updatedUser);
    setUser(updatedUser);
    alert('Settings updated!');
    setNewPassword('');
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="bg-dodgerblue/20 p-2 rounded-lg text-dodgerblue"><SettingsIcon className="w-6 h-6" /></span>
            {t('settings')}
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Form */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <img 
                                src={avatarUrl || 'https://i.imgur.com/P4awMmw.jpeg'} 
                                alt="Avatar" 
                                className="w-24 h-24 rounded-full object-cover border-2 border-dodgerblue shadow-[0_0_20px_rgba(30,144,255,0.3)]"
                            />
                            <div className="absolute bottom-0 right-0 bg-dodgerblue p-1.5 rounded-full text-white">
                                <Camera className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">{t('avatar_url')}</label>
                            <input 
                                type="url" 
                                value={avatarUrl}
                                onChange={e => setAvatarUrl(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:border-dodgerblue focus:outline-none text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">{t('new_password')}</label>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Leave empty to keep current"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:border-dodgerblue focus:outline-none text-white text-sm"
                            />
                        </div>
                        <button type="submit" className="w-full bg-dodgerblue hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(30,144,255,0.3)] flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> {t('save_changes')}
                        </button>
                    </form>
                </div>
                
                {/* Stats */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                    <h3 className="font-bold text-lg mb-4 text-gray-300">{t('profile_stats')}</h3>
                    <div className="space-y-3">
                         <div className="flex items-center gap-3 text-sm">
                             <div className="bg-white/10 p-2 rounded-lg text-gray-400"><Calendar className="w-4 h-4"/></div>
                             <div>
                                 <div className="text-xs text-gray-500 uppercase font-bold">{t('registered_at')}</div>
                                 <div className="text-white font-mono">{user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : 'N/A'}</div>
                             </div>
                         </div>
                         <div className="flex items-center gap-3 text-sm">
                             <div className="bg-white/10 p-2 rounded-lg text-gray-400"><Activity className="w-4 h-4"/></div>
                             <div>
                                 <div className="text-xs text-gray-500 uppercase font-bold">{t('last_active')}</div>
                                 <div className="text-white font-mono">{user.lastActive ? new Date(user.lastActive).toLocaleString() : 'N/A'}</div>
                             </div>
                         </div>
                         
                         {/* Email */}
                         <div className="flex items-center gap-3 text-sm">
                             <div className="bg-white/10 p-2 rounded-lg text-gray-400"><Mail className="w-4 h-4"/></div>
                             <div>
                                 <div className="text-xs text-gray-500 uppercase font-bold">Email</div>
                                 <div className="text-white font-mono truncate w-40">{user.email || 'N/A'}</div>
                             </div>
                         </div>

                         {/* Points */}
                         <div className="flex items-center gap-3 text-sm pt-2 border-t border-white/5 mt-2">
                             <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500"><Star className="w-4 h-4"/></div>
                             <div>
                                 <div className="text-xs text-gray-500 uppercase font-bold">Points</div>
                                 <div className="text-yellow-500 font-bold text-lg">{user.points || 0}</div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Right: History */}
            <div className="lg:col-span-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl h-full">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-400" /> {t('my_history')}
                    </h2>

                    <div className="space-y-4">
                        {historyItems.length === 0 && <p className="text-gray-500 italic">No history yet.</p>}
                        {historyItems.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center bg-black/20 p-3 rounded-xl border border-white/5 hover:border-dodgerblue/30 transition-colors">
                                <div className="w-24 h-14 rounded-lg overflow-hidden shrink-0 relative group">
                                    <img src={item.content.thumbnailUrl} className="w-full h-full object-cover" />
                                    <Link to={`/watch/${item.content.id}`} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <PlayCircle className="w-6 h-6 text-white" />
                                    </Link>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm mb-1">{item.content.title}</h3>
                                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-dodgerblue" style={{ width: `${Math.min(item.percent, 100)}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                        <span>{Math.floor(item.progress / 60)} min watched</span>
                                        <span>{Math.floor(item.percent)}%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// Icon helper
function SettingsIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
    )
}
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Upload, Video, Tv, Lock, Unlock, X, Radio, Edit2, Save, FileJson, Star, Users, MessageSquarePlus, Check, XCircle, Shield, Ban, Bell, Pin, Settings as SettingsIcon, Wifi, WifiOff } from 'lucide-react';
import { dataService } from '../services/dataService';
import { ContentItem, Episode, CATEGORIES, ContentType, User, ContentRequest, QualityType, SystemNotification, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline'>('offline');
  
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [requestsList, setRequestsList] = useState<ContentRequest[]>([]);
  const [notifList, setNotifList] = useState<SystemNotification[]>([]);
  const [discordLink, setDiscordLink] = useState('');

  // Navigation Tab
  const [adminTab, setAdminTab] = useState<'content' | 'users' | 'requests' | 'notifications' | 'settings'>('content');
  
  // Content Form States
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTypeTab, setActiveTypeTab] = useState<ContentType>('movie');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isHit, setIsHit] = useState(false);
  const [quality, setQuality] = useState<QualityType>('1080p');
  
  // Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifSticky, setNotifSticky] = useState(false);

  // User Editing Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserAvatar, setEditUserAvatar] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('user');

  // Series Specific State
  const [tempEpisodes, setTempEpisodes] = useState<Episode[]>([]);
  const [epTitle, setEpTitle] = useState('');
  const [epSeason, setEpSeason] = useState(1);
  const [epNumber, setEpNumber] = useState(1);
  const [epUrl, setEpUrl] = useState('');

  useEffect(() => {
    const currentUser = dataService.getCurrentUserSync();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'mod')) {
        navigate('/login');
        return;
    }
    setUser(currentUser);
    refreshData();
    checkHealth();
  }, [navigate]);

  const checkHealth = async () => {
      const health = await dataService.checkHealth();
      if (health && health.status === 'online') {
          setDbStatus('online');
      } else {
          setDbStatus('offline');
      }
      
      // Get Settings
      try {
        const s = await dataService.getSettings();
        if(s) setDiscordLink(s.discordLink);
      } catch(e) {}
  };

  const refreshData = async () => {
    setContentList(await dataService.getContent());
    setUsersList(await dataService.getUsers());
    setRequestsList(await dataService.getRequests());
    setNotifList(await dataService.getNotifications());
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
        setSelectedCategories(prev => prev.filter(c => c !== cat));
    } else {
        setSelectedCategories(prev => [...prev, cat]);
    }
  };

  const addEpisode = () => {
    if (!epTitle || !epUrl) return;
    const newEp: Episode = {
        id: Math.random().toString(36).substring(7),
        title: epTitle,
        seasonNumber: epSeason,
        episodeNumber: epNumber,
        streamUrl: epUrl
    };
    setTempEpisodes(prev => [...prev, newEp].sort((a,b) => (a.seasonNumber * 100 + a.episodeNumber) - (b.seasonNumber * 100 + b.episodeNumber)));
    setEpTitle('');
    setEpUrl('');
    setEpNumber(prev => prev + 1);
  };

  const removeEpisode = (id: string) => {
    setTempEpisodes(prev => prev.filter(e => e.id !== id));
  };

  const startEdit = (item: ContentItem) => {
    setIsEditing(true);
    setEditingId(item.id);
    setActiveTypeTab(item.type);
    setTitle(item.title);
    setDescription(item.description);
    setThumbnailUrl(item.thumbnailUrl);
    setSelectedCategories(item.categories);
    setIsHit(!!item.isHit);
    setQuality(item.quality || '1080p');
    
    if (item.type === 'movie' || item.type === 'tv') {
        setStreamUrl(item.streamUrl || '');
        setTempEpisodes([]);
    } else if (item.type === 'series') {
        setStreamUrl('');
        setTempEpisodes(item.episodes || []);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setThumbnailUrl('');
    setStreamUrl('');
    setTempEpisodes([]);
    setSelectedCategories([]);
    setEpTitle('');
    setEpUrl('');
    setIsHit(false);
    setQuality('1080p');
  };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const commonData = {
        title,
        description,
        thumbnailUrl,
        categories: selectedCategories,
        type: activeTypeTab,
        isHit,
        quality
    };

    let payload: any = { ...commonData };

    if (activeTypeTab === 'movie' || activeTypeTab === 'tv') {
        if (!streamUrl) {
            alert('Stream URL required');
            return;
        }
        payload.streamUrl = streamUrl;
    } else {
        if (tempEpisodes.length === 0) {
            alert('Add at least one episode for a series');
            return;
        }
        payload.episodes = tempEpisodes;
    }

    if (isEditing && editingId) {
        await dataService.updateContent(editingId, payload);
        setIsEditing(false);
        setEditingId(null);
    } else {
        await dataService.saveContent(payload);
    }

    resetForm();
    refreshData();
  };

  const handleDeleteContent = async (id: string) => {
    if (window.confirm('Delete this content?')) {
        await dataService.deleteContent(id);
        refreshData();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (await dataService.importDB(content)) {
        alert('Data imported successfully!');
        refreshData();
      } else {
        alert('Failed to import database. Check file format or server permissions.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    await dataService.updateRequestStatus(id, status);
    refreshData();
  };

  const handleDeleteRequest = async (id: string) => {
      if(window.confirm('Remove this request?')) {
          await dataService.deleteRequest(id);
          refreshData();
      }
  };
  
  const handleBanToggle = async (targetUser: User) => {
      if (user?.role !== 'admin') return;
      await dataService.adminUpdateUser(targetUser.id, { isBanned: !targetUser.isBanned });
      refreshData();
  };

  // User Editing
  const openEditUser = (u: User) => {
      setEditingUser(u);
      setEditUserAvatar(u.avatarUrl || '');
      setEditUserEmail(u.email || '');
      setEditUserRole(u.role);
  };

  const saveEditUser = async () => {
      if(editingUser) {
          await dataService.adminUpdateUser(editingUser.id, {
              avatarUrl: editUserAvatar,
              email: editUserEmail,
              role: editUserRole
          });
          setEditingUser(null);
          refreshData();
      }
  };
  
  const handleAddNotification = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!notifTitle || !notifMsg) return;
      await dataService.addNotification(notifTitle, notifMsg, notifSticky);
      setNotifTitle('');
      setNotifMsg('');
      setNotifSticky(false);
      refreshData();
  };
  
  const handleDeleteNotif = async (id: string) => {
      await dataService.deleteNotification(id);
      refreshData();
  }

  const handleSaveSettings = async () => {
      await dataService.saveSettings({ discordLink });
      alert('Settings Saved');
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-6 py-12 relative">
      
      {/* User Edit Modal */}
      {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">Edit User: {editingUser.username}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-gray-400 block mb-1">Avatar URL</label>
                          <input type="text" value={editUserAvatar} onChange={e => setEditUserAvatar(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white" />
                      </div>
                      <div>
                          <label className="text-xs text-gray-400 block mb-1">Email</label>
                          <input type="text" value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white" />
                      </div>
                      <div>
                          <label className="text-xs text-gray-400 block mb-1">Role</label>
                          <select value={editUserRole} onChange={e => setEditUserRole(e.target.value as UserRole)} className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white">
                              <option value="user">User</option>
                              <option value="mod">Moderator</option>
                              <option value="admin">Admin</option>
                          </select>
                      </div>
                      <div className="flex gap-2 pt-2">
                          <button onClick={() => setEditingUser(null)} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded">Cancel</button>
                          <button onClick={saveEditUser} className="flex-1 bg-dodgerblue hover:bg-blue-600 py-2 rounded">Save</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <span className="bg-dodgerblue/20 p-2 rounded-lg text-dodgerblue"><Shield /></span>
                {t('admin')}
            </h1>
            <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-400">User: <span className="text-white font-bold">{user.username}</span></p>
                
                {/* STATUS INDICATOR */}
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${dbStatus === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {dbStatus === 'online' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {dbStatus === 'online' ? 'DB ONLINE' : 'LOCAL MODE (Offline)'}
                </div>
            </div>
            {dbStatus === 'offline' && <p className="text-[10px] text-red-400 mt-1">Warning: Changes are not saving to server. Check api.php</p>}
        </div>
        
        {/* Main Tabs */}
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 flex-wrap gap-1">
            <button 
                onClick={() => setAdminTab('content')} 
                className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${adminTab === 'content' ? 'bg-dodgerblue text-white' : 'text-gray-400 hover:text-white'}`}
            >
                <Video className="w-4 h-4" /> Content
            </button>
            <button 
                onClick={() => setAdminTab('requests')} 
                className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${adminTab === 'requests' ? 'bg-dodgerblue text-white' : 'text-gray-400 hover:text-white'}`}
            >
                <MessageSquarePlus className="w-4 h-4" /> Requests
            </button>
            <button 
                onClick={() => setAdminTab('notifications')} 
                className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${adminTab === 'notifications' ? 'bg-dodgerblue text-white' : 'text-gray-400 hover:text-white'}`}
            >
                <Bell className="w-4 h-4" /> Notifs
            </button>
            <button 
                onClick={() => setAdminTab('settings')} 
                className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${adminTab === 'settings' ? 'bg-dodgerblue text-white' : 'text-gray-400 hover:text-white'}`}
            >
                <SettingsIcon className="w-4 h-4" /> Settings
            </button>
            {user.username === 'eddit' && (
                <button 
                    onClick={() => setAdminTab('users')} 
                    className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${adminTab === 'users' ? 'bg-dodgerblue text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    <Users className="w-4 h-4" /> Users
                </button>
            )}
        </div>
      </div>

      {/* --- CONTENT TAB --- */}
      {adminTab === 'content' && (
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative">
                    {isEditing && (
                        <div className="absolute top-0 right-0 left-0 bg-yellow-500/20 text-yellow-500 text-xs font-bold text-center py-1 rounded-t-2xl border-b border-yellow-500/30">
                            EDITING MODE
                        </div>
                    )}

                    <div className="flex bg-black/40 rounded-lg p-1 mb-6 mt-2">
                        <button onClick={() => setActiveTypeTab('movie')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md transition-all text-xs sm:text-sm ${activeTypeTab === 'movie' ? 'bg-dodgerblue text-white' : 'text-gray-400'}`}><Video className="w-4 h-4" /> Movie</button>
                        <button onClick={() => setActiveTypeTab('series')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md transition-all text-xs sm:text-sm ${activeTypeTab === 'series' ? 'bg-dodgerblue text-white' : 'text-gray-400'}`}><Tv className="w-4 h-4" /> Series</button>
                        <button onClick={() => setActiveTypeTab('tv')} className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md transition-all text-xs sm:text-sm ${activeTypeTab === 'tv' ? 'bg-dodgerblue text-white' : 'text-gray-400'}`}><Radio className="w-4 h-4" /> Live TV</button>
                    </div>

                    <form onSubmit={handleSubmitContent} className="space-y-4">
                        <div>
                            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:border-dodgerblue focus:outline-none" placeholder={t('title')} />
                            <input type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} className="mt-2 w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:border-dodgerblue focus:outline-none text-xs font-mono" placeholder="Thumbnail URL" />
                            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-2 w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:border-dodgerblue focus:outline-none" placeholder={t('description') + "..."} />
                        </div>
                        
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">{t('quality')}</label>
                                <select value={quality} onChange={e => setQuality(e.target.value as QualityType)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:border-dodgerblue focus:outline-none text-sm">
                                    <option value="4K">4K</option>
                                    <option value="1080p">1080p</option>
                                    <option value="720p">720p</option>
                                    <option value="CAM">CAM</option>
                                    <option value="DVD">DVD</option>
                                </select>
                            </div>
                            
                            {/* HIT Toggle */}
                            <div className="flex items-center gap-2 cursor-pointer bg-black/20 p-2 rounded-lg border border-white/5" onClick={() => setIsHit(!isHit)}>
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isHit ? 'bg-yellow-500' : 'bg-gray-700'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isHit ? 'translate-x-4' : ''}`} />
                                </div>
                                <span className={`text-xs font-bold ${isHit ? 'text-yellow-500' : 'text-gray-400'}`}>{t('mark_hit')}</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-2">{t('categories')}</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button type="button" key={cat} onClick={() => toggleCategory(cat)} className={`px-2 py-1 text-xs rounded border transition-all ${selectedCategories.includes(cat) ? 'bg-dodgerblue border-dodgerblue text-white' : 'border-white/10 text-gray-400 hover:border-white/30'}`}>{cat}</button>
                                ))}
                            </div>
                        </div>

                        {(activeTypeTab === 'movie' || activeTypeTab === 'tv') && (
                            <input type="url" required value={streamUrl} onChange={e => setStreamUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:border-dodgerblue focus:outline-none text-xs font-mono" placeholder="Stream m3u8 URL" />
                        )}

                        {activeTypeTab === 'series' && (
                            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 block">{t('episodes')}</label>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input type="number" min="1" placeholder="S" className="bg-black/40 border border-white/10 rounded px-2 py-1" value={epSeason} onChange={e => setEpSeason(parseInt(e.target.value))} />
                                    <input type="number" min="1" placeholder="E" className="bg-black/40 border border-white/10 rounded px-2 py-1" value={epNumber} onChange={e => setEpNumber(parseInt(e.target.value))} />
                                </div>
                                <input type="text" value={epTitle} onChange={e => setEpTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 mb-2 text-sm" placeholder="Episode Title" />
                                <input type="url" value={epUrl} onChange={e => setEpUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 mb-2 text-xs font-mono" placeholder="Episode m3u8 URL" />
                                <button type="button" onClick={addEpisode} className="w-full bg-white/10 hover:bg-white/20 text-white text-xs py-2 rounded transition-colors">Add Episode</button>
                                {tempEpisodes.length > 0 && (
                                    <div className="mt-4 space-y-1 max-h-40 overflow-y-auto pr-1">
                                        {tempEpisodes.map(ep => (
                                            <div key={ep.id} className="flex justify-between items-center bg-black/40 p-2 rounded text-xs">
                                                <span className="truncate">S{ep.seasonNumber} E{ep.episodeNumber}: {ep.title}</span>
                                                <button onClick={() => removeEpisode(ep.id)} className="text-red-400 hover:text-red-300"><X className="w-3 h-3"/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="flex gap-2">
                            {isEditing && <button type="button" onClick={cancelEdit} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold py-3 rounded-lg flex items-center justify-center gap-2"><X className="w-4 h-4" /> {t('cancel')}</button>}
                            <button type="submit" className={`flex-[2] font-bold py-3 rounded-lg flex items-center justify-center gap-2 ${isEditing ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-dodgerblue hover:bg-blue-600 text-white'}`}>
                                {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {isEditing ? t('update') : t('save')}
                            </button>
                        </div>
                    </form>

                     <div className="mt-6 pt-6 border-t border-white/10 flex gap-2">
                        <button onClick={dataService.exportDB} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-2 border border-white/5"><Download className="w-3 h-3" /> Backup</button>
                        <label className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-2 border border-white/5 cursor-pointer"><Upload className="w-3 h-3" /> Restore <input type="file" accept=".txt,.json" onChange={handleImport} className="hidden" /></label>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead><tr className="bg-black/40 border-b border-white/10"><th className="p-4 text-gray-400">Content</th><th className="p-4 text-gray-400 text-right">Actions</th></tr></thead>
                        <tbody>
                            {contentList.map(item => (
                                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={item.thumbnailUrl} className="w-12 h-16 rounded object-cover bg-gray-800" />
                                            <div>
                                                <div className="font-medium text-white flex items-center gap-2">
                                                    {item.title} 
                                                    {item.isHit && <span className="text-[10px] bg-yellow-500 text-black px-1 rounded font-bold">HIT</span>}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-white">{item.quality || '1080p'}</span>
                                                    <span>{item.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => startEdit(item)} className="text-yellow-500 bg-yellow-500/10 p-2 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteContent(item.id)} className="text-red-500 bg-red-500/10 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* --- REQUESTS TAB --- */}
      {adminTab === 'requests' && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead><tr className="bg-black/40 border-b border-white/10"><th className="p-4 text-gray-400">User</th><th className="p-4 text-gray-400">Request</th><th className="p-4 text-gray-400">Status</th><th className="p-4 text-gray-400 text-right">Actions</th></tr></thead>
                <tbody>
                    {requestsList.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">No pending requests.</td></tr>}
                    {requestsList.map(req => (
                        <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium text-white">{req.username}</td>
                            <td className="p-4">
                                <div className="font-bold">{req.title}</div>
                                <div className="text-sm text-gray-400">{req.description}</div>
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${req.status === 'approved' ? 'bg-green-500/20 text-green-400' : req.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {req.status}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex gap-2 justify-end">
                                    {req.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleRequestStatus(req.id, 'approved')} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 p-2 rounded"><Check className="w-4 h-4" /></button>
                                            <button onClick={() => handleRequestStatus(req.id, 'rejected')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded"><XCircle className="w-4 h-4" /></button>
                                        </>
                                    )}
                                    <button onClick={() => handleDeleteRequest(req.id)} className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 p-2 rounded ml-2"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
      
      {/* --- NOTIFICATIONS TAB --- */}
      {adminTab === 'notifications' && (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-1">
                 <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                     <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Bell className="w-5 h-5" /> {t('add_notification')}</h3>
                     <form onSubmit={handleAddNotification} className="space-y-4">
                         <input 
                            type="text" 
                            placeholder={t('title')} 
                            value={notifTitle}
                            onChange={e => setNotifTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:border-dodgerblue focus:outline-none" 
                            required
                         />
                         <textarea 
                            rows={3} 
                            placeholder={t('message')} 
                            value={notifMsg}
                            onChange={e => setNotifMsg(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:border-dodgerblue focus:outline-none"
                            required 
                         />
                         
                         <label className="flex items-center gap-2 cursor-pointer bg-black/20 p-3 rounded-lg border border-white/5">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${notifSticky ? 'bg-dodgerblue' : 'bg-gray-700'}`} onClick={() => setNotifSticky(!notifSticky)}>
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notifSticky ? 'translate-x-4' : ''}`} />
                            </div>
                            <span className="text-sm font-bold text-gray-300">
                                {notifSticky ? t('sticky') : t('dismissible')}
                            </span>
                         </label>

                         <button type="submit" className="w-full bg-dodgerblue hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                             <Plus className="w-4 h-4" /> {t('save')}
                         </button>
                     </form>
                 </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
                 {notifList.length === 0 && <div className="text-center text-gray-500 py-10">No active notifications.</div>}
                 {notifList.map(notif => (
                     <div key={notif.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start justify-between">
                         <div>
                             <h4 className="font-bold text-white flex items-center gap-2">
                                 {notif.title}
                                 {notif.isSticky && <span className="bg-dodgerblue/20 text-dodgerblue text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-dodgerblue/20"><Pin className="w-3 h-3" /> Sticky</span>}
                             </h4>
                             <p className="text-gray-400 text-sm mt-1">{notif.message}</p>
                             <div className="text-[10px] text-gray-500 mt-2">{new Date(notif.createdAt).toLocaleString()}</div>
                         </div>
                         <button onClick={() => handleDeleteNotif(notif.id)} className="text-gray-500 hover:text-red-500 p-2">
                             <Trash2 className="w-5 h-5" />
                         </button>
                     </div>
                 ))}
            </div>
        </div>
      )}

      {/* --- SITE SETTINGS --- */}
      {adminTab === 'settings' && (
          <div className="max-w-xl mx-auto">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="font-bold text-lg mb-4 text-white">Site Settings</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Discord Invite Link</label>
                          <input 
                            type="text" 
                            value={discordLink} 
                            onChange={e => setDiscordLink(e.target.value)} 
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:border-dodgerblue focus:outline-none"
                            placeholder="https://discord.gg/..."
                          />
                      </div>
                      <button onClick={handleSaveSettings} className="w-full bg-dodgerblue hover:bg-blue-600 text-white font-bold py-3 rounded-lg">Save Settings</button>
                  </div>
              </div>
              
              <div className="mt-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                  <h3 className="font-bold text-lg mb-4 text-white">Admin: Stream Ingestion</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-gray-400 block mb-1">Import M3U URL</label>
                          <input type="url" placeholder="https://example.com/playlist.m3u" id="m3uUrl" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 focus:border-dodgerblue" />
                          <div className="flex gap-2 mt-2">
                              <button onClick={async () => {
                                  const el = document.getElementById('m3uUrl') as HTMLInputElement | null;
                                  if (!el || !el.value) return alert('Enter M3U URL');
                                  const r = await dataService.ingestM3U(el.value);
                                  if (r.error) alert('Failed: ' + r.error); else alert('Imported ' + (r.added||r.added||r.addedCount||r.added || r.added) + ' channels');
                                  refreshData();
                              }} className="bg-dodgerblue hover:bg-blue-600 text-white px-4 py-2 rounded">Import M3U</button>
                              <button onClick={async () => {
                                  const el = document.getElementById('m3uUrl') as HTMLInputElement | null;
                                  if (!el || !el.value) return alert('Enter M3U URL');
                                  const r = await dataService.ingestM3U(el.value);
                                  if (r.error) alert('Failed: ' + r.error); else alert('Imported ' + (r.added||r.addedCount||'?') + ' channels');
                                  refreshData();
                              }} className="bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-2 rounded">Import (silent)</button>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs text-gray-400 block mb-1">Xtream Codes / Provider</label>
                          <div className="grid grid-cols-1 gap-2">
                              <input type="text" id="xtreamHost" placeholder="https://xtream.host" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2" />
                              <div className="grid grid-cols-2 gap-2">
                                  <input type="text" id="xtreamUser" placeholder="username" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2" />
                                  <input type="password" id="xtreamPass" placeholder="password" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2" />
                              </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                              <button onClick={async () => {
                                  const host = (document.getElementById('xtreamHost') as HTMLInputElement).value;
                                  const user = (document.getElementById('xtreamUser') as HTMLInputElement).value;
                                  const pass = (document.getElementById('xtreamPass') as HTMLInputElement).value;
                                  if (!host || !user || !pass) return alert('Provide host/user/pass');
                                  const r = await dataService.ingestXtream(host, user, pass);
                                  if (r.error) alert('Failed: ' + r.error); else alert('Imported ' + (r.added||r.addedCount||'?') + ' channels');
                                  refreshData();
                              }} className="bg-dodgerblue hover:bg-blue-600 text-white px-4 py-2 rounded">Import Xtream</button>
                              <button onClick={() => { (document.getElementById('xtreamHost') as HTMLInputElement).value=''; (document.getElementById('xtreamUser') as HTMLInputElement).value=''; (document.getElementById('xtreamPass') as HTMLInputElement).value=''; }} className="bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-2 rounded">Clear</button>
                          </div>
                      </div>

                      <div className="pt-4 border-t border-white/5">
                          <h4 className="text-sm font-bold mb-2">Create Subscriber</h4>
                          <div className="grid grid-cols-1 gap-2">
                              <input type="text" id="subUser" placeholder="username" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2" />
                              <input type="password" id="subPass" placeholder="password" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2" />
                              <input type="date" id="subExpiry" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2" />
                              <div className="flex gap-2">
                                  <button onClick={async () => {
                                      const username = (document.getElementById('subUser') as HTMLInputElement).value;
                                      const password = (document.getElementById('subPass') as HTMLInputElement).value;
                                      const expirationDate = (document.getElementById('subExpiry') as HTMLInputElement).value || undefined;
                                      if (!username || !password) return alert('Provide username and password');
                                      const r = await dataService.createSubscriber(username, password, expirationDate);
                                      if (r.error) return alert('Failed: ' + r.error);
                                      alert('Subscriber created: ' + JSON.stringify(r));
                                      refreshData();
                                  }} className="bg-dodgerblue hover:bg-blue-600 text-white px-4 py-2 rounded">Create Subscriber</button>
                                  <button onClick={() => { (document.getElementById('subUser') as HTMLInputElement).value=''; (document.getElementById('subPass') as HTMLInputElement).value=''; (document.getElementById('subExpiry') as HTMLInputElement).value=''; }} className="bg-white/5 hover:bg-white/10 text-gray-200 px-4 py-2 rounded">Clear</button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- USERS TAB --- */}
      {adminTab === 'users' && user.username === 'eddit' && (
         <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead><tr className="bg-black/40 border-b border-white/10"><th className="p-4 text-gray-400">Username</th><th className="p-4 text-gray-400">Role</th><th className="p-4 text-gray-400">Status</th><th className="p-4 text-gray-400 text-right">Actions</th></tr></thead>
                <tbody>
                    {usersList.map(u => (
                        <tr key={u.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${u.isBanned ? 'bg-red-900/10' : ''}`}>
                            <td className="p-4">
                                <div className="font-bold text-white">{u.username}</div>
                                <div className="text-xs text-gray-500">{u.email || 'No Email'}</div>
                            </td>
                            <td className="p-4"><span className="uppercase text-xs font-bold bg-white/10 px-2 py-1 rounded">{u.role}</span></td>
                             <td className="p-4">
                                 {u.isBanned ? <span className="text-red-500 font-bold text-xs uppercase flex items-center gap-1"><Ban className="w-3 h-3"/> {t('ban_user')}</span> : <span className="text-green-500 font-bold text-xs uppercase flex items-center gap-1"><Check className="w-3 h-3"/> Active</span>}
                             </td>
                            <td className="p-4 text-right flex items-center justify-end gap-2">
                                {u.username !== 'eddit' && (
                                    <>
                                        <button 
                                            onClick={() => openEditUser(u)}
                                            className="p-2 rounded bg-white/5 hover:bg-white/10 text-gray-300"
                                            title="Edit User"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleBanToggle(u)}
                                            className={`p-2 rounded transition-colors ${u.isBanned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                                            title={u.isBanned ? t('unban_user') : t('ban_user')}
                                        >
                                            <Ban className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      )}
    </div>
  );
};

export default Admin;
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Share2, PlayCircle, Layers, Radio, Heart, MessageCircle, Send, Shield, Zap, User as UserIcon, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import { ContentItem, Episode, User, Comment, UserRole } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import { useLanguage } from '../contexts/LanguageContext';

const Watch: React.FC = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  
  // Series Seasons
  const [groupedEpisodes, setGroupedEpisodes] = useState<Record<number, Episode[]>>({});
  const [activeSeason, setActiveSeason] = useState(1);

  // Auth & Social
  const [user, setUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Anti-spam
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, ans: 0 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [lastCommentTime, setLastCommentTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  // Playback
  const [initialTime, setInitialTime] = useState(0);

  useEffect(() => {
    const currentUser = dataService.getCurrentUserSync();
    setUser(currentUser);
    generateCaptcha();

    const fetchContent = async () => {
        if (id) {
          const allContent = await dataService.getContent();
          const found = allContent.find(v => v.id === id);
          if (found) {
            setContent(found);
            
            if (currentUser) {
                setIsFavorite(currentUser.favorites.includes(found.id));
                setInitialTime(dataService.getWatchProgress(found.id));
            }
    
            // Group Episodes by Season
            if (found.type === 'series' && found.episodes && found.episodes.length > 0) {
                const grouped: Record<number, Episode[]> = {};
                found.episodes.forEach(ep => {
                    if (!grouped[ep.seasonNumber]) grouped[ep.seasonNumber] = [];
                    grouped[ep.seasonNumber].push(ep);
                });
                // Sort
                Object.keys(grouped).forEach(key => {
                    const k = parseInt(key);
                    grouped[k].sort((a,b) => a.episodeNumber - b.episodeNumber);
                });
                setGroupedEpisodes(grouped);
                
                // Set initial episode
                const firstSeason = Math.min(...Object.keys(grouped).map(k=>parseInt(k)));
                setActiveSeason(firstSeason);
                setActiveEpisode(grouped[firstSeason][0]);
            }
    
            const coms = await dataService.getComments(found.id);
            setComments(coms);
          }
        }
    }
    fetchContent();

    const handleStorageUpdate = () => {
        const u = dataService.getCurrentUserSync();
        setUser(u);
        if (u && id) setIsFavorite(u.favorites.includes(id));
    };
    window.addEventListener('user-updated', handleStorageUpdate);
    return () => window.removeEventListener('user-updated', handleStorageUpdate);

  }, [id]);

  useEffect(() => {
      let interval: any;
      if (cooldown > 0) {
          interval = setInterval(() => setCooldown(c => c - 1), 1000);
      }
      return () => clearInterval(interval);
  }, [cooldown]);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ a, b, ans: a + b });
    setCaptchaInput('');
  };

  const handleTimeUpdate = (time: number, duration: number) => {
    if (content) {
        dataService.updateWatchHistory(content.id, time, duration);
    }
  };

  const toggleFav = () => {
    if (!content) return;
    if (!user) {
        alert("Please login to add to favorites.");
        return;
    }
    dataService.toggleFavorite(content.id);
    setIsFavorite(!isFavorite);
  };

  const handleDeleteComment = async (commentId: string) => {
      if (window.confirm('Delete this comment?')) {
          await dataService.deleteComment(commentId);
          if (content) setComments(await dataService.getComments(content.id));
      }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !newComment.trim() || !user) return;

    if (Date.now() - lastCommentTime < 20000) {
        alert("Please wait 20 seconds before posting another comment.");
        return;
    }

    if (parseInt(captchaInput) !== captcha.ans) {
        alert("Incorrect Captcha.");
        generateCaptcha();
        return;
    }
    
    await dataService.addComment(content.id, newComment);
    setComments(await dataService.getComments(content.id));
    setNewComment('');
    setLastCommentTime(Date.now());
    setCooldown(20);
    generateCaptcha();
  };

  const renderRoleBadge = (role?: UserRole) => {
      if (role === 'admin') return <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Shield className="w-3 h-3" /> ADMIN</span>;
      if (role === 'mod') return <span className="bg-dodgerblue text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><Zap className="w-3 h-3" /> MOD</span>;
      return <span className="bg-gray-700 text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"><UserIcon className="w-3 h-3" /> USER</span>;
  };

  if (!content) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col">
        <h2 className="text-2xl font-bold text-gray-500">{t('no_content')}</h2>
        <Link to="/" className="mt-4 text-dodgerblue hover:underline">Go Home</Link>
      </div>
    );
  }

  const currentStreamUrl = (content.type === 'movie' || content.type === 'tv') ? content.streamUrl : activeEpisode?.streamUrl;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link to={content.type === 'tv' ? '/tv' : '/'} className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> {content.type === 'tv' ? t('liveTv') : t('browse')}
      </Link>

      <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Player Column */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 relative">
                {content.type === 'tv' && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-red-600/80 backdrop-blur text-white px-3 py-1 rounded text-xs font-bold pointer-events-none">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> LIVE
                    </div>
                )}
                
                {currentStreamUrl ? (
                    <VideoPlayer 
                        src={currentStreamUrl} 
                        poster={content.thumbnailUrl} 
                        autoPlay 
                        initialTime={initialTime}
                        onTimeUpdate={handleTimeUpdate}
                    />
                ) : (
                    <div className="aspect-video flex items-center justify-center bg-gray-900">
                        <p>No Stream Available</p>
                    </div>
                )}
            </div>
            
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                        {content.title}
                        {content.type === 'tv' && <Radio className="w-5 h-5 text-green-500" />}
                    </h1>
                    {content.type === 'series' && activeEpisode && (
                        <h2 className="text-xl text-dodgerblue mb-2">
                            S{activeEpisode.seasonNumber} E{activeEpisode.episodeNumber} - {activeEpisode.title}
                        </h2>
                    )}
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleFav} className={`p-3 rounded-full transition-all border border-white/5 ${isFavorite ? 'bg-pink-600 text-white' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}>
                        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-white text-sm font-medium transition-all border border-white/5">
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                </div>
            </div>
            
            <div className="flex gap-2 mt-2 mb-4 flex-wrap">
                <span className="text-xs bg-dodgerblue/20 text-dodgerblue border border-dodgerblue/30 px-2 py-1 rounded font-bold">{content.quality || 'HD'}</span>
                {content.categories.map(c => (
                    <span key={c} className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">{c}</span>
                ))}
            </div>
            
            <p className="text-gray-400 leading-relaxed">{content.description}</p>
            
            {content.addedBy && (
                 <p className="text-xs text-gray-500 mt-4 italic">{t('added_by')}: <span className="text-gray-400">{content.addedBy}</span></p>
            )}

            {/* COMMENTS SECTION */}
            <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-dodgerblue" /> {t('comments')}</h3>
                
                {user ? (
                    <form onSubmit={postComment} className="mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
                        <input 
                            type="text" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..." 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-dodgerblue focus:outline-none mb-4 text-white"
                        />
                        <div className="flex justify-between items-center flex-wrap gap-2">
                             <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 font-bold uppercase">{t('human_check')}:</span>
                                <span className="bg-white/10 px-2 py-1 rounded font-mono text-sm">{captcha.a} + {captcha.b} = ?</span>
                                <input 
                                    type="number"
                                    value={captchaInput}
                                    onChange={e => setCaptchaInput(e.target.value)}
                                    className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 focus:border-dodgerblue focus:outline-none text-center text-white"
                                />
                                <button type="button" onClick={generateCaptcha} className="text-gray-400 hover:text-white"><RotateCcw className="w-3 h-3" /></button>
                            </div>

                            <button 
                                type="submit" 
                                disabled={cooldown > 0}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-colors ${cooldown > 0 ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-dodgerblue hover:bg-blue-600 text-white'}`}
                            >
                                {cooldown > 0 ? (
                                    <><Clock className="w-4 h-4 animate-spin" /> {cooldown}s</>
                                ) : (
                                    <><Send className="w-4 h-4" /> {t('post')}</>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="bg-white/5 p-4 rounded-xl text-center mb-6">
                        <Link to="/login" className="text-dodgerblue hover:underline">{t('login')}</Link> to post comments.
                    </div>
                )}

                <div className="space-y-4">
                    {comments.length === 0 && <p className="text-gray-500 text-sm">No comments yet.</p>}
                    {comments.map(c => (
                        <div key={c.id} className="bg-white/5 p-4 rounded-xl border border-white/5 group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    {c.userAvatar ? (
                                        <img src={c.userAvatar} className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><UserIcon className="w-4 h-4" /></div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-gray-200">{c.username}</span>
                                            {renderRoleBadge(c.userRole)}
                                        </div>
                                        <div className="text-[10px] text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                {user && (user.role === 'admin' || user.role === 'mod') && (
                                    <button 
                                        onClick={() => handleDeleteComment(c.id)}
                                        className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title={t('delete')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm ml-11">{c.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
            {content.type === 'series' && content.episodes ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[800px] overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-dodgerblue" /> {t('episodes')}
                    </h3>
                    
                    {/* Season Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 hide-scrollbar">
                        {Object.keys(groupedEpisodes).map(seasonNum => (
                            <button
                                key={seasonNum}
                                onClick={() => setActiveSeason(parseInt(seasonNum))}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeSeason === parseInt(seasonNum) ? 'bg-dodgerblue text-white' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                            >
                                {t('season')} {seasonNum}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {groupedEpisodes[activeSeason]?.map(ep => (
                            <button
                                key={ep.id}
                                onClick={() => setActiveEpisode(ep)}
                                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                                    activeEpisode?.id === ep.id 
                                    ? 'bg-dodgerblue/20 border border-dodgerblue/50' 
                                    : 'bg-black/20 border border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center shrink-0">
                                    {activeEpisode?.id === ep.id ? <PlayCircle className="w-5 h-5 text-dodgerblue" /> : <span className="text-xs text-gray-500">{ep.episodeNumber}</span>}
                                </div>
                                <div>
                                    <div className={`text-sm font-medium ${activeEpisode?.id === ep.id ? 'text-white' : 'text-gray-300'}`}>
                                        {ep.title}
                                    </div>
                                    <div className="text-xs text-gray-500">{t('season')} {ep.seasonNumber} • {t('episode')} {ep.episodeNumber}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                    <p className="text-gray-500">
                        {content.type === 'tv' ? 'You are watching a live stream.' : 'Enjoy the movie!'}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Watch;
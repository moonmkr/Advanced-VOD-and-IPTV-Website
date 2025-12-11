import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, FileQuestion, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { dataService } from '../services/dataService';
import { ContentRequest } from '../types';

const RequestContent: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [myRequests, setMyRequests] = useState<ContentRequest[]>([]);
  
  // Anti-spam & Captcha
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, ans: 0 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const user = dataService.getCurrentUserSync();
    if (!user) {
        navigate('/login');
    } else {
        refreshMyRequests(user.id);
        generateCaptcha();
    }
  }, [navigate]);

  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
        interval = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const refreshMyRequests = async (userId: string) => {
      setMyRequests(await dataService.getUserRequests(userId));
  };

  const generateCaptcha = () => {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      setCaptcha({ a, b, ans: a + b });
      setCaptchaInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Cooldown check
    if (Date.now() - lastRequestTime < 20000) {
        alert("Please wait 20 seconds before sending another request.");
        return;
    }

    // Captcha Check
    if (parseInt(captchaInput) !== captcha.ans) {
        alert("Incorrect Captcha. Please try again.");
        generateCaptcha();
        return;
    }

    if (!title) return;
    
    await dataService.addRequest(title, desc);
    setSubmitted(true);
    setTitle('');
    setDesc('');
    setLastRequestTime(Date.now());
    setCooldown(20);
    
    // Refresh list
    const user = dataService.getCurrentUserSync();
    if (user) refreshMyRequests(user.id);

    generateCaptcha();
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-dodgerblue/20 rounded-full flex items-center justify-center mb-4">
              <FileQuestion className="w-8 h-8 text-dodgerblue" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Request Content</h2>
          <p className="text-gray-400">Can't find a movie or show? Let the admins know!</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Form Side */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl h-fit">
            <h3 className="text-xl font-bold mb-6">New Request</h3>
            
            {submitted ? (
                <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-xl text-center animate-pulse">
                    Request submitted successfully!
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Title</label>
                        <input 
                            type="text" 
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-dodgerblue focus:outline-none text-white"
                            placeholder="Movie or Series Name"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Additional Info</label>
                        <textarea 
                            rows={3}
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-dodgerblue focus:outline-none text-white"
                            placeholder="Year, IMDB Link, or specific details..."
                        />
                    </div>

                    {/* Captcha */}
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-1">Human Check</label>
                            <div className="flex items-center gap-3">
                                <span className="bg-white/10 px-3 py-2 rounded-lg font-mono text-lg font-bold">{captcha.a} + {captcha.b} = ?</span>
                                <input 
                                    type="number"
                                    required
                                    value={captchaInput}
                                    onChange={e => setCaptchaInput(e.target.value)}
                                    className="w-20 bg-black/40 border border-white/10 rounded-xl px-4 py-2 focus:border-dodgerblue focus:outline-none text-white text-center"
                                />
                                <button type="button" onClick={generateCaptcha} className="text-gray-400 hover:text-white"><RotateCcw className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={cooldown > 0}
                        className={`w-full font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(30,144,255,0.3)] mt-4 flex items-center justify-center gap-2 ${cooldown > 0 ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-dodgerblue hover:bg-blue-600 text-white'}`}
                    >
                        {cooldown > 0 ? (
                            <><Clock className="w-4 h-4 animate-spin" /> Wait {cooldown}s</>
                        ) : (
                            <><Send className="w-4 h-4" /> Submit Request</>
                        )}
                    </button>
                </form>
            )}
          </div>

          {/* List Side */}
          <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">My History <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">{myRequests.length}</span></h3>
              <div className="space-y-4">
                  {myRequests.length === 0 && <div className="text-gray-500 italic">No requests yet.</div>}
                  {myRequests.map(req => (
                      <div key={req.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-start justify-between gap-4">
                          <div>
                              <div className="font-bold text-lg">{req.title}</div>
                              <div className="text-sm text-gray-400 mb-2">{req.description}</div>
                              <div className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</div>
                          </div>
                          <div className="shrink-0">
                              {req.status === 'pending' && <span className="flex items-center gap-1 text-yellow-400 text-sm font-bold bg-yellow-400/10 px-2 py-1 rounded"><Clock className="w-3 h-3" /> Pending</span>}
                              {req.status === 'approved' && <span className="flex items-center gap-1 text-green-400 text-sm font-bold bg-green-400/10 px-2 py-1 rounded"><CheckCircle className="w-3 h-3" /> Added</span>}
                              {req.status === 'rejected' && <span className="flex items-center gap-1 text-red-400 text-sm font-bold bg-red-400/10 px-2 py-1 rounded"><XCircle className="w-3 h-3" /> Rejected</span>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default RequestContent;
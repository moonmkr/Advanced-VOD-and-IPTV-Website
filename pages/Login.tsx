import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { user, error } = await dataService.login(username, password);
    setLoading(false);
    if (user) {
        navigate('/');
    } else {
        setError(error || 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl w-full max-w-md backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-gray-400">Login to your eddit.site account</p>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-center text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Username" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-dodgerblue focus:outline-none text-white"
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-dodgerblue focus:outline-none text-white"
                />
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-dodgerblue hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(30,144,255,0.3)] mt-4 flex justify-center items-center">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
            </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account? <Link to="/register" className="text-dodgerblue hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
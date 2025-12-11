import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
    }
    if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
    }
    if (!email.includes('@')) {
        setError('Invalid email address');
        return;
    }

    setLoading(true);
    const success = await dataService.register(username, password, email);
    if (success) {
        await dataService.login(username, password);
        setLoading(false);
        navigate('/');
    } else {
        setLoading(false);
        setError('Username already taken');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white/5 border border-white/10 p-8 rounded-2xl w-full max-w-md backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Create Account</h2>
            <p className="text-gray-400">Join the eddit.site community</p>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-center text-sm">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
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
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
            </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="text-dodgerblue hover:underline">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
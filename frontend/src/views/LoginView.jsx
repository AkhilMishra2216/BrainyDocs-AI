import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LoginView({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Authentication failed');
      } else {
        if (isLogin) {
          onLoginSuccess(data.user);
        } else {
          setIsLogin(true); // Switch to login after successful register
          setError('Registration successful. Please log in.');
        }
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c16] text-white relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] bg-clip-text text-transparent">
            DocuMind AI
          </h1>
          <p className="text-[#8b9bb4] text-sm mt-2">Enter the Luminescent Void.</p>
        </div>

        {/* Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px] bg-[#0f1423]/90 backdrop-blur-xl rounded-[24px] p-8 border border-white/5 shadow-2xl relative"
        >
          {/* Subtle inner glow */}
          <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_0_40px_rgba(139,92,246,0.03)] pointer-events-none" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            {error && (
              <div className="text-[#f87171] text-xs text-center p-2 bg-red-400/10 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-[#6b7c9b] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full bg-[#05070e] border border-transparent focus:border-[#8b5cf6]/50 rounded-lg px-4 py-3 text-sm text-white placeholder-[#3b4c6b] outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-semibold text-[#6b7c9b] uppercase tracking-wider">
                  Password
                </label>
                {isLogin && (
                  <button type="button" className="text-[10px] text-[#6b7c9b] hover:text-white transition-colors bg-transparent border-none cursor-pointer">
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#05070e] border border-transparent focus:border-[#8b5cf6]/50 rounded-lg px-4 py-3 text-sm text-white placeholder-[#3b4c6b] tracking-widest outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-[#b096fa] to-[#9f75f7] hover:from-[#c2adfa] hover:to-[#ae8bf8] text-[#1a103c] font-semibold rounded-full py-3 text-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] cursor-pointer"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-[1px] bg-white/5" />
              <span className="text-[10px] text-[#3b4c6b] uppercase font-medium">Or</span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            <button
              type="button"
              className="w-full bg-[#13192b] hover:bg-[#1a2138] border border-white/5 rounded-full py-3 text-sm font-medium text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </form>
        </motion.div>

        <p className="mt-8 text-[11px] text-[#6b7c9b]">
          {isLogin ? "New to the sanctuary? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#a78bfa] hover:text-white transition-colors font-medium cursor-pointer bg-transparent border-none p-0"
          >
            {isLogin ? "Sign up for an account" : "Sign in to your account"}
          </button>
        </p>

      </main>

      {/* Footer */}
      <footer className="w-full px-8 py-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[11px] text-[#3b4c6b] relative z-10 bg-[#060810]/50">
        <div className="font-bold text-white text-xs mb-4 md:mb-0">DocuMind AI</div>
        
        <div className="flex gap-6 mb-4 md:mb-0">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Security</a>
          <a href="#" className="hover:text-white transition-colors">Status</a>
        </div>
        
        <div>© 2024 DocuMind AI. Built for the Luminescent Void.</div>
      </footer>
    </div>
  );
}

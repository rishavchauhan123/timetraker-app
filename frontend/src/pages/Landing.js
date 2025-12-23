import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Clock, TrendingUp, Calendar, Download } from 'lucide-react';

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(name, email, password);
        toast.success('Account created successfully!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-600">Time Tracking Platform</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Track Time.
                <br />
                <span className="text-indigo-600">Boost Productivity.</span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                The modern time tracking platform for professionals. Start, pause, and analyze your work with precision. Get detailed insights and export reports effortlessly.
              </p>

              {/* Features */}
              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Live Analytics</h3>
                    <p className="text-sm text-slate-600">Real-time insights on your productivity</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Smart Reports</h3>
                    <p className="text-sm text-slate-600">Daily, weekly, and monthly summaries</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Easy Export</h3>
                    <p className="text-sm text-slate-600">Download data as CSV or PDF</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Precise Timer</h3>
                    <p className="text-sm text-slate-600">Accurate tracking down to the second</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Auth Form */}
            <div className="lg:pl-12">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {isLogin ? 'Welcome Back' : 'Get Started'}
                  </h2>
                  <p className="text-slate-600">
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        data-testid="name-input"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="email-input"
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-testid="password-input"
                      className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    data-testid="submit-button"
                    className="w-full h-11 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    data-testid="toggle-auth-mode"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                </div>
              </div>

              {/* Demo credentials hint */}
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 mb-1 font-medium">Quick Demo:</p>
                <p className="text-xs text-slate-500">Create an account to explore the platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, Home } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-brand-primary p-4 rounded-2xl">
              <Home className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Welkom terug
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Log in om door te gaan
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                placeholder="jouw@email.nl"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
            >
              <LogIn className="w-5 h-5" />
              {loading ? 'Bezig met inloggen...' : 'Inloggen'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Nog geen account?{' '}
              <Link to="/register" className="text-brand-primary hover:text-blue-700 font-semibold">
                Registreer nu
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-gray-600 text-sm">
          De slimste offerte tool voor isolatie en kozijnen professionals
        </p>
      </div>
    </div>
  );
}

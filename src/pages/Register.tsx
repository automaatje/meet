import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserPlus, Home } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens lang zijn');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email: email,
      });

      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-brand-secondary p-4 rounded-2xl">
              <Home className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
            Account aanmaken
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Start met professionele offertes
          </p>

          <form onSubmit={handleRegister} className="space-y-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="Minimaal 6 tekens"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Bevestig wachtwoord
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                placeholder="Herhaal wachtwoord"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-secondary hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Account aanmaken...' : 'Registreren'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Al een account?{' '}
              <Link to="/login" className="text-brand-primary hover:opacity-80 font-semibold">
                Log in
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import { authService } from '../services/auth.service';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const data = await authService.login(formData);

    const userRole       = data.user?.role || data.role;
    const etatValidation = data.user?.etatValidation || data.etatValidation;

    // Persist what you need
    if (userRole)        localStorage.setItem('userRole', userRole);
    if (data.token)      localStorage.setItem('token', data.token);   // needed for API calls
    if (etatValidation)  localStorage.setItem('etatValidation', etatValidation);

    // REDIRECT BASED ON ROLE + VALIDATION STATE
    if (userRole === 'recruteur') {
      if (etatValidation === 'valideParAdmin') {
        navigate('/recruiter-dashboard');
      } else {
        // enAttente, valideParIA, or refuse → show verification page
        navigate('/unverifiedRecruteur');
      }
    } else {
      navigate('/dashboard');
    }

  } catch (err) {
    setError(err.response?.data?.message || 'Une erreur est survenue lors de la connexion.');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      
      <div className="mb-8 cursor-pointer flex justify-center hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
        <Logo />
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-md animate-fade-in">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Bon retour !</h2>
          <p className="text-slate-500">Connectez-vous pour accéder à votre espace.</p>
        </div>

        {/* Display Error Message if it exists */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vous@email.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-700"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Oublié ?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-slate-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-600 text-sm">
            Pas encore de compte ?{' '}
            <button 
              onClick={() => navigate('/register')} 
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              S'inscrire
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
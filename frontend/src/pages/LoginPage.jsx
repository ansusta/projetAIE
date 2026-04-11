import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, we just prevent the page reload. 
    // Later, this is where you'll call your backend API!
    console.log("Login attempted with:", formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      
      {/* Clickable Logo to return home */}
      <div className="mb-8 cursor-pointer flex justify-center hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
        <Logo />
      </div>

      {/* Login Card */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl shadow-blue-900/10 w-full max-w-md animate-fade-in">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Bon retour !</h2>
          <p className="text-slate-500">Connectez-vous pour accéder à votre espace.</p>
        </div>

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
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3.5 rounded-xl font-medium transition-all duration-300 shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 mt-4"
          >
            Se connecter
          </button>
        </form>

        {/* Link to Registration */}
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
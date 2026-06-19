import React, { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Film, AlertCircle } from 'lucide-react';

export default function Register() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const passwordConfirmRef = useRef();
  const { signup } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (passwordRef.current.value !== passwordConfirmRef.current.value) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      await signup(emailRef.current.value, passwordRef.current.value);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-dark-900">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/20 blur-[120px] mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen pointer-events-none"></div>

      <div className="w-full max-w-md">
        <div className="glass-panel rounded-2xl p-8 relative z-10">
          <div className="flex justify-center mb-6 space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Film className="text-white w-6 h-6" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center text-white mb-2">Create Account</h2>
          <p className="text-slate-400 text-center mb-8">Start tracking your books and movies</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text">Email</label>
              <input
                type="email"
                ref={emailRef}
                required
                className="input-field"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="label-text">Password</label>
              <input
                type="password"
                ref={passwordRef}
                required
                className="input-field"
                placeholder="Create a password"
              />
            </div>
            <div>
              <label className="label-text">Confirm Password</label>
              <input
                type="password"
                ref={passwordConfirmRef}
                required
                className="input-field"
                placeholder="Confirm your password"
              />
            </div>
            
            <button
              disabled={loading}
              type="submit"
              className="btn-primary w-full mt-2"
            >
              Sign Up
            </button>
          </form>

          <div className="mt-6 text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

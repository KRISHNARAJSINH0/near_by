'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setErrorMsg('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-fuchsia-600/10 rounded-full filter blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full space-y-6 bg-zinc-900/40 backdrop-blur-xl border border-white/8 p-8 rounded-3xl shadow-2xl relative">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 items-center justify-center shadow-lg shadow-violet-500/20 mb-4">
            <span className="font-extrabold text-white text-xl">GT</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Welcome back</h2>
          <p className="mt-2 text-xs text-zinc-400">
            Sign in to access your GeoTeam dashboard and workspaces
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@geoteam.com"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl text-sm font-extrabold hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-600/15 focus:outline-none disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loginLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2">
          New to GeoTeam?{' '}
          <Link href="/register" className="font-bold text-violet-400 hover:text-violet-300">
            Register and Geotag Profile
          </Link>
        </div>
      </div>
    </main>
  );
}

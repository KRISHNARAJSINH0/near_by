'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Compass, Sparkles, MapPin, MessageSquare, Shield, Users } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full filter blur-3xl -z-10 animate-pulse" style={{ animationDelay: '3s' }}></div>

      {/* Floating Header */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg">
            <span className="font-extrabold text-white text-lg">GT</span>
          </div>
          <span className="font-black text-xl tracking-tight">Geo<span className="text-violet-400">Team</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 transition-colors">
            Login
          </Link>
          <Link href="/register" className="text-xs font-bold bg-violet-600 px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/10">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center flex-1 flex flex-col justify-center items-center z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-extrabold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-time co-founder matching</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-3xl">
          Discover and Build Teams <span className="text-gradient">Right in Your Neighborhood</span>
        </h1>
        
        <p className="mt-6 text-sm md:text-base text-zinc-400 max-w-xl leading-relaxed">
          GeoTeam maps out startup nodes, hackathon team polls, and collaborative developers 
          within your local vicinity. Find partners, review profiles, and join real-time chat rooms.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none">
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-extrabold rounded-xl hover:from-violet-700 hover:to-fuchsia-700 shadow-xl shadow-violet-600/20 transition-all text-center"
          >
            {isAuthenticated ? 'Go to My Dashboard' : 'Create Geotagged Profile'}
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-zinc-900 border border-white/5 text-sm font-extrabold rounded-xl hover:bg-zinc-800 transition-colors text-center"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Radius Proximity</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Query Firestore using a bounding box and Haversine distance filters. Select scanning zones from 2km up to 25km.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-fuchsia-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Hackathon / Startup Polls</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Launch project recruitment polls. Choose specific domains (college, startups, hackathons) with color indicators on maps.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Real-time Sockets</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Instantly connect to private chat workspaces, message notifications, typing statuses, and automated nearby triggers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600 z-10 mt-auto">
        &copy; {new Date().getFullYear()} GeoTeam Platform. Designed for modern web developers.
      </footer>
    </main>
  );
}

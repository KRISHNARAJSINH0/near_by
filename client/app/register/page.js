'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { Sparkles, User, Mail, Lock, Code, Award, Github, Linkedin, MapPin, Navigation, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { register, isAuthenticated, authError } = useAuth();
  const { location, error: locError, activePresetName } = useLocation();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    bio: '',
    skills: '',
    experienceLevel: 'Beginner',
    github: '',
    linkedin: '',
    latitude: 19.0760,
    longitude: 72.8777
  });

  const [regLoading, setRegLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Keep coords in sync with LocationContext
  useEffect(() => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        latitude: location.latitude,
        longitude: location.longitude
      }));
    }
  }, [location]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setErrorMsg('');

    try {
      await register({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude)
      });
      router.push('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full filter blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-xl w-full space-y-6 bg-zinc-900/40 backdrop-blur-xl border border-white/8 p-8 rounded-3xl shadow-2xl relative">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 items-center justify-center shadow-lg shadow-violet-500/20 mb-4">
            <span className="font-extrabold text-white text-xl">GT</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Create your Profile</h2>
          <p className="mt-2 text-xs text-zinc-400">
            Join GeoTeam to discover nearby hackathon and startup co-founders
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-xs font-semibold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Alice Cooper"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alice@geoteam.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Profile fields */}
          <div>
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Short Bio</label>
            <textarea
              name="bio"
              rows="2"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell other devs about your background..."
              className="w-full px-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Skills (comma separated)</label>
              <div className="relative">
                <Code className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="React, Node, Figma"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-1">Experience Level</label>
              <div className="relative">
                <Award className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                >
                  <option value="Beginner">Beginner / Student</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Senior">Senior Developer</option>
                  <option value="Lead">Lead Architect / CTO</option>
                </select>
              </div>
            </div>
          </div>

          {/* Socials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Github className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleChange}
                placeholder="GitHub Profile Link"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Linkedin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="LinkedIn Profile Link"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Geo location hud during registration */}
          <div className="p-3.5 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-violet-400 animate-pulse" />
              <div>
                <span className="font-bold text-white block">Geotagging Active</span>
                <span className="text-[10px] text-zinc-400">Preserving coordinates for map discovery</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-violet-300 font-bold block">{activePresetName}</span>
              <span className="text-[9px] text-zinc-500">{formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={regLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl text-sm font-extrabold hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-600/15 focus:outline-none disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {regLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Geotagging Profile...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Register & Geotag Me</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2">
          Already registered?{' '}
          <Link href="/login" className="font-bold text-violet-400 hover:text-violet-300">
            Login to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

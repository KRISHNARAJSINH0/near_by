'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Github, Linkedin, Award, Code, Briefcase, User, Edit3, Save, MapPin, Loader2, Link as LinkIcon, Sparkles } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProfilePage({ params }) {
  const unwrappedParams = use(params);
  const profileId = unwrappedParams.id;
  const { user: currentUser, updateProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: '',
    experienceLevel: '',
    github: '',
    linkedin: '',
    completedProjects: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading]);

  const loadProfile = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/profile/${profileId}`);
      setProfile(response.data);
      
      // Initialize edit form details
      setFormData({
        name: response.data.name || '',
        bio: response.data.bio || '',
        skills: response.data.skills?.join(', ') || '',
        experienceLevel: response.data.experienceLevel || 'Beginner',
        github: response.data.github || '',
        linkedin: response.data.linkedin || '',
        completedProjects: response.data.completedProjects?.join(', ') || ''
      });
    } catch (err) {
      console.error('Failed to load developer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadProfile();
      setIsEditing(false);
    }
  }, [currentUser, profileId]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      // Split comma separated list items into arrays
      const projectsArr = formData.completedProjects
        ? formData.completedProjects.split(',').map(p => p.trim()).filter(Boolean)
        : [];

      const updatedUser = await updateProfile({
        ...formData,
        completedProjects: projectsArr
      });

      // Update current displayed profile state
      setProfile(updatedUser);
      setIsEditing(false);
    } catch (err) {
      alert(err.message || 'Failed to save updates.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (authLoading || !currentUser || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <span className="text-sm text-zinc-400">Loading developer card portfolio...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex">
          <Sidebar />
          <div className="flex-1 p-8 text-center text-zinc-500">Developer profile not found.</div>
        </div>
      </div>
    );
  }

  const isOwner = currentUser.uid === profile.uid;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
          
          {/* Main profile card */}
          <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/8 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full filter blur-3xl"></div>
            
            {!isEditing ? (
              // Read View
              <div className="space-y-6 relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <img
                      src={profile.profilePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.name}`}
                      alt={profile.name}
                      className="w-20 h-20 rounded-2xl object-cover ring-4 ring-violet-500/10 shadow-2xl shrink-0"
                    />
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h1 className="text-2xl font-black text-white">{profile.name}</h1>
                        <span className="bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded text-[10px] font-bold">
                          {profile.experienceLevel}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 flex items-center justify-center sm:justify-start gap-1 mt-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-violet-400" /> Lat: {profile.latitude.toFixed(4)}, Lng: {profile.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-zinc-900 border border-white/5 text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Edit3 className="w-4 h-4 text-violet-400" /> Edit Profile Details
                    </button>
                  )}
                </div>

                <div className="space-y-2 border-t border-white/5 pt-5">
                  <h3 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Bio Biography</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    {profile.bio || "This developer hasn't configured a bio details yet."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/5 pt-5">
                  <div>
                    <h3 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider mb-2">Skills Badges</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills && profile.skills.length > 0 ? (
                        profile.skills.map((s, i) => (
                          <span key={i} className="text-xs font-semibold text-zinc-300 bg-zinc-950 border border-white/5 px-3 py-1 rounded-lg">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-zinc-600">No skills listed yet</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider mb-2.5">Portfolio Socials</h3>
                    <div className="flex items-center gap-3">
                      {profile.github ? (
                        <a
                          href={profile.github}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-xl bg-zinc-950 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Github className="w-5 h-5" />
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-600 italic">No GitHub</span>
                      )}
                      {profile.linkedin ? (
                        <a
                          href={profile.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-xl bg-zinc-950 border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-600 italic">No LinkedIn</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Projects section */}
                <div className="border-t border-white/5 pt-5 space-y-3">
                  <h3 className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-violet-400" /> Completed Projects & Portfolio
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.completedProjects && profile.completedProjects.length > 0 ? (
                      profile.completedProjects.map((p, i) => (
                        <div key={i} className="bg-zinc-950/60 border border-white/4 p-4 rounded-xl flex items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-white block">{p}</span>
                            <span className="text-[10px] text-zinc-500 block mt-0.5">Developer Project Node</span>
                          </div>
                          <LinkIcon className="w-4 h-4 text-violet-400" />
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 italic col-span-2">No completed projects compiled yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Edit Form View
              <form onSubmit={handleSave} className="space-y-6 relative z-10">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-2">
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" /> Edit Developer Portfolio
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 bg-zinc-900 border border-white/5 text-zinc-400 text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1"
                    >
                      {saveLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">Developer Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 bg-zinc-950/60 border border-white/5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">CTO/Architect Experience Level</label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 bg-zinc-950/60 border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                    >
                      <option value="Beginner">Beginner / Student</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Senior">Senior Developer</option>
                      <option value="Lead">Lead Architect / CTO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">Developer Biography</label>
                  <textarea
                    name="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2 bg-zinc-950/60 border border-white/5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">Skills (comma separated)</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 bg-zinc-950/60 border border-white/5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">Completed Projects (comma separated)</label>
                    <input
                      type="text"
                      name="completedProjects"
                      value={formData.completedProjects}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 bg-zinc-950/60 border border-white/5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">GitHub Profile Link</label>
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 bg-zinc-950/60 border border-white/5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block mb-1">LinkedIn Profile Link</label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 bg-zinc-950/60 border border-white/5 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

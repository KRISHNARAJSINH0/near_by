'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Map, MessageSquare, User, Settings, ShieldQuestion } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard'
    },
    {
      name: 'Proximity Map',
      icon: Map,
      path: '/map'
    },
    {
      name: 'Team Chats',
      icon: MessageSquare,
      path: '/chat'
    },
    {
      name: 'Developer Profile',
      icon: User,
      path: `/profile/${user.uid}`
    }
  ];

  return (
    <aside className="w-full md:w-64 border-r border-white/8 bg-zinc-950/40 backdrop-blur-md p-4 flex md:flex-col justify-between shrink-0">
      <div className="flex md:flex-col items-center md:items-stretch w-full gap-2 md:space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600/30 to-fuchsia-500/10 border border-violet-500/30 text-white shadow-inner shadow-violet-500/5'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
              <span className="hidden md:inline-block">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="hidden md:flex flex-col gap-3 p-3 border-t border-white/5 mt-auto">
        <div className="glass-panel p-3.5 rounded-xl text-[10px] text-zinc-500 leading-normal border border-white/4">
          <div className="flex items-center gap-1.5 text-violet-400 font-bold uppercase mb-1 tracking-wider">
            <ShieldQuestion className="w-3.5 h-3.5" />
            <span>Scanning Radius</span>
          </div>
          <p>
            Your current location is broadcasting alerts in real-time. Change simulated coordinates in the navbar.
          </p>
        </div>
      </div>
    </aside>
  );
}

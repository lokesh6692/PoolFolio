'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  PieChart,
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  Copy,
  Check,
  LogOut,
  Users,
  Menu,
  X,
  Layers,
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copyInviteCode = async () => {
    if (!user?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(user.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: PieChart },
    { name: 'Contributions', href: '/contributions', icon: Wallet },
    { name: 'Trades & Holdings', href: '/trades', icon: ArrowLeftRight },
    { name: 'Valuations & P&L', href: '/valuations', icon: TrendingUp },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Group Info */}
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                PoolFolio
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200 max-w-[140px] truncate">
                  {user.groupName}
                </span>
                <span className="text-slate-600">|</span>
                <button
                  onClick={copyInviteCode}
                  className="inline-flex items-center space-x-1 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  title="Click to copy 6-digit Invite Code"
                >
                  <span>{user.inviteCode}</span>
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-400" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-emerald-400 shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User profile & Logout */}
          <div className="hidden md:flex items-center space-x-3">
            {user && (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-800">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white leading-none">
                    {user.displayName}
                  </span>
                  <div className="mt-0.5">
                    <Badge variant={user.role === 'ADMIN' ? 'indigo' : 'slate'} size="sm">
                      {user.role}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <button
                onClick={copyInviteCode}
                className="flex items-center space-x-1 text-xs font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-cyan-400"
              >
                <span>{user.inviteCode}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0c121e] px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          {user && (
            <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">{user.displayName}</div>
                <div className="text-xs text-slate-400">{user.groupName} • {user.role}</div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center space-x-1 text-xs text-rose-400 font-semibold px-3 py-1.5 rounded bg-rose-500/10 border border-rose-500/20"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

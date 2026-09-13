'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Layers, Eye, EyeOff, Loader2, AlertCircle, PlusCircle, Users } from 'lucide-react';

export default function SignupPage() {
  const { signupCreateGroup, signupJoinGroup } = useAuth();
  const [tab, setTab] = useState<'create' | 'join'>('create');

  // Shared fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Tab specific fields
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'create') {
        if (!groupName.trim()) {
          throw new Error('Group name is required');
        }
        await signupCreateGroup({
          displayName,
          email,
          password,
          groupName: groupName.trim(),
        });
      } else {
        if (!inviteCode.trim() || inviteCode.trim().length !== 6) {
          throw new Error('Please enter a valid 6-character invite code');
        }
        await signupJoinGroup({
          displayName,
          email,
          password,
          inviteCode: inviteCode.trim().toUpperCase(),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-[#090d16] relative overflow-hidden py-12">
      {/* Background glow */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 items-center justify-center text-slate-950 font-black shadow-xl shadow-emerald-500/20 mb-3">
            <Layers className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Get started with PoolFolio
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Pool funds, execute trades, and track proportional P&L with friends.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setError(null);
            }}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'create'
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Pool</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setError(null);
            }}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === 'join'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Join with Code</span>
          </button>
        </div>

        <div className="glass-panel p-8 shadow-2xl border border-slate-800/80">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <input
                id="displayName"
                type="text"
                required
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Kumar"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder-slate-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder-slate-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm pr-11 placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === 'create' ? (
              <div>
                <label htmlFor="groupName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Pool / Group Name
                </label>
                <input
                  id="groupName"
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Alpha Bull Syndicate"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder-slate-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  You will be assigned the Group Admin role and receive an invite code to share.
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="inviteCode" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  6-Character Invite Code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  required
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A9B2X7"
                  className="w-full px-4 py-2.5 rounded-xl glass-input font-mono text-center tracking-widest text-base font-bold text-cyan-400 placeholder-slate-600 uppercase"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Ask your pool group admin for their 6-character code.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>{tab === 'create' ? 'Create Pool & Join as Admin' : 'Join Pool Group'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

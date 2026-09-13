import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'cyan' | 'indigo' | 'amber' | 'rose' | 'slate';
}

const variantStyles = {
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    glow: 'hover:border-emerald-500/30',
  },
  cyan: {
    iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    glow: 'hover:border-cyan-500/30',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    glow: 'hover:border-indigo-500/30',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    glow: 'hover:border-amber-500/30',
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    glow: 'hover:border-rose-500/30',
  },
  slate: {
    iconBg: 'bg-slate-800 text-slate-300 border border-slate-700',
    glow: 'hover:border-slate-600',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'slate' }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`glass-panel p-5 transition-all duration-300 ${styles.glow} flex flex-col justify-between hover:translate-y-[-2px]`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2 rounded-xl ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">{value}</div>
        {subtitle && <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

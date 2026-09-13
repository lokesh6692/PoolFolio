'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { PortfolioSummaryResponse, ValuationSnapshotResponse } from '@/types/api';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  Wallet,
  TrendingUp,
  Landmark,
  PieChart as PieIcon,
  PlusCircle,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertCircle,
  Layers,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const CHART_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PortfolioSummaryResponse | null>(null);
  const [latestValuation, setLatestValuation] = useState<ValuationSnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Snapshot modal state
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [newSnapshotValue, setNewSnapshotValue] = useState('');
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [summaryRes, valuationRes] = await Promise.allSettled([
        api.portfolio.getSummary(),
        api.valuations.getLatest(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value);
      } else {
        console.warn('Portfolio summary failed', summaryRes.reason);
      }

      if (valuationRes.status === 'fulfilled') {
        setLatestValuation(valuationRes.value);
      } else {
        // Valuations may be empty initially if no snapshot taken yet
        setLatestValuation(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load portfolio dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTriggerSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSnapshotError(null);
    setSnapshotLoading(true);

    try {
      const val = parseFloat(newSnapshotValue);
      if (isNaN(val) || val <= 0) {
        throw new Error('Please enter a valid total portfolio value greater than 0');
      }

      await api.valuations.createSnapshot({
        totalValue: val,
        snapshotAt: new Date().toISOString(),
      });

      setSnapshotModalOpen(false);
      setNewSnapshotValue('');
      fetchData();
    } catch (err: any) {
      setSnapshotError(err.message || 'Failed to create valuation snapshot');
    } finally {
      setSnapshotLoading(false);
    }
  };

  // Find current user's profit share in latest valuation
  const myShare = latestValuation?.memberShares.find((m) => m.memberId === user?.memberId);

  // Allocation pie chart data
  const allocationData = summary
    ? [
        { name: 'Stock Holdings', value: Number(summary.stockHoldingsValue || 0), color: '#10b981' },
        { name: 'IPO Holdings', value: Number(summary.ipoHoldingsValue || 0), color: '#06b6d4' },
        { name: 'Available Cash', value: Number(summary.availableCash || 0), color: '#6366f1' },
      ].filter((item) => item.value > 0)
    : [];

  // Member unit share comparison data
  const memberShareData =
    latestValuation?.memberShares.map((m) => ({
      name: m.memberDisplayName,
      percentage: Number(m.unitSharePercentage || 0),
      currentValue: Number(m.currentValue || 0),
      contributed: Number(m.totalContributed || 0),
    })) || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header with Title & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Pool Dashboard</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Live Overview
              </span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Real-time cash solvency, aggregate positions, and proportional member returns.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl glass-panel text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={() => setSnapshotModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Snapshot Valuation</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Hero Portfolio Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Contributed"
            value={formatCurrency(summary?.totalContributed)}
            subtitle="Net deposits across all members"
            icon={Wallet}
            variant="emerald"
          />
          <StatCard
            title="Stock Holdings"
            value={formatCurrency(summary?.stockHoldingsValue)}
            subtitle="Aggregate equity cost basis"
            icon={TrendingUp}
            variant="cyan"
          />
          <StatCard
            title="IPO Holdings"
            value={formatCurrency(summary?.ipoHoldingsValue)}
            subtitle="Allocated to active IPOs"
            icon={Landmark}
            variant="amber"
          />
          <StatCard
            title="Available Cash"
            value={formatCurrency(summary?.availableCash)}
            subtitle="Contributed − (Stocks + IPOs)"
            icon={Layers}
            variant="indigo"
          />
        </div>

        {/* Personal "My Share" Highlight Banner */}
        {myShare && (
          <div className="glass-panel-elevated p-6 border-emerald-500/30 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    My Personal Stake
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Member ID #{myShare.memberId}
                  </span>
                </div>
                <div className="mt-2 text-3xl font-extrabold font-mono text-white">
                  {formatCurrency(myShare.currentValue)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Holding <span className="font-bold text-white font-mono">{Number(myShare.unitsHeld).toFixed(2)} units</span> ({formatPercent(myShare.unitSharePercentage)} of pool)
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6">
                <div>
                  <span className="text-xs text-slate-400">Total Contributed</span>
                  <div className="text-base font-bold font-mono text-slate-200">
                    {formatCurrency(myShare.totalContributed)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Invested Share</span>
                  <div className="text-base font-bold font-mono text-slate-200">
                    {formatCurrency(myShare.totalInvested)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Realized P&L</span>
                  <div className={`text-base font-bold font-mono flex items-center ${
                    Number(myShare.realizedProfitLoss) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {Number(myShare.realizedProfitLoss) >= 0 ? '+' : ''}
                    {formatCurrency(myShare.realizedProfitLoss)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Net Profit / Loss</span>
                  <div className={`text-base font-bold font-mono flex items-center ${
                    Number(myShare.profitLoss) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {Number(myShare.profitLoss) >= 0 ? '+' : ''}
                    {formatCurrency(myShare.profitLoss)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Allocation Donut */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Asset Allocation</h3>
                <p className="text-xs text-slate-400">Capital split across stocks, IPOs, and cash</p>
              </div>
              <PieIcon className="w-5 h-5 text-slate-400" />
            </div>

            {allocationData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="glass-panel-elevated p-3 text-xs shadow-xl border border-slate-700">
                              <p className="font-bold text-white">{item.name}</p>
                              <p className="font-mono text-emerald-400 mt-1">{formatCurrency(item.value)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex items-center space-x-1.5 text-xs text-slate-300">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name} ({formatCurrency(item.value)})</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
                <p>No investment data logged yet.</p>
              </div>
            )}
          </div>

          {/* Member Ownership Breakdown */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Member Unit Shares</h3>
                <p className="text-xs text-slate-400">NAV-unit proportional stake per friend</p>
              </div>
              <Layers className="w-5 h-5 text-slate-400" />
            </div>

            {memberShareData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={memberShareData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="glass-panel-elevated p-3 text-xs shadow-xl border border-slate-700">
                              <p className="font-bold text-white">{item.name}</p>
                              <p className="text-cyan-400 mt-0.5">Share: {formatPercent(item.percentage)}</p>
                              <p className="text-emerald-400 mt-0.5">Value: {formatCurrency(item.currentValue)}</p>
                              <p className="text-slate-400 mt-0.5">Contributed: {formatCurrency(item.contributed)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="percentage" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                <p>No valuation snapshot generated yet.</p>
                <p className="mt-1 text-slate-600">
                  Click "Snapshot Valuation" to compute unit-share ratios across members.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Latest Valuation Snapshot Table */}
        <div className="glass-panel p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Latest Valuation Breakdown</span>
                {latestValuation && (
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                    Snapshot #{latestValuation.id}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {latestValuation
                  ? `Marked total pool value: ${formatCurrency(latestValuation.totalValue)} at ${formatDate(latestValuation.snapshotAt)}`
                  : 'No snapshot recorded yet. Trigger a snapshot to inspect all member shares.'}
              </p>
            </div>
          </div>

          {latestValuation && latestValuation.memberShares.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4 font-mono text-right">Units Held</th>
                    <th className="py-3 px-4 font-mono text-right">Share %</th>
                    <th className="py-3 px-4 font-mono text-right">Contributed</th>
                    <th className="py-3 px-4 font-mono text-right">Invested</th>
                    <th className="py-3 px-4 font-mono text-right">Realized P&L</th>
                    <th className="py-3 px-4 font-mono text-right">Current Value</th>
                    <th className="py-3 px-4 font-mono text-right">Total P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {latestValuation.memberShares.map((m) => {
                    const isMe = m.memberId === user?.memberId;
                    const pl = Number(m.profitLoss);
                    return (
                      <tr
                        key={m.memberId}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isMe ? 'bg-emerald-500/5 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-sans font-medium text-white flex items-center space-x-2">
                          <span>{m.memberDisplayName}</span>
                          {isMe && <Badge variant="emerald">You</Badge>}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-300">
                          {Number(m.unitsHeld).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-cyan-400 font-bold">
                          {formatPercent(m.unitSharePercentage)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-300">
                          {formatCurrency(m.totalContributed)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400">
                          {formatCurrency(m.totalInvested)}
                        </td>
                        <td className={`py-3.5 px-4 text-right ${
                          Number(m.realizedProfitLoss) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {formatCurrency(m.realizedProfitLoss)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-white">
                          {formatCurrency(m.currentValue)}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-bold ${
                          pl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">
              <p>No snapshots found. Click "Snapshot Valuation" to generate your first P&L breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Valuation Modal */}
      <Modal
        isOpen={snapshotModalOpen}
        onClose={() => setSnapshotModalOpen(false)}
        title="Trigger Valuation Snapshot"
      >
        <form onSubmit={handleTriggerSnapshot} className="space-y-4">
          <p className="text-xs text-slate-400">
            Enter the marked market valuation of the total group pool today (e.g. Current Stocks Value + IPO Value + Cash).
            The NAV-unit engine will recompute each member's profit share and equity allocation.
          </p>

          {snapshotError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {snapshotError}
            </div>
          )}

          <div>
            <label htmlFor="snapshotValue" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Total Pool Valuation (₹)
            </label>
            <input
              id="snapshotValue"
              type="number"
              step="any"
              required
              min="1"
              value={newSnapshotValue}
              onChange={(e) => setNewSnapshotValue(e.target.value)}
              placeholder="e.g. 150000"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder-slate-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setSnapshotModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={snapshotLoading}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {snapshotLoading ? 'Calculating...' : 'Create Snapshot'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

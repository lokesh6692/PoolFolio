'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { ValuationSnapshotResponse } from '@/types/api';
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Coins,
  ArrowRight,
} from 'lucide-react';

export default function ValuationsPage() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<ValuationSnapshotResponse | null>(null);
  const [snapshotIdInput, setSnapshotIdInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger snapshot modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [totalValue, setTotalValue] = useState('');
  const [snapshotAt, setSnapshotAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchLatest = useCallback(async () => {
    try {
      setError(null);
      const res = await api.valuations.getLatest();
      setSnapshot(res);
    } catch (err: any) {
      // If 404 or empty, snapshot is null
      setSnapshot(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLatest();
  };

  const handleSearchSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(snapshotIdInput.trim());
    if (isNaN(id) || id <= 0) {
      fetchLatest();
      return;
    }

    setRefreshing(true);
    try {
      setError(null);
      const res = await api.valuations.getById(id);
      setSnapshot(res);
    } catch (err: any) {
      setError(err.message || `Snapshot #${id} not found`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTriggerSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const val = parseFloat(totalValue);
      if (isNaN(val) || val <= 0) {
        throw new Error('Please enter a total value greater than 0');
      }

      const res = await api.valuations.createSnapshot({
        totalValue: val,
        snapshotAt: new Date(snapshotAt).toISOString(),
      });

      setSnapshot(res);
      setModalOpen(false);
      setTotalValue('');
    } catch (err: any) {
      setModalError(err.message || 'Failed to trigger valuation snapshot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Valuation & NAV-Unit P&L Engine</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Fair mathematical unit-share distribution protecting both early and late group contributors.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 rounded-xl glass-panel text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50"
              title="Refresh snapshot"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Record Valuation Snapshot</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Snapshot Filter / Search & Meta */}
        <div className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{snapshot ? `Snapshot #${snapshot.id}` : 'No Snapshot Available'}</span>
                {snapshot && (
                  <Badge variant="cyan">
                    Recorded {formatDate(snapshot.snapshotAt)}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {snapshot
                  ? `Marked Pool Valuation: ${formatCurrency(snapshot.totalValue)}`
                  : 'Record a snapshot to compute current proportional member equity.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchSnapshot} className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Search Snapshot ID..."
              value={snapshotIdInput}
              onChange={(e) => setSnapshotIdInput(e.target.value)}
              className="px-3 py-1.5 rounded-lg glass-input text-xs font-mono placeholder-slate-500 w-44"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Lookup
            </button>
          </form>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Member Equity & Profit Share Breakdown</h3>
              <p className="text-xs text-slate-400">
                Formula breakdown showing cash with and without realized trade profit/loss (§3.5)
              </p>
            </div>
          </div>

          {snapshot && snapshot.memberShares.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4 font-mono text-right">Units</th>
                    <th className="py-3 px-4 font-mono text-right">Unit Share %</th>
                    <th className="py-3 px-4 font-mono text-right">Total Contributed</th>
                    <th className="py-3 px-4 font-mono text-right">Total Invested</th>
                    <th className="py-3 px-4 font-mono text-right">Cash (No P&L)</th>
                    <th className="py-3 px-4 font-mono text-right">Realized P&L</th>
                    <th className="py-3 px-4 font-mono text-right">Cash (With P&L)</th>
                    <th className="py-3 px-4 font-mono text-right">Current Value</th>
                    <th className="py-3 px-4 font-mono text-right">Net Return</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {snapshot.memberShares.map((m) => {
                    const isMe = m.memberId === user?.memberId;
                    const pl = Number(m.profitLoss);
                    const realPl = Number(m.realizedProfitLoss);
                    return (
                      <tr
                        key={m.memberId}
                        className={`hover:bg-slate-800/30 transition-colors ${
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
                        <td className="py-3.5 px-4 text-right text-slate-400">
                          {formatCurrency(m.availableCashWithoutPl)}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-bold ${
                          realPl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {realPl >= 0 ? '+' : ''}{formatCurrency(realPl)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-indigo-300 font-bold">
                          {formatCurrency(m.availableCashWithPl)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                          {formatCurrency(m.currentValue)}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-bold text-sm ${
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
              <p>No valuation snapshots available.</p>
              <p className="text-xs text-slate-600 mt-1">
                Trigger a snapshot to run the unit-share proportional allocation engine.
              </p>
            </div>
          )}
        </div>

        {/* Explainability / Educational Card on NAV-Unit Ratio */}
        <div className="glass-panel p-6 border-slate-800/80">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>How PoolFolio Computes Your Return (NAV-Unit Mechanics)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h4>
              <p>
                Unlike basic trackers that split returns equally or by flat historical % contributions, PoolFolio functions like a **mutual fund**:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300">
                <li>
                  <strong className="text-white">Fair Entry Pricing:</strong> New contributions purchase units at the NAV per unit at the time of deposit, preventing new members from free-riding on prior profits.
                </li>
                <li>
                  <strong className="text-white">Realized Trade Allocation:</strong> Profits on liquidated positions are allocated based on unit holdings during the holding period.
                </li>
                <li>
                  <strong className="text-white">Solvency Transparency:</strong> Available cash is exposed both <em>without P&L</em> (pure capital) and <em>with P&L</em> (distributable cash).
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Snapshot Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Pool Valuation Snapshot"
      >
        <form onSubmit={handleTriggerSnapshot} className="space-y-4">
          <p className="text-xs text-slate-400">
            Submit the current estimated or marked value of the whole pool (Current Value of Stocks + IPOs + Cash).
          </p>

          {modalError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label htmlFor="totalValue" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Marked Total Pool Value (₹)
            </label>
            <input
              id="totalValue"
              type="number"
              step="any"
              required
              min="1"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder-slate-500"
            />
          </div>

          <div>
            <label htmlFor="snapshotAt" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Snapshot Date & Time
            </label>
            <input
              id="snapshotAt"
              type="datetime-local"
              required
              value={snapshotAt}
              onChange={(e) => setSnapshotAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono text-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Calculating...' : 'Create Snapshot'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  ContributionResponse,
  ContributionTotalResponse,
  ContributionType,
} from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PlusCircle,
  Users,
  RefreshCw,
  AlertCircle,
  Calendar,
  FileText,
} from 'lucide-react';

export default function ContributionsPage() {
  const [history, setHistory] = useState<ContributionResponse[]>([]);
  const [myTotal, setMyTotal] = useState<ContributionTotalResponse | null>(null);
  const [groupTotal, setGroupTotal] = useState<ContributionTotalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<ContributionType>('DEPOSIT');
  const [note, setNote] = useState('');
  const [contributedAt, setContributedAt] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [historyRes, myTotalRes, groupTotalRes] = await Promise.all([
        api.contributions.getMyHistory(),
        api.contributions.getMyTotal(),
        api.contributions.getGroupTotal(),
      ]);

      setHistory(historyRes);
      setMyTotal(myTotalRes);
      setGroupTotal(groupTotalRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch contribution data');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a positive contribution amount greater than zero.');
      }

      await api.contributions.create({
        amount: numAmount,
        type,
        note: note.trim() || undefined,
        contributedAt: new Date(contributedAt).toISOString(),
      });

      setModalOpen(false);
      setAmount('');
      setNote('');
      setType('DEPOSIT');
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record contribution');
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
              <span>Contributions & Capital</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your deposits, withdrawals, and track whole-group pooled capital.
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
              onClick={() => setModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Contribution</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Running Total Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="My Net Contributed"
            value={formatCurrency(myTotal?.netTotal)}
            subtitle="Deposits minus withdrawals"
            icon={Wallet}
            variant="emerald"
          />
          <StatCard
            title="My Total Deposits"
            value={formatCurrency(myTotal?.totalDeposits)}
            subtitle="All funds added to pool"
            icon={ArrowDownLeft}
            variant="cyan"
          />
          <StatCard
            title="My Total Withdrawals"
            value={formatCurrency(myTotal?.totalWithdrawals)}
            subtitle="All funds withdrawn"
            icon={ArrowUpRight}
            variant="rose"
          />
          <StatCard
            title="Group Net Pooled"
            value={formatCurrency(groupTotal?.netTotal)}
            subtitle="Whole pool running capital"
            icon={Users}
            variant="indigo"
          />
        </div>

        {/* History Table */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">My Contribution History</h3>
              <p className="text-xs text-slate-400">Chronological ledger of your deposits and withdrawals</p>
            </div>
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Note / Memo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((c) => {
                    const isDeposit = c.type === 'DEPOSIT';
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                          #{c.id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 text-xs">
                          {formatDate(c.contributedAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={isDeposit ? 'emerald' : 'rose'}>
                            {c.type}
                          </Badge>
                        </td>
                        <td className={`py-3.5 px-4 font-mono font-bold ${
                          isDeposit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isDeposit ? '+' : '-'}{formatCurrency(c.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate">
                          {c.note || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">
              <p>No contributions logged yet.</p>
              <p className="text-xs text-slate-600 mt-1">Click "Log Contribution" above to record your first deposit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Contribution Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Capital Contribution"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {formError}
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('DEPOSIT')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 ${
                  type === 'DEPOSIT'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm'
                    : 'glass-panel text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Deposit (+ Inflow)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('WITHDRAWAL')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 ${
                  type === 'WITHDRAWAL'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm'
                    : 'glass-panel text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdrawal (- Outflow)</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Amount (₹)
            </label>
            <input
              id="amount"
              type="number"
              step="any"
              required
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25000"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder-slate-500"
            />
          </div>

          <div>
            <label htmlFor="contributedAt" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Date & Time
            </label>
            <input
              id="contributedAt"
              type="datetime-local"
              required
              value={contributedAt}
              onChange={(e) => setContributedAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono text-slate-200"
            />
          </div>

          <div>
            <label htmlFor="note" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Note / Reference (Optional)
            </label>
            <input
              id="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. UPI transfer, monthly pool allocation"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder-slate-500"
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
              {submitting ? 'Saving...' : 'Save Contribution'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

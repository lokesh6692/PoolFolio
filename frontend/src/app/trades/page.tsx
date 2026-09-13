'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import {
  HoldingResponse,
  TradeResponse,
  TradeType,
  IpoHoldingResponse,
} from '@/types/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  Landmark,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
} from 'lucide-react';

export default function TradesPage() {
  const [activeTab, setActiveTab] = useState<'stocks' | 'ipos'>('stocks');
  const [holdings, setHoldings] = useState<HoldingResponse[]>([]);
  const [trades, setTrades] = useState<TradeResponse[]>([]);
  const [ipoHoldings, setIpoHoldings] = useState<IpoHoldingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trade Modal State
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState<number | null>(null);
  const [symbol, setSymbol] = useState('');
  const [tradeType, setTradeType] = useState<TradeType>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [tradedAt, setTradedAt] = useState(new Date().toISOString().slice(0, 16));
  const [tradeNote, setTradeNote] = useState('');
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeFormError, setTradeFormError] = useState<string | null>(null);

  // IPO Modal State
  const [ipoModalOpen, setIpoModalOpen] = useState(false);
  const [editingIpoId, setEditingIpoId] = useState<number | null>(null);
  const [ipoName, setIpoName] = useState('');
  const [ipoAmount, setIpoAmount] = useState('');
  const [investedDate, setInvestedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [ipoSubmitting, setIpoSubmitting] = useState(false);
  const [ipoFormError, setIpoFormError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [holdingsRes, tradesRes, iposRes] = await Promise.allSettled([
        api.holdings.getAll(),
        api.trades.getAll(),
        api.ipoHoldings.getAll(),
      ]);

      if (holdingsRes.status === 'fulfilled') setHoldings(holdingsRes.value);
      if (tradesRes.status === 'fulfilled') setTrades(tradesRes.value);
      if (iposRes.status === 'fulfilled') setIpoHoldings(iposRes.value);
    } catch (err: any) {
      setError(err.message || 'Failed to load trades and holdings data');
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

  // Trade handlers
  const openNewTradeModal = () => {
    setEditingTradeId(null);
    setSymbol('');
    setTradeType('BUY');
    setQuantity('');
    setPrice('');
    setTradedAt(new Date().toISOString().slice(0, 16));
    setTradeNote('');
    setTradeFormError(null);
    setTradeModalOpen(true);
  };

  const openEditTradeModal = (t: TradeResponse) => {
    setEditingTradeId(t.id);
    setSymbol(t.symbol);
    setTradeType(t.tradeType);
    setQuantity(String(t.quantity));
    setPrice(String(t.price));
    setTradedAt(new Date(t.tradedAt).toISOString().slice(0, 16));
    setTradeNote(t.note || '');
    setTradeFormError(null);
    setTradeModalOpen(true);
  };

  const handleSaveTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setTradeFormError(null);
    setTradeSubmitting(true);

    try {
      const q = parseFloat(quantity);
      const p = parseFloat(price);
      if (isNaN(q) || q <= 0) throw new Error('Quantity must be greater than 0');
      if (isNaN(p) || p <= 0) throw new Error('Price must be greater than 0');
      if (!symbol.trim()) throw new Error('Symbol is required');

      const payload = {
        symbol: symbol.trim().toUpperCase(),
        tradeType,
        quantity: q,
        price: p,
        tradedAt: new Date(tradedAt).toISOString(),
        note: tradeNote.trim() || undefined,
      };

      if (editingTradeId) {
        await api.trades.update(editingTradeId, payload);
      } else {
        await api.trades.create(payload);
      }

      setTradeModalOpen(false);
      fetchData();
    } catch (err: any) {
      setTradeFormError(err.message || 'Failed to save trade');
    } finally {
      setTradeSubmitting(false);
    }
  };

  const handleDeleteTrade = async (id: number) => {
    if (!confirm('Are you sure you want to delete this trade? Holdings will be automatically recomputed.')) {
      return;
    }
    try {
      await api.trades.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete trade');
    }
  };

  // IPO Handlers
  const openNewIpoModal = () => {
    setEditingIpoId(null);
    setIpoName('');
    setIpoAmount('');
    setInvestedDate(new Date().toISOString().slice(0, 10));
    setIpoFormError(null);
    setIpoModalOpen(true);
  };

  const openEditIpoModal = (ipo: IpoHoldingResponse) => {
    setEditingIpoId(ipo.id);
    setIpoName(ipo.ipoName);
    setIpoAmount(String(ipo.amount));
    setInvestedDate(ipo.investedDate);
    setIpoFormError(null);
    setIpoModalOpen(true);
  };

  const handleSaveIpo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIpoFormError(null);
    setIpoSubmitting(true);

    try {
      const a = parseFloat(ipoAmount);
      if (isNaN(a) || a <= 0) throw new Error('IPO amount must be greater than 0');
      if (!ipoName.trim()) throw new Error('IPO Name is required');

      const payload = {
        ipoName: ipoName.trim(),
        amount: a,
        investedDate,
      };

      if (editingIpoId) {
        await api.ipoHoldings.update(editingIpoId, payload);
      } else {
        await api.ipoHoldings.create(payload);
      }

      setIpoModalOpen(false);
      fetchData();
    } catch (err: any) {
      setIpoFormError(err.message || 'Failed to save IPO holding');
    } finally {
      setIpoSubmitting(false);
    }
  };

  const handleDeleteIpo = async (id: number) => {
    if (!confirm('Are you sure you want to delete this IPO holding?')) {
      return;
    }
    try {
      await api.ipoHoldings.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete IPO holding');
    }
  };

  const totalStockValue = holdings.reduce(
    (acc, h) => acc + Number(h.quantity) * Number(h.averageCost),
    0
  );
  const totalIpoValue = ipoHoldings.reduce((acc, ipo) => acc + Number(ipo.amount), 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Investments & Order Book
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Track active equity holdings, execution history, and dedicated IPO allocations.
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

            {activeTab === 'stocks' ? (
              <button
                onClick={openNewTradeModal}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Execute Trade</span>
              </button>
            ) : (
              <button
                onClick={openNewIpoModal}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Allocate IPO</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 space-x-8">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`pb-3 font-semibold text-sm transition-all relative flex items-center space-x-2 ${
              activeTab === 'stocks' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Stock Holdings & Trades</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {holdings.length}
            </span>
            {activeTab === 'stocks' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('ipos')}
            className={`pb-3 font-semibold text-sm transition-all relative flex items-center space-x-2 ${
              activeTab === 'ipos' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>IPO Holdings (Separate Entity)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {ipoHoldings.length}
            </span>
            {activeTab === 'ipos' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
            )}
          </button>
        </div>

        {/* Tab 1: Stocks & Trades */}
        {activeTab === 'stocks' && (
          <div className="space-y-8">
            {/* Holdings Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Current Group Holdings</span>
                  <span className="text-xs font-mono text-slate-400">
                    Total Cost: {formatCurrency(totalStockValue)}
                  </span>
                </h3>
              </div>

              {holdings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {holdings.map((h) => {
                    const totalCost = Number(h.quantity) * Number(h.averageCost);
                    return (
                      <div
                        key={h.symbol}
                        className="glass-panel p-5 hover:border-emerald-500/40 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-black font-mono tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                            {h.symbol}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {Number(h.quantity).toLocaleString()} shares
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 font-mono text-xs">
                          <div>
                            <span className="text-slate-500">Avg Cost</span>
                            <div className="text-slate-200 font-bold">{formatCurrency(h.averageCost)}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500">Total Basis</span>
                            <div className="text-emerald-400 font-bold">{formatCurrency(totalCost)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="glass-panel p-8 text-center text-slate-500 text-sm">
                  <p>No active stock holdings.</p>
                  <p className="text-xs text-slate-600 mt-1">Execute a BUY trade to establish your first position.</p>
                </div>
              )}
            </div>

            {/* Trades History Table */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Full Trade Execution Ledger</h3>
                  <p className="text-xs text-slate-400">Chronological list of all buy and sell orders</p>
                </div>
              </div>

              {trades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Ticker</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4 font-mono text-right">Shares</th>
                        <th className="py-3 px-4 font-mono text-right">Price</th>
                        <th className="py-3 px-4 font-mono text-right">Total Value</th>
                        <th className="py-3 px-4">Memo</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {trades.map((t) => {
                        const isBuy = t.tradeType === 'BUY';
                        const total = Number(t.quantity) * Number(t.price);
                        return (
                          <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 text-xs text-slate-500 font-sans">
                              #{t.id}
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 text-xs font-sans">
                              {formatDate(t.tradedAt)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-white">
                              {t.symbol}
                            </td>
                            <td className="py-3.5 px-4 font-sans">
                              <Badge variant={isBuy ? 'emerald' : 'rose'}>
                                {t.tradeType}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-200">
                              {Number(t.quantity).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-200">
                              {formatCurrency(t.price)}
                            </td>
                            <td className={`py-3.5 px-4 text-right font-bold ${
                              isBuy ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {formatCurrency(total)}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-400 font-sans max-w-xs truncate">
                              {t.note || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center space-x-2 font-sans">
                                <button
                                  onClick={() => openEditTradeModal(t)}
                                  className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                                  title="Edit Trade"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTrade(t.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete Trade"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-sm">
                  <p>No trades executed yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Click "Execute Trade" above to log a trade.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: IPO Holdings */}
        {activeTab === 'ipos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Active IPO Positions</h3>
                <p className="text-xs text-slate-400">
                  Tracked as distinct capital commitments from stock holdings. Total: {formatCurrency(totalIpoValue)}
                </p>
              </div>
            </div>

            {ipoHoldings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ipoHoldings.map((ipo) => (
                  <div
                    key={ipo.id}
                    className="glass-panel p-5 hover:border-cyan-500/40 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {ipo.ipoName}
                        </h4>
                        <div className="flex items-center space-x-1.5 ml-2">
                          <button
                            onClick={() => openEditIpoModal(ipo)}
                            className="p-1 text-slate-400 hover:text-cyan-400"
                            title="Edit IPO"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteIpo(ipo.id)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Delete IPO"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center space-x-1.5 text-xs text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Invested on {formatDate(ipo.investedDate)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">Amount Invested</span>
                      <span className="text-base font-bold font-mono text-cyan-400">
                        {formatCurrency(ipo.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-500 text-sm">
                <p>No IPO holdings recorded.</p>
                <p className="text-xs text-slate-600 mt-1">Click "Allocate IPO" to log an applied/allotted IPO.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trade Modal */}
      <Modal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        title={editingTradeId ? `Edit Trade #${editingTradeId}` : 'Execute New Trade'}
      >
        <form onSubmit={handleSaveTrade} className="space-y-4">
          {tradeFormError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {tradeFormError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Trade Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTradeType('BUY')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 ${
                  tradeType === 'BUY'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm'
                    : 'glass-panel text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>BUY (+ Accumulate)</span>
              </button>
              <button
                type="button"
                onClick={() => setTradeType('SELL')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 ${
                  tradeType === 'SELL'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm'
                    : 'glass-panel text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>SELL (- Liquidate)</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="symbol" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Stock Symbol / Ticker
            </label>
            <input
              id="symbol"
              type="text"
              required
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. INFY, TCS, RELIANCE"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono tracking-wider uppercase placeholder-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quantity" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Quantity (Shares)
              </label>
              <input
                id="quantity"
                type="number"
                step="any"
                required
                min="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder-slate-500"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Price per Share (₹)
              </label>
              <input
                id="price"
                type="number"
                step="any"
                required
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 1450.50"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tradedAt" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Execution Date & Time
            </label>
            <input
              id="tradedAt"
              type="datetime-local"
              required
              value={tradedAt}
              onChange={(e) => setTradedAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono text-slate-200"
            />
          </div>

          <div>
            <label htmlFor="tradeNote" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Note (Optional)
            </label>
            <input
              id="tradeNote"
              type="text"
              value={tradeNote}
              onChange={(e) => setTradeNote(e.target.value)}
              placeholder="e.g. Swing trade target hit, breakout"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder-slate-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setTradeModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={tradeSubmitting}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {tradeSubmitting ? 'Saving...' : editingTradeId ? 'Update Trade' : 'Record Trade'}
            </button>
          </div>
        </form>
      </Modal>

      {/* IPO Modal */}
      <Modal
        isOpen={ipoModalOpen}
        onClose={() => setIpoModalOpen(false)}
        title={editingIpoId ? `Edit IPO Holding #${editingIpoId}` : 'Allocate IPO Holding'}
      >
        <form onSubmit={handleSaveIpo} className="space-y-4">
          {ipoFormError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {ipoFormError}
            </div>
          )}

          <div>
            <label htmlFor="ipoName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              IPO / Company Name
            </label>
            <input
              id="ipoName"
              type="text"
              required
              value={ipoName}
              onChange={(e) => setIpoName(e.target.value)}
              placeholder="e.g. Tata Tech IPO, Brainbees Solutions"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder-slate-500"
            />
          </div>

          <div>
            <label htmlFor="ipoAmount" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Total Invested Capital (₹)
            </label>
            <input
              id="ipoAmount"
              type="number"
              step="any"
              required
              min="1"
              value={ipoAmount}
              onChange={(e) => setIpoAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono placeholder-slate-500"
            />
          </div>

          <div>
            <label htmlFor="investedDate" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Application / Allotment Date
            </label>
            <input
              id="investedDate"
              type="date"
              required
              value={investedDate}
              onChange={(e) => setInvestedDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono text-slate-200"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => setIpoModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={ipoSubmitting}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 rounded-lg shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {ipoSubmitting ? 'Saving...' : editingIpoId ? 'Update IPO' : 'Save IPO'}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

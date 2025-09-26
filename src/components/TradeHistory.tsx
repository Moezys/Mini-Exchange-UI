import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useExchangeStore } from '../store/exchangeStore';
import type { Trade } from '../types';

interface TradeRowProps {
  trade: Trade;
  index: number;
}

const TradeRow: React.FC<TradeRowProps> = ({ trade, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex justify-between items-center py-2 px-3 text-sm hover:bg-slate-800 transition-colors trade-notification"
    >
      <div className="flex items-center space-x-3">
        <span className={`font-mono font-semibold ${
          trade.side === 'buy' ? 'text-buy' : 'text-sell'
        }`}>
          {trade.price.toFixed(2)}
        </span>
        <span className="text-gray-300 font-mono">
          {trade.quantity.toFixed(4)}
        </span>
      </div>
      <div className="text-right">
        <div className="text-gray-400 text-xs">
          {new Date(trade.timestamp).toLocaleTimeString()}
        </div>
        <div className={`text-xs font-medium ${
          trade.side === 'buy' ? 'text-buy' : 'text-sell'
        }`}>
          {trade.side.toUpperCase()}
        </div>
      </div>
    </motion.div>
  );
};

interface TradeHistoryProps {
  className?: string;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ className = '' }) => {
  const { trades, clearTrades } = useExchangeStore();

  const totalVolume = trades.reduce((sum, trade) => sum + trade.quantity, 0);
  const averagePrice = trades.length > 0 
    ? trades.reduce((sum, trade) => sum + trade.price, 0) / trades.length 
    : 0;

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-700 flex flex-col h-full ${className}`}>
      <div className="p-4 border-b border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-white">Trade History</h2>
          <button
            onClick={clearTrades}
            className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded"
            aria-label="Clear trade history"
            title="Clear trade history"
          >
            <Trash2 size={16} />
          </button>
        </div>
        
        {/* Trade Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Total Volume</div>
            <div className="text-white font-mono">{totalVolume.toFixed(4)}</div>
          </div>
          <div>
            <div className="text-gray-400">Avg Price</div>
            <div className="text-white font-mono">{averagePrice.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-400 font-semibold mt-3">
          <span>Price / Size</span>
          <span>Time / Side</span>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto"
        role="log" 
        aria-live="polite" 
        aria-label="Recent trades"
      >
        <AnimatePresence mode="popLayout">
          {trades.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No trades yet
            </div>
          ) : (
            trades.slice(0, 50).map((trade, index) => (
              <TradeRow key={trade.id} trade={trade} index={index} />
            ))
          )}
        </AnimatePresence>
      </div>

      {trades.length > 0 && (
        <div className="p-3 border-t border-slate-700 bg-slate-800">
          <div className="text-xs text-gray-400 text-center">
            Showing {Math.min(trades.length, 50)} of {trades.length} trades
          </div>
        </div>
      )}
    </div>
  );
};
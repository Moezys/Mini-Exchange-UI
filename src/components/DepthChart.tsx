import React from 'react';
import { motion } from 'framer-motion';
import { useExchangeStore } from '../store/exchangeStore';
import type { OrderBookLevel } from '../types';

interface DepthBarProps {
  level: OrderBookLevel;
  side: 'buy' | 'sell';
  maxTotal: number;
  index: number;
}

const DepthBar: React.FC<DepthBarProps> = ({ level, side, maxTotal, index }) => {
  const heightPercentage = Math.max(10, (level.quantity / maxTotal) * 100);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: `${heightPercentage}%`, opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className={`relative group cursor-pointer w-full ${
        side === 'buy' ? 'bg-green-500/70 hover:bg-green-500/90' : 'bg-red-500/70 hover:bg-red-500/90'
      }`}
      style={{ minHeight: '4px' }}
    >
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-slate-600">
          <div>Price: {level.price.toFixed(2)}</div>
          <div>Size: {level.quantity.toFixed(4)}</div>
          <div>Total: {level.total.toFixed(4)}</div>
        </div>
      </div>
    </motion.div>
  );
};

interface DepthChartProps {
  className?: string;
}

export const DepthChart: React.FC<DepthChartProps> = ({ className = '' }) => {
  const { orderBook } = useExchangeStore();
  const { bids, asks } = orderBook;

  // Take top 15 levels from each side for cleaner visualization
  const displayBids = bids.slice(0, 15);
  const displayAsks = asks.slice(0, 15);

  const maxBidTotal = Math.max(...displayBids.map(b => b.total), 0);
  const maxAskTotal = Math.max(...displayAsks.map(a => a.total), 0);
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  if (maxTotal === 0) {
    return (
      <div className={`bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Depth Chart</h2>
        </div>
        <div className="flex items-center justify-center h-48 text-gray-500">
          No order book data
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-700 ${className}`}>
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Depth Chart</h2>
        <div className="flex items-center justify-between mt-2 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-400">Bids</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-400">Asks</span>
            </div>
          </div>
          <div className="text-gray-400">
            Max: {maxTotal.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-center h-48 gap-px border border-slate-600 rounded bg-slate-800/30 p-2">
          {/* Bids (left side) */}
          <div className="flex items-end h-full gap-1 flex-1">
            {displayBids.reverse().map((bid, index) => (
              <div key={`bid-${bid.price}`} className="flex-1 flex items-end h-full min-w-[2px]">
                <DepthBar
                  level={bid}
                  side="buy"
                  maxTotal={maxTotal}
                  index={index}
                />
              </div>
            ))}
          </div>

          {/* Center divider */}
          <div className="w-1 h-full bg-slate-500 mx-1"></div>

          {/* Asks (right side) */}
          <div className="flex items-end h-full gap-1 flex-1">
            {displayAsks.map((ask, index) => (
              <div key={`ask-${ask.price}`} className="flex-1 flex items-end h-full min-w-[2px]">
                <DepthBar
                  level={ask}
                  side="sell"
                  maxTotal={maxTotal}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Price labels */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <div className="flex-1 text-center">
            {displayBids.length > 0 && (
              <span className="text-green-400">
                {displayBids[displayBids.length - 1]?.price.toFixed(2)}
              </span>
            )}
          </div>
          <div className="px-4 text-yellow-400 font-semibold">
            {orderBook.midPrice.toFixed(2)}
          </div>
          <div className="flex-1 text-center">
            {displayAsks.length > 0 && (
              <span className="text-red-400">
                {displayAsks[displayAsks.length - 1]?.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
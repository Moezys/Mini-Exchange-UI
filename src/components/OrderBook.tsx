import React, { memo } from 'react';
import { motion } from 'framer-motion';
import type { OrderBookLevel } from '../types';
import { useExchangeStore } from '../store/exchangeStore';

interface OrderBookRowProps {
  level: OrderBookLevel;
  side: 'buy' | 'sell';
  maxTotal: number;
  isHighlighted?: boolean;
}

const OrderBookRow = memo<OrderBookRowProps>(({ level, side, maxTotal, isHighlighted = false }) => {
  const depthPercentage = (level.total / maxTotal) * 100;
  
  return (
    <motion.div
      className={`relative flex justify-between items-center px-3 py-1 text-sm order-book-row ${
        isHighlighted ? 'bg-gray-700' : 'hover:bg-slate-800'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Depth visualization bar */}
      <div
        className={`absolute inset-y-0 right-0 depth-bar ${
          side === 'buy' ? 'bg-buy/20' : 'bg-sell/20'
        }`}
        style={{ width: `${depthPercentage}%` }}
      />
      
      <div className="relative z-10 flex justify-between w-full">
        <span className={`font-mono ${side === 'buy' ? 'text-buy' : 'text-sell'}`}>
          {level.price.toFixed(2)}
        </span>
        <span className="text-gray-300 font-mono">
          {level.quantity.toFixed(4)}
        </span>
        <span className="text-gray-400 font-mono text-xs">
          {level.total.toFixed(4)}
        </span>
      </div>
    </motion.div>
  );
});

OrderBookRow.displayName = 'OrderBookRow';

interface OrderBookProps {
  className?: string;
}

export const OrderBook: React.FC<OrderBookProps> = ({ className = '' }) => {
  const { orderBook } = useExchangeStore();
  const { bids, asks, midPrice, spread } = orderBook;

  const maxBidTotal = Math.max(...bids.map(b => b.total), 0);
  const maxAskTotal = Math.max(...asks.map(a => a.total), 0);
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-700 flex flex-col ${className}`}>
      <div className="p-4 border-b border-slate-700 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-white">Order Book</h2>
          <div className="text-sm text-gray-400">
            Spread: {spread.toFixed(2)}
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-400 font-semibold">
          <span>Price</span>
          <span>Size</span>
          <span>Total</span>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {/* Asks (sells) - show in reverse order (highest first) */}
        <div className="flex-1 overflow-y-auto flex flex-col-reverse">
          {asks.slice(0, 20).reverse().map((ask) => (
            <OrderBookRow
              key={`ask-${ask.price}`}
              level={ask}
              side="sell"
              maxTotal={maxTotal}
            />
          ))}
        </div>

        {/* Mid price */}
        <div className="mid-price-row bg-slate-800 px-3 py-2 text-center flex-shrink-0">
          <div className="text-gray-300 font-mono text-sm">
            Mid Price: <span className="text-yellow-400 font-semibold">
              {midPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Bids (buys) */}
        <div className="flex-1 overflow-y-auto">
          {bids.slice(0, 20).map((bid) => (
            <OrderBookRow
              key={`bid-${bid.price}`}
              level={bid}
              side="buy"
              maxTotal={maxTotal}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
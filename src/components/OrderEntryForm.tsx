import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { useExchangeStore } from '../store/exchangeStore';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface OrderEntryFormProps {
  className?: string;
}

export const OrderEntryForm: React.FC<OrderEntryFormProps> = ({ className = '' }) => {
  const {
    currentOrder,
    isOrderModalOpen,
    orderBook,
    updateOrderForm,
    setOrderModalOpen,
    submitOrder
  } = useExchangeStore();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const focusTrapRef = useFocusTrap(isOrderModalOpen);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!currentOrder.quantity || parseFloat(currentOrder.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (currentOrder.type === 'limit' && (!currentOrder.price || parseFloat(currentOrder.price) <= 0)) {
      newErrors.price = 'Price must be greater than 0 for limit orders';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      submitOrder(currentOrder);
    }
  };

  const handleEscape = () => {
    setOrderModalOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOrderModalOpen) {
        handleEscape();
      }
    };

    if (isOrderModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOrderModalOpen]);

  const quickFillPrice = () => {
    if (currentOrder.side === 'buy' && orderBook.asks.length > 0) {
      updateOrderForm({ price: orderBook.asks[0].price.toString() });
    } else if (currentOrder.side === 'sell' && orderBook.bids.length > 0) {
      updateOrderForm({ price: orderBook.bids[0].price.toString() });
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOrderModalOpen(true)}
        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${className}`}
        aria-label="Open order form (Press N)"
      >
        New Order
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOrderModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              ref={focusTrapRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4 border border-slate-700"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleEscape();
                }
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">New Order</h2>
                <button
                  onClick={handleEscape}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Side Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateOrderForm({ side: 'buy' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                      currentOrder.side === 'buy'
                        ? 'bg-buy/20 border-buy text-buy'
                        : 'border-slate-600 text-gray-400 hover:border-buy hover:text-buy'
                    }`}
                  >
                    <TrendingUp size={18} />
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrderForm({ side: 'sell' })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                      currentOrder.side === 'sell'
                        ? 'bg-sell/20 border-sell text-sell'
                        : 'border-slate-600 text-gray-400 hover:border-sell hover:text-sell'
                    }`}
                  >
                    <TrendingDown size={18} />
                    Sell
                  </button>
                </div>

                {/* Order Type */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateOrderForm({ type: 'market' })}
                    className={`p-3 rounded-lg border transition-colors ${
                      currentOrder.type === 'market'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-slate-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => updateOrderForm({ type: 'limit' })}
                    className={`p-3 rounded-lg border transition-colors ${
                      currentOrder.type === 'limit'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-slate-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                    }`}
                  >
                    Limit
                  </button>
                </div>

                {/* Price Input (only for limit orders) */}
                {currentOrder.type === 'limit' && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="price" className="block text-sm font-medium text-gray-300">
                        Price
                      </label>
                      <button
                        type="button"
                        onClick={quickFillPrice}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Best {currentOrder.side === 'buy' ? 'Ask' : 'Bid'}
                      </button>
                    </div>
                    <input
                      id="price"
                      type="number"
                      step="0.01"
                      value={currentOrder.price}
                      onChange={(e) => updateOrderForm({ price: e.target.value })}
                      className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.price ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-400">{errors.price}</p>
                    )}
                  </div>
                )}

                {/* Quantity Input */}
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    step="0.0001"
                    value={currentOrder.quantity}
                    onChange={(e) => updateOrderForm({ quantity: e.target.value })}
                    className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.quantity ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="0.0000"
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-400">{errors.quantity}</p>
                  )}
                </div>

                {/* Order Summary */}
                {currentOrder.quantity && (currentOrder.type === 'market' || currentOrder.price) && (
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <div className="text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Side:</span>
                        <span className={currentOrder.side === 'buy' ? 'text-buy' : 'text-sell'}>
                          {currentOrder.side.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span>{currentOrder.type.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span>{currentOrder.quantity}</span>
                      </div>
                      {currentOrder.type === 'limit' && (
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span>${currentOrder.price}</span>
                        </div>
                      )}
                      {currentOrder.type === 'limit' && currentOrder.price && (
                        <div className="flex justify-between font-semibold pt-2 border-t border-slate-600 mt-2">
                          <span>Total:</span>
                          <span>
                            ${(parseFloat(currentOrder.quantity) * parseFloat(currentOrder.price)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleEscape}
                    className="flex-1 px-4 py-2 border border-slate-600 text-gray-400 rounded-lg hover:border-slate-500 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                      currentOrder.side === 'buy'
                        ? 'bg-buy hover:bg-green-600 text-white focus:ring-buy'
                        : 'bg-sell hover:bg-red-600 text-white focus:ring-sell'
                    }`}
                  >
                    Place {currentOrder.side} Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
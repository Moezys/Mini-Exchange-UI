import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppState, OrderBook, Trade, OrderFormData, Order } from '../types';
import { fakeSocket } from '../lib/fakeSocket';
import { orderMatcher } from '../lib/orderMatcher';

interface ExchangeActions {
  setOrderBook: (orderBook: OrderBook) => void;
  addTrade: (trade: Trade) => void;
  setConnection: (connected: boolean) => void;
  togglePause: () => void;
  updateOrderForm: (data: Partial<OrderFormData>) => void;
  setOrderModalOpen: (open: boolean) => void;
  submitOrder: (order: OrderFormData) => void;
  clearTrades: () => void;
  initializeSocket: () => () => void;
}

type ExchangeStore = AppState & ExchangeActions;

const initialOrderForm: OrderFormData = {
  side: 'buy',
  type: 'limit',
  price: '',
  quantity: '',
};

const initialOrderBook: OrderBook = {
  bids: [],
  asks: [],
  midPrice: 0,
  spread: 0,
};

export const useExchangeStore = create<ExchangeStore>()(
  devtools(
    (set, get) => ({
      // State
      orderBook: initialOrderBook,
      trades: [] as Trade[],
      isConnected: false,
      isPaused: false,
      currentOrder: initialOrderForm,
      isOrderModalOpen: false,

      // Actions
      setOrderBook: (orderBook: OrderBook) =>
        set({ orderBook }, false, 'setOrderBook'),

      addTrade: (trade: Trade) =>
        set((state: ExchangeStore) => ({
          trades: [trade, ...state.trades].slice(0, 100) // Keep last 100 trades
        }), false, 'addTrade'),

      setConnection: (connected: boolean) =>
        set({ isConnected: connected }, false, 'setConnection'),

      togglePause: () => {
        const { isPaused } = get();
        set({ isPaused: !isPaused }, false, 'togglePause');
        
        if (isPaused) {
          // Resume
          fakeSocket.start();
        } else {
          // Pause
          fakeSocket.stop();
        }
      },

      updateOrderForm: (data: Partial<OrderFormData>) =>
        set((state: ExchangeStore) => ({
          currentOrder: { ...state.currentOrder, ...data }
        }), false, 'updateOrderForm'),

      setOrderModalOpen: (open: boolean) =>
        set({ isOrderModalOpen: open }, false, 'setOrderModalOpen'),

      submitOrder: (orderData) => {
        const order: Order = {
          id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          price: orderData.type === 'market' ? 0 : parseFloat(orderData.price) || 0,
          quantity: parseFloat(orderData.quantity) || 0,
          side: orderData.side,
          type: orderData.type,
          timestamp: Date.now(),
        };

        // Validate order
        if (order.quantity <= 0) {
          console.error('Invalid quantity');
          return;
        }

        if (order.type === 'limit' && order.price <= 0) {
          console.error('Invalid price for limit order');
          return;
        }

        // Process order through matching engine
        const { trades, remainingOrder } = orderMatcher.addOrder(order);

        // Add trades to store
        trades.forEach(trade => {
          get().addTrade(trade);
        });

        // Update order book from matching engine
        const updatedOrderBook = orderMatcher.getOrderBook();
        get().setOrderBook(updatedOrderBook);

        // Reset form and close modal
        set({
          currentOrder: initialOrderForm,
          isOrderModalOpen: false,
        }, false, 'submitOrder');

        console.log('Order submitted:', order);
        console.log('Generated trades:', trades);
        console.log('Remaining order:', remainingOrder);
      },

      clearTrades: () =>
        set({ trades: [] }, false, 'clearTrades'),

      initializeSocket: () => {
        let unsubscribe: (() => void) | null = null;

        const connect = () => {
          get().setConnection(true);
          
          unsubscribe = fakeSocket.subscribe((message) => {
            if (get().isPaused) return;

            switch (message.type) {
              case 'orderbook':
                get().setOrderBook(message.data as OrderBook);
                break;
              case 'trade':
                get().addTrade(message.data as Trade);
                break;
            }
          });
        };

        const disconnect = () => {
          get().setConnection(false);
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
        };

        // Auto-connect
        connect();

        // Return cleanup function
        return () => {
          disconnect();
        };
      },
    }),
    {
      name: 'exchange-store',
      version: 1,
    }
  )
);
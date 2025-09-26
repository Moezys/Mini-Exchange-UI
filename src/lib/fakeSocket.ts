import type { OrderBook, Trade, WebSocketMessage, FakeSocketConfig } from '../types';

type SubscriptionCallback = (message: WebSocketMessage) => void;

class FakeSocket {
  private subscribers: Set<SubscriptionCallback> = new Set();
  private intervalId: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;
  private config: FakeSocketConfig;
  private currentPrice = 50000; // Starting BTC price
  private sequenceId = 0;

  constructor(config: Partial<FakeSocketConfig> = {}) {
    this.config = {
      updateInterval: [300, 800],
      priceVolatility: 0.001, // 0.1% volatility
      volumeRange: [0.1, 5.0],
      spreadRange: [0.01, 0.05], // 0.01% to 0.05% spread
      ...config,
    };
  }

  subscribe(callback: SubscriptionCallback): () => void {
    this.subscribers.add(callback);
    
    if (!this.isRunning) {
      this.start();
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0 && this.isRunning) {
        this.stop();
      }
    };
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.scheduleNextUpdate();
  }

  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  updateConfig(newConfig: Partial<FakeSocketConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private scheduleNextUpdate(): void {
    if (!this.isRunning) return;

    const [min, max] = this.config.updateInterval;
    const delay = Math.random() * (max - min) + min;

    this.intervalId = setTimeout(() => {
      this.generateUpdate();
      this.scheduleNextUpdate();
    }, delay);
  }

  private generateUpdate(): void {
    const updateType = Math.random();
    
    if (updateType < 0.8) {
      // 80% chance of orderbook update
      this.generateOrderBookUpdate();
    } else {
      // 20% chance of trade update
      this.generateTradeUpdate();
    }
  }

  private generateOrderBookUpdate(): void {
    // Update current price with some volatility
    const priceChange = (Math.random() - 0.5) * this.currentPrice * this.config.priceVolatility;
    this.currentPrice = Math.max(1000, this.currentPrice + priceChange);

    const [minSpread, maxSpread] = this.config.spreadRange;
    const spreadPercent = Math.random() * (maxSpread - minSpread) + minSpread;
    const spread = this.currentPrice * spreadPercent;
    const midPrice = this.currentPrice;

    const bids = this.generateOrderBookSide('buy', midPrice - spread / 2, 20);
    const asks = this.generateOrderBookSide('sell', midPrice + spread / 2, 20);

    const orderBook: OrderBook = {
      bids,
      asks,
      midPrice,
      spread,
    };

    this.broadcast({
      type: 'orderbook',
      data: orderBook,
      timestamp: Date.now(),
    });
  }

  private generateOrderBookSide(side: 'buy' | 'sell', startPrice: number, levels: number) {
    const result = [];
    const [minVol, maxVol] = this.config.volumeRange;
    
    let currentPrice = startPrice;
    let runningTotal = 0;

    for (let i = 0; i < levels; i++) {
      const quantity = Math.random() * (maxVol - minVol) + minVol;
      const priceStep = this.currentPrice * (0.0001 + Math.random() * 0.0005); // 0.01% to 0.05% steps
      
      if (side === 'buy') {
        currentPrice -= priceStep;
      } else {
        currentPrice += priceStep;
      }

      runningTotal += quantity;

      result.push({
        price: Math.round(currentPrice * 100) / 100,
        quantity: Math.round(quantity * 10000) / 10000,
        total: Math.round(runningTotal * 10000) / 10000,
        count: Math.floor(Math.random() * 5) + 1,
      });
    }

    return result;
  }

  private generateTradeUpdate(): void {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const [minVol, maxVol] = this.config.volumeRange;
    const quantity = Math.random() * (maxVol - minVol) + minVol;
    
    // Trade price should be close to current price
    const priceVariation = this.currentPrice * 0.0005; // 0.05% variation
    const tradePrice = this.currentPrice + (Math.random() - 0.5) * priceVariation;

    const trade: Trade = {
      id: `trade_${this.sequenceId++}`,
      price: Math.round(tradePrice * 100) / 100,
      quantity: Math.round(quantity * 10000) / 10000,
      side,
      timestamp: Date.now(),
    };

    this.broadcast({
      type: 'trade',
      data: trade,
      timestamp: Date.now(),
    });
  }

  private broadcast(message: WebSocketMessage): void {
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in socket callback:', error);
      }
    });
  }

  // Public methods for testing and debugging
  getCurrentPrice(): number {
    return this.currentPrice;
  }

  setCurrentPrice(price: number): void {
    this.currentPrice = Math.max(0, price);
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const fakeSocket = new FakeSocket();

// Export for testing with different configs
export { FakeSocket };
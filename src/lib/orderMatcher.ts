import type { Order, OrderBook, Trade, OrderBookLevel } from '../types';

export class OrderMatcher {
  private orders: Order[] = [];
  private trades: Trade[] = [];
  private sequenceId = 0;

  addOrder(order: Order): { trades: Trade[]; remainingOrder: Order | null } {
    const newTrades: Trade[] = [];
    let remainingOrder: Order | null = { ...order };

    if (order.type === 'market') {
      remainingOrder = this.matchMarketOrder(order, newTrades);
    } else {
      remainingOrder = this.matchLimitOrder(order, newTrades);
    }

    // Add remaining order to book if it exists
    if (remainingOrder && remainingOrder.quantity > 0) {
      this.orders.push(remainingOrder);
    }

    // Add new trades to history
    this.trades.push(...newTrades);

    return { trades: newTrades, remainingOrder };
  }

  private matchMarketOrder(order: Order, trades: Trade[]): Order | null {
    const opposingSide = order.side === 'buy' ? 'sell' : 'buy';
    const opposingOrders = this.orders
      .filter(o => o.side === opposingSide)
      .sort((a, b) => {
        if (order.side === 'buy') {
          return a.price - b.price; // Best ask (lowest price) first
        } else {
          return b.price - a.price; // Best bid (highest price) first
        }
      });

    let remainingQuantity = order.quantity;

    for (const opposingOrder of opposingOrders) {
      if (remainingQuantity <= 0) break;

      const tradeQuantity = Math.min(remainingQuantity, opposingOrder.quantity);
      const tradePrice = opposingOrder.price;

      // Create trade
      const trade: Trade = {
        id: `trade_${this.sequenceId++}`,
        price: tradePrice,
        quantity: tradeQuantity,
        side: order.side,
        timestamp: Date.now(),
        buyer: order.side === 'buy' ? order.id : opposingOrder.id,
        seller: order.side === 'sell' ? order.id : opposingOrder.id,
      };

      trades.push(trade);

      // Update quantities
      remainingQuantity -= tradeQuantity;
      opposingOrder.quantity -= tradeQuantity;

      // Remove filled order
      if (opposingOrder.quantity <= 0) {
        this.orders = this.orders.filter(o => o.id !== opposingOrder.id);
      }
    }

    // Market orders that aren't fully filled are cancelled
    return remainingQuantity > 0 ? null : null;
  }

  private matchLimitOrder(order: Order, trades: Trade[]): Order | null {
    const opposingSide = order.side === 'buy' ? 'sell' : 'buy';
    const opposingOrders = this.orders
      .filter(o => {
        if (o.side !== opposingSide) return false;
        
        if (order.side === 'buy') {
          return o.price <= order.price; // Buy can match asks at or below limit price
        } else {
          return o.price >= order.price; // Sell can match bids at or above limit price
        }
      })
      .sort((a, b) => {
        if (order.side === 'buy') {
          return a.price - b.price; // Best ask (lowest price) first
        } else {
          return b.price - a.price; // Best bid (highest price) first
        }
      });

    let remainingQuantity = order.quantity;

    for (const opposingOrder of opposingOrders) {
      if (remainingQuantity <= 0) break;

      const tradeQuantity = Math.min(remainingQuantity, opposingOrder.quantity);
      const tradePrice = opposingOrder.price; // Trade at the maker's price

      // Create trade
      const trade: Trade = {
        id: `trade_${this.sequenceId++}`,
        price: tradePrice,
        quantity: tradeQuantity,
        side: order.side,
        timestamp: Date.now(),
        buyer: order.side === 'buy' ? order.id : opposingOrder.id,
        seller: order.side === 'sell' ? order.id : opposingOrder.id,
      };

      trades.push(trade);

      // Update quantities
      remainingQuantity -= tradeQuantity;
      opposingOrder.quantity -= tradeQuantity;

      // Remove filled order
      if (opposingOrder.quantity <= 0) {
        this.orders = this.orders.filter(o => o.id !== opposingOrder.id);
      }
    }

    // Return remaining order if any quantity left
    if (remainingQuantity > 0) {
      return {
        ...order,
        quantity: remainingQuantity,
      };
    }

    return null;
  }

  getOrderBook(): OrderBook {
    const bids = this.aggregateOrdersByPrice('buy');
    const asks = this.aggregateOrdersByPrice('sell');

    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    const midPrice = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : 0;
    const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;

    return {
      bids: bids.slice(0, 20),
      asks: asks.slice(0, 20),
      midPrice,
      spread,
    };
  }

  private aggregateOrdersByPrice(side: 'buy' | 'sell'): OrderBookLevel[] {
    const sideOrders = this.orders.filter(o => o.side === side);
    const priceMap = new Map<number, { quantity: number; count: number }>();

    sideOrders.forEach(order => {
      const existing = priceMap.get(order.price) || { quantity: 0, count: 0 };
      priceMap.set(order.price, {
        quantity: existing.quantity + order.quantity,
        count: existing.count + 1,
      });
    });

    const levels = Array.from(priceMap.entries()).map(([price, data]) => ({
      price,
      quantity: data.quantity,
      count: data.count,
      total: 0, // Will be calculated below
    }));

    // Sort by price (bids: high to low, asks: low to high)
    levels.sort((a, b) => {
      return side === 'buy' ? b.price - a.price : a.price - b.price;
    });

    // Calculate running totals
    let runningTotal = 0;
    levels.forEach(level => {
      runningTotal += level.quantity;
      level.total = runningTotal;
    });

    return levels;
  }

  getTrades(): Trade[] {
    return [...this.trades].reverse(); // Most recent first
  }

  getOrders(): Order[] {
    return [...this.orders];
  }

  removeOrder(orderId: string): boolean {
    const initialLength = this.orders.length;
    this.orders = this.orders.filter(o => o.id !== orderId);
    return this.orders.length < initialLength;
  }

  clear(): void {
    this.orders = [];
    this.trades = [];
  }
}

// Singleton instance for the application
export const orderMatcher = new OrderMatcher();
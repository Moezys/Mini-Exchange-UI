import { OrderMatcher } from '../lib/orderMatcher';
import type { Order } from '../types';

describe('OrderMatcher', () => {
  let matcher: OrderMatcher;

  beforeEach(() => {
    matcher = new OrderMatcher();
  });

  describe('Market Orders', () => {
    beforeEach(() => {
      // Add some limit orders to match against
      const limitOrders: Order[] = [
        {
          id: 'sell1',
          price: 100,
          quantity: 5,
          side: 'sell',
          type: 'limit',
          timestamp: Date.now(),
        },
        {
          id: 'sell2',
          price: 101,
          quantity: 3,
          side: 'sell',
          type: 'limit',
          timestamp: Date.now(),
        },
        {
          id: 'buy1',
          price: 99,
          quantity: 4,
          side: 'buy',
          type: 'limit',
          timestamp: Date.now(),
        },
        {
          id: 'buy2',
          price: 98,
          quantity: 6,
          side: 'buy',
          type: 'limit',
          timestamp: Date.now(),
        },
      ];

      limitOrders.forEach(order => matcher.addOrder(order));
    });

    test('should match market buy order against best asks', () => {
      const marketBuy: Order = {
        id: 'market1',
        price: 0,
        quantity: 7,
        side: 'buy',
        type: 'market',
        timestamp: Date.now(),
      };

      const { trades, remainingOrder } = matcher.addOrder(marketBuy);

      expect(trades).toHaveLength(2);
      expect(trades[0].price).toBe(100); // Best ask
      expect(trades[0].quantity).toBe(5);
      expect(trades[1].price).toBe(101); // Next ask
      expect(trades[1].quantity).toBe(2);
      expect(remainingOrder).toBeNull(); // Market order fully filled
    });

    test('should match market sell order against best bids', () => {
      const marketSell: Order = {
        id: 'market2',
        price: 0,
        quantity: 8,
        side: 'sell',
        type: 'market',
        timestamp: Date.now(),
      };

      const { trades, remainingOrder } = matcher.addOrder(marketSell);

      expect(trades).toHaveLength(2);
      expect(trades[0].price).toBe(99); // Best bid
      expect(trades[0].quantity).toBe(4);
      expect(trades[1].price).toBe(98); // Next bid
      expect(trades[1].quantity).toBe(4);
      expect(remainingOrder).toBeNull(); // Market order fully filled
    });
  });

  describe('Limit Orders', () => {
    test('should add limit order to book if no matching orders', () => {
      const limitOrder: Order = {
        id: 'limit1',
        price: 100,
        quantity: 5,
        side: 'buy',
        type: 'limit',
        timestamp: Date.now(),
      };

      const { trades, remainingOrder } = matcher.addOrder(limitOrder);

      expect(trades).toHaveLength(0);
      expect(remainingOrder).toEqual(limitOrder);
      expect(matcher.getOrders()).toContainEqual(limitOrder);
    });

    test('should match limit buy order against asks at or below limit price', () => {
      // Add sell orders
      const sellOrder: Order = {
        id: 'sell1',
        price: 99,
        quantity: 3,
        side: 'sell',
        type: 'limit',
        timestamp: Date.now(),
      };
      matcher.addOrder(sellOrder);

      const limitBuy: Order = {
        id: 'buy1',
        price: 100, // Willing to buy at 100, can match sell at 99
        quantity: 2,
        side: 'buy',
        type: 'limit',
        timestamp: Date.now(),
      };

      const { trades, remainingOrder } = matcher.addOrder(limitBuy);

      expect(trades).toHaveLength(1);
      expect(trades[0].price).toBe(99); // Trade at maker's price
      expect(trades[0].quantity).toBe(2);
      expect(remainingOrder).toBeNull();
    });

    test('should partially fill orders', () => {
      const sellOrder: Order = {
        id: 'sell1',
        price: 100,
        quantity: 10,
        side: 'sell',
        type: 'limit',
        timestamp: Date.now(),
      };
      matcher.addOrder(sellOrder);

      const buyOrder: Order = {
        id: 'buy1',
        price: 100,
        quantity: 6,
        side: 'buy',
        type: 'limit',
        timestamp: Date.now(),
      };

      const { trades, remainingOrder } = matcher.addOrder(buyOrder);

      expect(trades).toHaveLength(1);
      expect(trades[0].quantity).toBe(6);
      expect(remainingOrder).toBeNull();

      // Check that sell order still has remaining quantity
      const remainingOrders = matcher.getOrders();
      const updatedSellOrder = remainingOrders.find(o => o.id === 'sell1');
      expect(updatedSellOrder?.quantity).toBe(4);
    });
  });

  describe('Order Book Generation', () => {
    test('should generate correct order book', () => {
      const orders: Order[] = [
        { id: '1', price: 100, quantity: 5, side: 'sell', type: 'limit', timestamp: Date.now() },
        { id: '2', price: 101, quantity: 3, side: 'sell', type: 'limit', timestamp: Date.now() },
        { id: '3', price: 99, quantity: 4, side: 'buy', type: 'limit', timestamp: Date.now() },
        { id: '4', price: 98, quantity: 2, side: 'buy', type: 'limit', timestamp: Date.now() },
      ];

      orders.forEach(order => matcher.addOrder(order));

      const orderBook = matcher.getOrderBook();

      expect(orderBook.bids).toHaveLength(2);
      expect(orderBook.asks).toHaveLength(2);
      expect(orderBook.bids[0].price).toBe(99); // Best bid
      expect(orderBook.asks[0].price).toBe(100); // Best ask
      expect(orderBook.midPrice).toBe(99.5);
      expect(orderBook.spread).toBe(1);
    });
  });
});
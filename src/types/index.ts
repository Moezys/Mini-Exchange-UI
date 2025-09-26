export interface Order {
  id: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  timestamp: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
  count: number;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  midPrice: number;
  spread: number;
}

export interface Trade {
  id: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: number;
  buyer?: string;
  seller?: string;
}

export interface MarketData {
  symbol: string;
  lastPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export interface WebSocketMessage {
  type: 'orderbook' | 'trade' | 'ticker';
  data: OrderBook | Trade | MarketData;
  timestamp: number;
}

export interface OrderFormData {
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  price: string;
  quantity: string;
}

export interface AppState {
  orderBook: OrderBook;
  trades: Trade[];
  isConnected: boolean;
  isPaused: boolean;
  currentOrder: OrderFormData;
  isOrderModalOpen: boolean;
}

export interface FakeSocketConfig {
  updateInterval: [number, number]; // min, max ms
  priceVolatility: number;
  volumeRange: [number, number];
  spreadRange: [number, number];
}
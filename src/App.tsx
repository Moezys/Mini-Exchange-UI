import React, { useEffect } from 'react';
import { Play, Pause, Activity } from 'lucide-react';
import { OrderBook } from './components/OrderBook';
import { OrderEntryForm } from './components/OrderEntryForm';
import { TradeHistory } from './components/TradeHistory';
import { DepthChart } from './components/DepthChart';
import { useExchangeStore } from './store/exchangeStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const App: React.FC = () => {
  const { 
    isConnected, 
    isPaused, 
    togglePause, 
    setOrderModalOpen,
    initializeSocket 
  } = useExchangeStore();

  // Initialize socket connection on mount
  useEffect(() => {
    const cleanup = initializeSocket();
    return cleanup;
  }, [initializeSocket]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      action: () => setOrderModalOpen(true),
      description: 'Open new order modal'
    },
    {
      key: ' ',
      action: togglePause,
      description: 'Toggle pause/resume'
    }
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">Mini Exchange</h1>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-900/50 text-green-300 border border-green-700' 
                : 'bg-red-900/50 text-red-300 border border-red-700'
            }`}>
              <Activity size={16} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* WebSocket Controls */}
            <button
              onClick={togglePause}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isPaused
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
              title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <OrderEntryForm />
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <div>Press <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">N</kbd> to create new order</div>
            <div>Press <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">Space</kbd> to pause/resume</div>
            <div>Press <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">Esc</kbd> to close modals</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Book */}
          <div className="lg:col-span-1">
            <OrderBook className="h-[600px]" />
          </div>

          {/* Middle Column - Depth Chart & Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            <DepthChart className="h-80" />
            <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Status</div>
                  <div className={`font-medium ${
                    isConnected 
                      ? (isPaused ? 'text-yellow-400' : 'text-green-400')
                      : 'text-red-400'
                  }`}>
                    {isPaused ? 'Paused' : (isConnected ? 'Live' : 'Disconnected')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Mode</div>
                  <div className="text-white font-medium">
                    {isPaused ? 'Debug' : 'Real-time'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Trade History */}
          <div className="lg:col-span-1">
            <TradeHistory className="h-[600px]" />
          </div>
        </div>
      </main>

      {/* Performance Monitoring (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs text-gray-400">
          <div>Environment: Development</div>
          <div>Socket: {isConnected ? 'Active' : 'Inactive'}</div>
          <div>Mode: {isPaused ? 'Paused' : 'Streaming'}</div>
        </div>
      )}
    </div>
  );
};

export default App;
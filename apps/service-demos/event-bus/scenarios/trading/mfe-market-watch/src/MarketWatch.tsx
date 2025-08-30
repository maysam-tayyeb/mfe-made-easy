import React, { useState, useEffect } from 'react';
import type { ServiceContainer } from '@mfe-toolkit/core';

type Stock = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
  marketCap: string;
};

type MarketWatchProps = {
  serviceContainer: ServiceContainer;
};

export const MarketWatch: React.FC<MarketWatchProps> = ({ serviceContainer }) => {
  const eventBus = serviceContainer.require('eventBus');
  const logger = serviceContainer.require('logger');
  const [stocks, setStocks] = useState<Stock[]>([
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.35, change: 2.45, changePercent: 1.39, volume: '52.3M', high: 179.20, low: 176.80, marketCap: '2.8T' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 138.92, change: -0.84, changePercent: -0.60, volume: '28.1M', high: 140.10, low: 138.50, marketCap: '1.7T' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 405.63, change: 3.21, changePercent: 0.80, volume: '31.5M', high: 407.00, low: 403.20, marketCap: '3.0T' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.47, change: -1.23, changePercent: -0.78, volume: '45.8M', high: 157.20, low: 154.90, marketCap: '1.6T' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.84, change: 5.67, changePercent: 2.39, volume: '98.4M', high: 245.00, low: 238.50, marketCap: '770B' },
    { symbol: 'META', name: 'Meta Platforms', price: 492.31, change: 4.15, changePercent: 0.85, volume: '18.9M', high: 495.00, low: 489.30, marketCap: '1.3T' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 12.43, changePercent: 1.44, volume: '41.2M', high: 882.00, low: 868.50, marketCap: '2.2T' },
  ]);

  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'MSFT', 'NVDA']);
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change'>('symbol');

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks => 
        prevStocks.map(stock => {
          const changeAmount = (Math.random() - 0.5) * 4;
          const newPrice = Math.max(0, stock.price + changeAmount);
          const totalChange = newPrice - stock.price + stock.change;
          const percentChange = (totalChange / stock.price) * 100;
          
          return {
            ...stock,
            price: newPrice,
            change: totalChange,
            changePercent: percentChange,
            high: Math.max(stock.high, newPrice),
            low: Math.min(stock.low, newPrice)
          };
        })
      );

      // Emit random market events
      if (Math.random() > 0.7) {
        const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
        const eventType = Math.random() > 0.5 ? 'market:price-alert' : 'market:volume-spike';
        
        eventBus.emit(eventType, {
          symbol: randomStock.symbol,
          name: randomStock.name,
          price: randomStock.price,
          change: randomStock.change,
          timestamp: Date.now()
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [eventBus, stocks]);

  useEffect(() => {
    // Listen for trade execution events
    const unsubscribe = eventBus.on('trade:executed', (payload: any) => {
      const { symbol, action, quantity, price } = payload.data || {};
      
      // Log trade execution instead of using notification service
      logger.info('Trade executed:', {
        type: 'success',
        title: 'Trade Executed',
        message: `${action} ${quantity} shares of ${symbol} at $${price}`
      });

      // Update stock volume
      setStocks(prev => prev.map(stock => {
        if (stock.symbol === symbol) {
          const currentVolume = parseFloat(stock.volume.replace(/[M|K]/g, ''));
          const newVolume = currentVolume + (quantity / 1000000);
          return {
            ...stock,
            volume: `${newVolume.toFixed(1)}M`
          };
        }
        return stock;
      }));
    });

    return () => unsubscribe();
  }, [eventBus, logger]);

  const handleStockClick = (symbol: string) => {
    setSelectedStock(symbol);
    
    const stock = stocks.find(s => s.symbol === symbol);
    if (stock) {
      eventBus.emit('market:stock-selected', {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent
      });
    }
  };

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => {
      const updated = prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol];
      
      eventBus.emit('market:watchlist-updated', {
        action: prev.includes(symbol) ? 'removed' : 'added',
        symbol,
        watchlist: updated
      });
      
      return updated;
    });
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.price - a.price;
      case 'change':
        return b.changePercent - a.changePercent;
      default:
        return a.symbol.localeCompare(b.symbol);
    }
  });

  return (
    <div className="ds-p-4">
      <div className="ds-flex ds-justify-between ds-items-center ds-mb-4">
        <h4 className="ds-card-title ds-mb-0">📈 Market Watch</h4>
        <div className="ds-flex ds-gap-2">
          <button 
            onClick={() => setSortBy('symbol')}
            className={`ds-btn-sm ${sortBy === 'symbol' ? 'ds-btn-primary' : 'ds-btn-outline'}`}
          >
            Symbol
          </button>
          <button 
            onClick={() => setSortBy('price')}
            className={`ds-btn-sm ${sortBy === 'price' ? 'ds-btn-primary' : 'ds-btn-outline'}`}
          >
            Price
          </button>
          <button 
            onClick={() => setSortBy('change')}
            className={`ds-btn-sm ${sortBy === 'change' ? 'ds-btn-primary' : 'ds-btn-outline'}`}
          >
            Change
          </button>
        </div>
      </div>

      <div className="ds-space-y-2">
        {sortedStocks.map(stock => (
          <div
            key={stock.symbol}
            className={`ds-p-3 ds-rounded-lg ds-border ds-cursor-pointer ds-transition-all ${
              selectedStock === stock.symbol ? 'ds-border-primary ds-bg-accent-primary-soft' : 'ds-hover-bg-slate-50'
            }`}
            onClick={() => handleStockClick(stock.symbol)}
          >
            <div className="ds-flex ds-justify-between ds-items-start">
              <div className="ds-flex-1">
                <div className="ds-flex ds-items-center ds-gap-2">
                  <span className="ds-font-bold ds-text-lg">{stock.symbol}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(stock.symbol);
                    }}
                    className="ds-text-warning ds-hover-text-warning-dark"
                  >
                    {watchlist.includes(stock.symbol) ? '⭐' : '☆'}
                  </button>
                </div>
                <div className="ds-text-xs ds-text-muted">{stock.name}</div>
                <div className="ds-flex ds-gap-4 ds-mt-1 ds-text-xs ds-text-muted">
                  <span>Vol: {stock.volume}</span>
                  <span>H: ${stock.high.toFixed(2)}</span>
                  <span>L: ${stock.low.toFixed(2)}</span>
                  <span>Cap: {stock.marketCap}</span>
                </div>
              </div>
              <div className="ds-text-right">
                <div className="ds-text-lg ds-font-bold">${stock.price.toFixed(2)}</div>
                <div className={`ds-text-sm ds-font-medium ${
                  stock.change >= 0 ? 'ds-text-success' : 'ds-text-danger'
                }`}>
                  {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)} 
                  ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="ds-mt-4 ds-p-3 ds-bg-slate-50 ds-rounded-lg">
        <div className="ds-flex ds-justify-between ds-items-center">
          <div className="ds-text-xs ds-text-muted">
            📊 {stocks.filter(s => s.change >= 0).length} advancing • 
            {stocks.filter(s => s.change < 0).length} declining
          </div>
          <div className="ds-text-xs ds-text-muted">
            ⭐ {watchlist.length} in watchlist
          </div>
        </div>
      </div>
    </div>
  );
};
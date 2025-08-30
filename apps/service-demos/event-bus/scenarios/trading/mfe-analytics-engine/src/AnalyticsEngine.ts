import type { ServiceContainer, EventBus, Logger } from '@mfe-toolkit/core';

type TradeData = {
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
};

type MarketMetrics = {
  totalVolume: number;
  totalTrades: number;
  avgTradeSize: number;
  topGainer: { symbol: string; change: number };
  topLoser: { symbol: string; change: number };
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
};

export class AnalyticsEngine {
  private container: HTMLElement;
  private serviceContainer: ServiceContainer;
  private eventBus: EventBus;
  private logger: Logger;
  private trades: TradeData[] = [];
  private metrics: MarketMetrics = {
    totalVolume: 0,
    totalTrades: 0,
    avgTradeSize: 0,
    topGainer: { symbol: 'N/A', change: 0 },
    topLoser: { symbol: 'N/A', change: 0 },
    marketSentiment: 'neutral'
  };
  private priceHistory: Map<string, number[]> = new Map();
  private eventListeners: Array<() => void> = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(container: HTMLElement, serviceContainer: ServiceContainer) {
    this.container = container;
    this.serviceContainer = serviceContainer;
    this.eventBus = serviceContainer.require('eventBus');
    this.logger = serviceContainer.require('logger');
    this.init();
  }

  private init(): void {
    this.render();
    this.subscribeToEvents();
    this.startMetricsUpdate();
  }

  private render(): void {
    const html = `
      <div class="ds-p-4">
        <div class="ds-flex ds-justify-between ds-items-center ds-mb-4">
          <h4 class="ds-card-title ds-mb-0">📊 Analytics Engine</h4>
          <div class="ds-flex ds-gap-2">
            <button id="export-data" class="ds-btn-outline ds-btn-sm">
              📥 Export
            </button>
            <button id="clear-data" class="ds-btn-outline ds-btn-sm">
              🗑️ Clear
            </button>
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="ds-grid ds-grid-cols-3 ds-gap-3 ds-mb-4">
          <div class="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
            <div class="ds-text-xs ds-text-muted ds-mb-1">Total Volume</div>
            <div class="ds-text-lg ds-font-bold">${this.formatNumber(this.metrics.totalVolume)}</div>
            <div class="ds-text-xs ds-text-success">+12.5% today</div>
          </div>
          <div class="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
            <div class="ds-text-xs ds-text-muted ds-mb-1">Total Trades</div>
            <div class="ds-text-lg ds-font-bold">${this.metrics.totalTrades}</div>
            <div class="ds-text-xs ds-text-muted">Avg: ${Math.round(this.metrics.avgTradeSize)}</div>
          </div>
          <div class="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
            <div class="ds-text-xs ds-text-muted ds-mb-1">Market Sentiment</div>
            <div class="ds-text-lg ds-font-bold ${this.getSentimentClass()}">${this.metrics.marketSentiment}</div>
            <div class="ds-text-xs ds-text-muted">Based on ${this.trades.length} trades</div>
          </div>
        </div>

        <!-- Market Movers -->
        <div class="ds-grid ds-grid-cols-2 ds-gap-3 ds-mb-4">
          <div class="ds-p-3 ds-border ds-rounded-lg">
            <div class="ds-text-sm ds-font-medium ds-mb-2">🚀 Top Gainer</div>
            <div class="ds-flex ds-justify-between ds-items-center">
              <span class="ds-font-bold">${this.metrics.topGainer.symbol}</span>
              <span class="ds-text-success ds-font-medium">
                +${this.metrics.topGainer.change.toFixed(2)}%
              </span>
            </div>
          </div>
          <div class="ds-p-3 ds-border ds-rounded-lg">
            <div class="ds-text-sm ds-font-medium ds-mb-2">📉 Top Loser</div>
            <div class="ds-flex ds-justify-between ds-items-center">
              <span class="ds-font-bold">${this.metrics.topLoser.symbol}</span>
              <span class="ds-text-danger ds-font-medium">
                ${this.metrics.topLoser.change.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <!-- Trade Distribution Chart -->
        <div class="ds-p-3 ds-border ds-rounded-lg ds-mb-4">
          <div class="ds-text-sm ds-font-medium ds-mb-3">Trade Distribution</div>
          <div id="trade-chart" class="ds-space-y-2">
            ${this.renderTradeChart()}
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
          <div class="ds-text-sm ds-font-medium ds-mb-2">Recent Activity</div>
          <div id="activity-feed" class="ds-space-y-1 ds-max-h-32 ds-overflow-y-auto">
            ${this.renderActivityFeed()}
          </div>
        </div>

        <!-- Performance Indicators -->
        <div class="ds-mt-4 ds-grid ds-grid-cols-4 ds-gap-2">
          <div class="ds-text-center ds-p-2 ds-border ds-rounded">
            <div class="ds-text-xs ds-text-muted">Buy/Sell Ratio</div>
            <div class="ds-font-bold">${this.calculateBuySellRatio()}</div>
          </div>
          <div class="ds-text-center ds-p-2 ds-border ds-rounded">
            <div class="ds-text-xs ds-text-muted">Volatility</div>
            <div class="ds-font-bold">${this.calculateVolatility()}%</div>
          </div>
          <div class="ds-text-center ds-p-2 ds-border ds-rounded">
            <div class="ds-text-xs ds-text-muted">Momentum</div>
            <div class="ds-font-bold ${this.getMomentumClass()}">${this.calculateMomentum()}</div>
          </div>
          <div class="ds-text-center ds-p-2 ds-border ds-rounded">
            <div class="ds-text-xs ds-text-muted">Risk Level</div>
            <div class="ds-font-bold ${this.getRiskClass()}">${this.calculateRiskLevel()}</div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  private renderTradeChart(): string {
    const symbolCounts = new Map<string, number>();
    this.trades.forEach(trade => {
      symbolCounts.set(trade.symbol, (symbolCounts.get(trade.symbol) || 0) + 1);
    });

    const sortedSymbols = Array.from(symbolCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (sortedSymbols.length === 0) {
      return '<div class="ds-text-xs ds-text-muted ds-text-center ds-py-4">No trade data available</div>';
    }

    const maxCount = Math.max(...sortedSymbols.map(([_, count]) => count));

    return sortedSymbols.map(([symbol, count]) => `
      <div class="ds-flex ds-items-center ds-gap-2">
        <span class="ds-text-xs ds-w-16">${symbol}</span>
        <div class="ds-flex-1 ds-bg-slate-200 ds-rounded-full ds-h-4">
          <div class="ds-bg-primary ds-h-4 ds-rounded-full" style="width: ${(count / maxCount) * 100}%"></div>
        </div>
        <span class="ds-text-xs ds-text-muted">${count}</span>
      </div>
    `).join('');
  }

  private renderActivityFeed(): string {
    const recentTrades = this.trades.slice(-5).reverse();
    
    if (recentTrades.length === 0) {
      return '<div class="ds-text-xs ds-text-muted">No recent activity</div>';
    }

    return recentTrades.map(trade => `
      <div class="ds-text-xs ds-flex ds-justify-between">
        <span>
          <span class="${trade.action === 'buy' ? 'ds-text-success' : 'ds-text-danger'}">
            ${trade.action === 'buy' ? '🟢' : '🔴'}
          </span>
          ${trade.symbol} ${trade.quantity} @ $${trade.price.toFixed(2)}
        </span>
        <span class="ds-text-muted">${new Date(trade.timestamp).toLocaleTimeString()}</span>
      </div>
    `).join('');
  }

  private attachEventListeners(): void {
    const exportBtn = this.container.querySelector('#export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }

    const clearBtn = this.container.querySelector('#clear-data');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearData());
    }
  }

  private subscribeToEvents(): void {
    // Listen for executed trades
    const unsub1 = this.eventBus.on('trade:executed', (payload: any) => {
      const { symbol, action, quantity, price } = payload.data || {};
      
      if (symbol && action && quantity && price) {
        this.trades.push({
          symbol,
          action,
          quantity,
          price,
          timestamp: Date.now()
        });

        this.updateMetrics();
        this.updatePriceHistory(symbol, price);
      }
    });

    // Listen for price alerts
    const unsub2 = this.eventBus.on('market:price-alert', (payload: any) => {
      const { symbol, price, change } = payload.data || {};
      
      if (symbol && price !== undefined && change !== undefined) {
        this.updatePriceHistory(symbol, price);
        
        // Update top gainers/losers
        if (change > this.metrics.topGainer.change) {
          this.metrics.topGainer = { symbol, change };
        }
        if (change < this.metrics.topLoser.change) {
          this.metrics.topLoser = { symbol, change };
        }
      }
    });

    // Listen for volume spikes
    const unsub3 = this.eventBus.on('market:volume-spike', (payload: any) => {
      this.logger.warn('Volume spike detected', {
        symbol: payload.data?.symbol || 'Unknown',
        message: `Unusual trading volume on ${payload.data?.symbol || 'Unknown'}`
      });
    });

    this.eventListeners.push(unsub1, unsub2, unsub3);
  }

  private startMetricsUpdate(): void {
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
      this.render();
      
      // Emit market status
      this.eventBus.emit('analytics:market-status', {
        sentiment: this.metrics.marketSentiment,
        volatility: this.calculateVolatility(),
        momentum: this.calculateMomentum(),
        riskLevel: this.calculateRiskLevel()
      });
    }, 5000);
  }

  private updateMetrics(): void {
    const buyTrades = this.trades.filter(t => t.action === 'buy');
    const sellTrades = this.trades.filter(t => t.action === 'sell');

    this.metrics.totalVolume = this.trades.reduce((sum, t) => sum + (t.quantity * t.price), 0);
    this.metrics.totalTrades = this.trades.length;
    this.metrics.avgTradeSize = this.trades.length > 0 
      ? this.trades.reduce((sum, t) => sum + t.quantity, 0) / this.trades.length 
      : 0;

    // Calculate market sentiment
    if (buyTrades.length > sellTrades.length * 1.2) {
      this.metrics.marketSentiment = 'bullish';
    } else if (sellTrades.length > buyTrades.length * 1.2) {
      this.metrics.marketSentiment = 'bearish';
    } else {
      this.metrics.marketSentiment = 'neutral';
    }
  }

  private updatePriceHistory(symbol: string, price: number): void {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push(price);
    
    // Keep only last 100 prices
    if (history.length > 100) {
      history.shift();
    }
  }

  private calculateBuySellRatio(): string {
    const buyCount = this.trades.filter(t => t.action === 'buy').length;
    const sellCount = this.trades.filter(t => t.action === 'sell').length;
    
    if (sellCount === 0) return buyCount > 0 ? '∞' : '1:1';
    
    const ratio = buyCount / sellCount;
    return `${ratio.toFixed(1)}:1`;
  }

  private calculateVolatility(): number {
    // Simple volatility calculation based on price movements
    let totalVolatility = 0;
    let count = 0;

    this.priceHistory.forEach(history => {
      if (history.length > 1) {
        const changes = [];
        for (let i = 1; i < history.length; i++) {
          changes.push(Math.abs((history[i] - history[i-1]) / history[i-1]) * 100);
        }
        if (changes.length > 0) {
          totalVolatility += changes.reduce((a, b) => a + b, 0) / changes.length;
          count++;
        }
      }
    });

    return count > 0 ? Math.round(totalVolatility / count * 10) / 10 : 0;
  }

  private calculateMomentum(): string {
    const recentTrades = this.trades.slice(-10);
    const buyMomentum = recentTrades.filter(t => t.action === 'buy').length;
    const sellMomentum = recentTrades.filter(t => t.action === 'sell').length;

    if (buyMomentum > sellMomentum * 1.5) return 'Strong Buy';
    if (buyMomentum > sellMomentum) return 'Buy';
    if (sellMomentum > buyMomentum * 1.5) return 'Strong Sell';
    if (sellMomentum > buyMomentum) return 'Sell';
    return 'Hold';
  }

  private calculateRiskLevel(): string {
    const volatility = this.calculateVolatility();
    if (volatility > 5) return 'High';
    if (volatility > 2) return 'Medium';
    return 'Low';
  }

  private getSentimentClass(): string {
    switch (this.metrics.marketSentiment) {
      case 'bullish': return 'ds-text-success';
      case 'bearish': return 'ds-text-danger';
      default: return 'ds-text-warning';
    }
  }

  private getMomentumClass(): string {
    const momentum = this.calculateMomentum();
    if (momentum.includes('Buy')) return 'ds-text-success';
    if (momentum.includes('Sell')) return 'ds-text-danger';
    return 'ds-text-warning';
  }

  private getRiskClass(): string {
    const risk = this.calculateRiskLevel();
    if (risk === 'High') return 'ds-text-danger';
    if (risk === 'Medium') return 'ds-text-warning';
    return 'ds-text-success';
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  }

  private exportData(): void {
    const data = {
      metrics: this.metrics,
      trades: this.trades,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.logger.info('Data exported successfully', {
      trades: this.trades.length,
      metrics: this.metrics
    });
  }

  private clearData(): void {
    this.trades = [];
    this.priceHistory.clear();
    this.metrics = {
      totalVolume: 0,
      totalTrades: 0,
      avgTradeSize: 0,
      topGainer: { symbol: 'N/A', change: 0 },
      topLoser: { symbol: 'N/A', change: 0 },
      marketSentiment: 'neutral'
    };
    
    this.render();
    
    this.logger.info('Analytics data cleared and reset');
  }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.eventListeners.forEach(unsubscribe => unsubscribe());
    this.container.innerHTML = '';
  }
}
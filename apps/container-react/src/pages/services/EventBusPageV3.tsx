import React, { useState, useEffect, useMemo } from 'react';
import { useUI } from '@/contexts/UIContext';
import { RegistryMFELoader } from '@/components/RegistryMFELoader';
import { EventLog } from '@mfe/design-system-react';
import { getMFEServicesSingleton } from '@/services/mfe-services-singleton';

// Types
type LayoutMode = 'grid' | 'stacked' | 'focus';

type EventMessage = {
  id: string;
  event: string;
  data?: any;
  timestamp: string;
  source: string;
};

type Scenario = {
  id: string;
  name: string;
  description: string;
  icon: string;
  mfes: Array<{
    id: string;
    title: string;
    framework: 'react' | 'vue' | 'vanilla';
    position?: 'full-width';
  }>;
};

// Scenario configurations
const scenarios: Scenario[] = [
  {
    id: 'trading',
    name: 'Stock Trading Dashboard',
    description: 'Real-time stock market trading platform with analytics',
    icon: '📈',
    mfes: [
      { id: 'mfe-market-watch', title: 'Market Watch', framework: 'react' },
      { id: 'mfe-trading-terminal', title: 'Trading Terminal', framework: 'vue' },
      { id: 'mfe-analytics-engine', title: 'Analytics Engine', framework: 'vanilla', position: 'full-width' }
    ]
  }
];

// Storage utilities
const StorageManager = {
  save: (key: string, data: EventMessage[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  },
  load: (key: string): EventMessage[] => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    }
  }
};

const STORAGE_KEY = 'event-bus-demo-events';

const MAX_EVENTS = 100; // Maximum number of events to keep in memory
const MAX_RENDERED_EVENTS = 50; // Maximum number of events to render at once

export const EventBusPageV3: React.FC = () => {
  const { addNotification } = useUI();
  const services = useMemo(() => getMFEServicesSingleton(), []);
  
  // Core state
  const [activeScenario, setActiveScenario] = useState<string>('trading');
  const [events, setEvents] = useState<EventMessage[]>(() => {
    const loaded = StorageManager.load(STORAGE_KEY);
    return loaded.slice(0, MAX_EVENTS); // Limit initial load
  });
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [selectedMFE, setSelectedMFE] = useState<string | null>(null);
  const [showEventLog, setShowEventLog] = useState(false);
  const [showApiReference, setShowApiReference] = useState(false);
  const [eventLogHeight, setEventLogHeight] = useState(50); // 50% of viewport
  const [apiReferenceHeight, setApiReferenceHeight] = useState(75); // 75% of viewport
  const [isDraggingEventLog, setIsDraggingEventLog] = useState(false);
  const [isDraggingApi, setIsDraggingApi] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [tradingTerminalHeight, setTradingTerminalHeight] = useState<number | null>(null);
  
  // Initialize selectedMFE when switching to focus mode
  useEffect(() => {
    if (layoutMode === 'focus' && !selectedMFE) {
      const currentScenario = scenarios.find(s => s.id === activeScenario);
      if (currentScenario && currentScenario.mfes.length > 0) {
        setSelectedMFE(currentScenario.mfes[0].id);
      }
    }
  }, [layoutMode, selectedMFE, activeScenario]);

  // Metrics state
  const [metrics, setMetrics] = useState({
    eventRate: 0,
    avgLatency: 0,
    errorCount: 0,
    totalEvents: events.length,
    lastEventTime: 0
  });

  // Event handling
  useEffect(() => {
    const handleEvent = (payload: any) => {
      // Debug logging
      console.log('Event received:', payload);
      
      // Filter out lifecycle events and internal events
      if (payload.type?.startsWith('mfe:')) {
        return;
      }
      
      const eventTime = Date.now();
      
      // Infer source from event type
      let source = payload.source || 'System';
      const eventType = payload.type || '';
      
      // Map events to their sources based on scenario
      if (activeScenario === 'trading') {
        if (eventType.startsWith('market:')) source = 'Market Watch';
        else if (eventType.startsWith('trade:')) source = 'Trading Terminal';
        else if (eventType.startsWith('analytics:')) source = 'Analytics Engine';
      }
      
      const newEvent: EventMessage = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        event: payload.type || 'unknown',
        data: payload.data,
        timestamp: new Date().toLocaleTimeString(),
        source
      };

      setEvents(prev => {
        const updated = [newEvent, ...prev].slice(0, MAX_EVENTS);
        StorageManager.save(STORAGE_KEY, updated.slice(0, MAX_EVENTS)); // Only save limited events
        return updated;
      });

      // Update metrics
      setMetrics(prev => {
        const latency = prev.lastEventTime ? eventTime - prev.lastEventTime : 0;
        return {
          ...prev,
          avgLatency: Math.round((prev.avgLatency + latency) / 2),
          totalEvents: prev.totalEvents + 1,
          lastEventTime: eventTime,
          eventRate: Math.round((prev.eventRate + 1) / 2)
        };
      });
    };

    const unsubscribe = services.eventBus.on('*', handleEvent);
    return () => unsubscribe();
  }, [services, activeScenario]);

  // Filtered and limited events for rendering
  const filteredEvents = useMemo(() => {
    const filtered = events.filter(event => {
      const matchesSearch = searchTerm === '' || 
        event.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(event.data).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterType === 'all' || 
        event.event.toLowerCase().startsWith(filterType.toLowerCase());
      
      return matchesSearch && matchesFilter;
    });
    
    // Limit rendered events to prevent performance issues
    return filtered.slice(0, MAX_RENDERED_EVENTS);
  }, [events, searchTerm, filterType]);

  const clearEvents = () => {
    setEvents([]);
    StorageManager.save(STORAGE_KEY, []);
    setMetrics(prev => ({ ...prev, totalEvents: 0, eventRate: 0 }));
  };

  // Handle mouse drag for resizing panels
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingEventLog) {
        const newHeight = ((window.innerHeight - e.clientY) / window.innerHeight) * 100;
        setEventLogHeight(Math.max(20, Math.min(80, newHeight)));
      } else if (isDraggingApi) {
        const newHeight = ((window.innerHeight - e.clientY) / window.innerHeight) * 100;
        setApiReferenceHeight(Math.max(20, Math.min(80, newHeight)));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingEventLog(false);
      setIsDraggingApi(false);
    };

    if (isDraggingEventLog || isDraggingApi) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ns-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDraggingEventLog, isDraggingApi]);

  const currentScenario = scenarios.find(s => s.id === activeScenario)!;

  // Measure Trading Terminal height and apply to Market Watch
  useEffect(() => {
    if (layoutMode === 'grid') {
      const checkHeights = () => {
        const tradingTerminalCard = document.querySelector('[data-mfe-id="mfe-trading-terminal"]');
        const marketWatchCard = document.querySelector('[data-mfe-id="mfe-market-watch"]');
        
        if (tradingTerminalCard && marketWatchCard) {
          const height = tradingTerminalCard.getBoundingClientRect().height;
          setTradingTerminalHeight(height);
        }
      };

      // Check initially and after a delay to ensure MFEs are loaded
      checkHeights();
      const timeout = setTimeout(checkHeights, 500);
      const interval = setInterval(checkHeights, 1000);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [layoutMode]);

  return (
    <div className="ds-page" style={{ 
      paddingBottom: showEventLog ? `${eventLogHeight}vh` : showApiReference ? `${apiReferenceHeight}vh` : '0',
      transition: 'padding-bottom 0.3s ease'
    }}>
      {/* Fixed Bottom Buttons */}
      <div 
        className="ds-fixed ds-bottom-4 ds-right-4 ds-z-50 ds-flex ds-gap-2"
        style={{
          position: 'fixed',
          bottom: showEventLog ? `calc(${eventLogHeight}vh + 1rem)` : showApiReference ? `calc(${apiReferenceHeight}vh + 1rem)` : '1rem',
          right: '1rem',
          zIndex: 50,
          transition: 'bottom 0.3s ease'
        }}
      >
        <button
          className="ds-btn-outline ds-btn-sm ds-shadow-lg"
          onClick={() => {
            setShowApiReference(!showApiReference);
            if (!showApiReference) setShowEventLog(false);
          }}
        >
          <span className="ds-icon">📚</span> {showApiReference ? 'Hide' : 'Show'} API
        </button>
        <button
          className="ds-btn-primary ds-btn-sm ds-shadow-lg"
          onClick={() => {
            setShowEventLog(!showEventLog);
            if (!showEventLog) setShowApiReference(false);
          }}
        >
          <span className="ds-icon">📋</span> {showEventLog ? 'Hide' : 'Show'} Event Log
        </button>
      </div>

      {/* Fixed API Reference Panel */}
      {showApiReference && (
        <div 
          className="ds-fixed ds-bottom-0 ds-left-0 ds-right-0 ds-z-40 ds-shadow-xl"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            height: `${apiReferenceHeight}vh`,
            backgroundColor: 'white'
          }}
        >
          {/* Drag Handle */}
          <div 
            className="ds-absolute ds-top-0 ds-left-0 ds-right-0 ds-h-2 ds-bg-slate-200 ds-cursor-ns-resize ds-hover-bg-slate-300"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '8px',
              cursor: 'ns-resize'
            }}
            onMouseDown={() => setIsDraggingApi(true)}
          >
            <div className="ds-mx-auto ds-mt-1 ds-w-12 ds-h-1 ds-bg-slate-400 ds-rounded-full"></div>
          </div>
          
          <div className="ds-card ds-p-0 ds-m-0 ds-rounded-none ds-h-full ds-flex ds-flex-col" style={{ paddingTop: '8px' }}>
            <div className="ds-px-4 ds-py-2 ds-border-b ds-bg-slate-50">
              <div className="ds-flex ds-items-center ds-justify-between">
                <h4 className="ds-text-sm ds-font-semibold">📚 Event Bus API Reference</h4>
                <button 
                  onClick={() => setShowApiReference(false)}
                  className="ds-text-muted ds-hover-text-primary"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="ds-p-4 ds-overflow-y-auto ds-flex-1">
              <div className="ds-space-y-4">
                {/* Basic Methods */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">Core Methods</h5>
                  <div className="ds-space-y-3">
                    <div className="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-mb-2">Emit Event</div>
                      <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border">
{`services.eventBus.emit('event:type', {
  data: 'your payload',
  timestamp: Date.now()
});`}
                      </pre>
                      <div className="ds-text-xs ds-text-muted ds-mt-2">
                        Broadcasts an event to all listening MFEs. Events are namespaced with colons.
                      </div>
                    </div>

                    <div className="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-mb-2">Subscribe to Event</div>
                      <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border">
{`const unsubscribe = services.eventBus.on(
  'event:type',
  (payload) => {
    console.log('Received:', payload.data);
  }
);

// Clean up when done
unsubscribe();`}
                      </pre>
                      <div className="ds-text-xs ds-text-muted ds-mt-2">
                        Subscribe to specific events. Returns an unsubscribe function.
                      </div>
                    </div>

                    <div className="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-mb-2">Listen to All Events</div>
                      <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border">
{`services.eventBus.on('*', (payload) => {
  console.log(\`Event \${payload.type}:\`, payload.data);
});`}
                      </pre>
                      <div className="ds-text-xs ds-text-muted ds-mt-2">
                        Wildcard subscription to monitor all events. Useful for debugging.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Patterns */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">Trading Dashboard Events</h5>
                  <div className="ds-grid ds-grid-cols-3 ds-gap-3">
                    <div className="ds-p-3 ds-border ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-text-green-600 ds-mb-2">Market Events</div>
                      <div className="ds-space-y-1 ds-text-xs">
                        <code className="ds-block">market:stock-selected</code>
                        <code className="ds-block">market:price-alert</code>
                        <code className="ds-block">market:volume-spike</code>
                        <code className="ds-block">market:watchlist-updated</code>
                      </div>
                    </div>
                    
                    <div className="ds-p-3 ds-border ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-text-blue-600 ds-mb-2">Trade Events</div>
                      <div className="ds-space-y-1 ds-text-xs">
                        <code className="ds-block">trade:placed</code>
                        <code className="ds-block">trade:executed</code>
                        <code className="ds-block">trade:cancelled</code>
                        <code className="ds-block">trade:positions-closed</code>
                      </div>
                    </div>
                    
                    <div className="ds-p-3 ds-border ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-text-purple-600 ds-mb-2">Analytics Events</div>
                      <div className="ds-space-y-1 ds-text-xs">
                        <code className="ds-block">analytics:market-status</code>
                        <code className="ds-block">analytics:sentiment-change</code>
                        <code className="ds-block">analytics:risk-alert</code>
                        <code className="ds-block">analytics:report-generated</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Best Practices */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">Best Practices</h5>
                  <div className="ds-grid ds-grid-cols-2 ds-gap-3">
                    <div className="ds-p-3 ds-bg-green-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-text-green-700 ds-mb-2">✅ Do</div>
                      <ul className="ds-text-xs ds-space-y-1">
                        <li>• Use namespaced events (e.g., 'module:action')</li>
                        <li>• Always unsubscribe when component unmounts</li>
                        <li>• Include timestamp in event payload</li>
                        <li>• Handle errors gracefully in subscribers</li>
                      </ul>
                    </div>
                    
                    <div className="ds-p-3 ds-bg-red-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-text-red-700 ds-mb-2">❌ Don't</div>
                      <ul className="ds-text-xs ds-space-y-1">
                        <li>• Don't use generic event names</li>
                        <li>• Don't forget to clean up subscriptions</li>
                        <li>• Don't emit sensitive data in events</li>
                        <li>• Don't create circular event chains</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Example Implementation */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">Complete Example</h5>
                  <div className="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
                    <pre className="ds-text-xs ds-bg-white ds-p-3 ds-rounded ds-border ds-overflow-x-auto">
{`// React Component Example
const MyTradingComponent: React.FC<{ services: MFEServices }> = ({ services }) => {
  useEffect(() => {
    // Subscribe to stock selection
    const unsubStockSelected = services.eventBus.on(
      'market:stock-selected',
      (payload) => {
        console.log('Stock selected:', payload.data.symbol);
        // Update component state
      }
    );

    // Subscribe to trade execution
    const unsubTradeExecuted = services.eventBus.on(
      'trade:executed',
      (payload) => {
        const { symbol, quantity, price } = payload.data;
        console.log(\`Trade executed: \${quantity} \${symbol} @ $\${price}\`);
      }
    );

    // Emit an event
    services.eventBus.emit('trade:placed', {
      symbol: 'AAPL',
      quantity: 100,
      price: 150.00,
      timestamp: Date.now()
    });

    // Cleanup
    return () => {
      unsubStockSelected();
      unsubTradeExecuted();
    };
  }, [services]);

  return <div>Your Component</div>;
};`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Event Log Panel */}
      {showEventLog && (
        <div 
          className="ds-fixed ds-bottom-0 ds-left-0 ds-right-0 ds-z-40 ds-shadow-xl"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            height: `${eventLogHeight}vh`,
            backgroundColor: 'white'
          }}
        >
          {/* Drag Handle */}
          <div 
            className="ds-absolute ds-top-0 ds-left-0 ds-right-0 ds-h-2 ds-bg-slate-200 ds-cursor-ns-resize ds-hover-bg-slate-300"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '8px',
              cursor: 'ns-resize'
            }}
            onMouseDown={() => setIsDraggingEventLog(true)}
          >
            <div className="ds-mx-auto ds-mt-1 ds-w-12 ds-h-1 ds-bg-slate-400 ds-rounded-full"></div>
          </div>
          
          <div className="ds-card ds-p-0 ds-m-0 ds-rounded-none ds-h-full ds-flex ds-flex-col" style={{ paddingTop: '8px' }}>
            <div className="ds-px-4 ds-py-2 ds-border-b ds-bg-slate-50">
              <div className="ds-flex ds-items-center ds-justify-between">
                <div className="ds-flex ds-items-center ds-gap-2">
                  <h4 className="ds-text-sm ds-font-semibold">📋 Event Log ({filteredEvents.length})</h4>
                  {events.length > MAX_RENDERED_EVENTS && (
                    <span className="ds-badge ds-badge-warning ds-badge-sm">
                      Showing {MAX_RENDERED_EVENTS} of {events.length}
                    </span>
                  )}
                  {events.length >= MAX_EVENTS && (
                    <span className="ds-badge ds-badge-danger ds-badge-sm">
                      Max capacity
                    </span>
                  )}
                </div>
                <div className="ds-flex ds-gap-2">
                  <button 
                    onClick={clearEvents}
                    className="ds-btn-outline ds-btn-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
            <div className="ds-p-3 ds-overflow-y-auto ds-flex-1">
              <EventLog
                messages={filteredEvents}
                onClear={clearEvents}
                showSearch={true}
                showStats={false}
                maxHeight="100%"
              />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="ds-mb-6">
        <div className="ds-flex ds-justify-between ds-items-start ds-mb-4">
          <div>
            <h1 className="ds-page-title">Event Bus Demos</h1>
            <p className="ds-text-muted ds-mt-2">
              Multi-framework microfrontend communication patterns
            </p>
          </div>
          <div className="ds-flex ds-items-center ds-gap-4">
            <div className="ds-flex ds-gap-2">
              <div className="ds-metric-sm">
                <span className="ds-icon">📊</span>
                <span className="ds-text-sm">{metrics.eventRate}/min</span>
              </div>
              <div className="ds-metric-sm">
                <span className="ds-icon">⚡</span>
                <span className="ds-text-sm">{metrics.avgLatency}ms</span>
              </div>
              <div className="ds-metric-sm">
                <span className="ds-icon">📨</span>
                <span className="ds-text-sm">{metrics.totalEvents}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario Display */}
        
        {/* Scenario Description */}
        <div className="ds-alert-info ds-mt-4">
          <div className="ds-flex ds-items-center ds-gap-2">
            <span className="ds-text-lg">{currentScenario.icon}</span>
            <div>
              <div className="ds-font-semibold">{currentScenario.name}</div>
              <div className="ds-text-sm ds-text-muted">{currentScenario.description}</div>
            </div>
          </div>
        </div>

        {/* Layout Controls */}
        <div className="ds-flex ds-justify-between ds-items-center ds-mt-4">
          <div className="ds-flex ds-gap-2">
            <button
              className={`ds-btn-sm ${layoutMode === 'grid' ? 'ds-btn-primary' : 'ds-btn-outline'}`}
              onClick={() => setLayoutMode('grid')}
            >
              <span className="ds-icon">⊞</span> Grid Layout
            </button>
            <button
              className={`ds-btn-sm ${layoutMode === 'stacked' ? 'ds-btn-primary' : 'ds-btn-outline'}`}
              onClick={() => setLayoutMode('stacked')}
            >
              <span className="ds-icon">☰</span> Stacked Layout
            </button>
            <button
              className={`ds-btn-sm ${layoutMode === 'focus' ? 'ds-btn-primary' : 'ds-btn-outline'}`}
              onClick={() => setLayoutMode('focus')}
            >
              <span className="ds-icon">◻</span> Focus Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ds-space-y-4">
        {/* MFE Container */}
        <div className="ds-w-full">
          {/* Render all MFEs but control visibility/layout with CSS */}
          <div className={
            layoutMode === 'grid' ? 'ds-grid ds-grid-cols-2 ds-gap-3' :
            layoutMode === 'stacked' ? 'ds-flex ds-flex-col ds-gap-3' :
            'ds-space-y-4'
          }>
            {layoutMode === 'focus' && (
              <div className="ds-flex ds-gap-2">
                {currentScenario.mfes.map(mfe => (
                  <button
                    key={mfe.id}
                    className={`ds-btn-sm ${selectedMFE === mfe.id ? 'ds-btn-primary' : 'ds-btn-outline'}`}
                    onClick={() => setSelectedMFE(mfe.id)}
                  >
                    {mfe.title}
                  </button>
                ))}
              </div>
            )}
            
            {currentScenario.mfes.map((mfe, index) => {
              const isFullWidth = mfe.position === 'full-width';
              const isMarketWatch = mfe.id === 'mfe-market-watch';
              const isTradingTerminal = mfe.id === 'mfe-trading-terminal';
              
              return (
                <div
                  key={`${activeScenario}-${mfe.id}`} // Key includes scenario to force remount on scenario change
                  className={
                    layoutMode === 'focus' 
                      ? (selectedMFE === mfe.id ? 'ds-block' : 'ds-hidden')
                      : (isFullWidth && layoutMode === 'grid' ? 'ds-col-span-2' : '')
                  }
                  data-mfe-id={mfe.id}
                  style={
                    layoutMode === 'grid' && isMarketWatch && tradingTerminalHeight
                      ? { height: `${tradingTerminalHeight}px` }
                      : {}
                  }
                >
                  <MFECard 
                    id={mfe.id}
                    title={mfe.title}
                    framework={mfe.framework}
                    fullHeight={layoutMode === 'focus' || (layoutMode === 'grid' && isMarketWatch && !!tradingTerminalHeight)}
                  />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

// MFE Card Component with Framework Badge
const MFECard: React.FC<{
  id: string;
  title: string;
  framework: 'react' | 'vue' | 'vanilla';
  className?: string;
  fullHeight?: boolean;
}> = ({ id, title, framework, className = '', fullHeight = false }) => {
  const getFrameworkBadge = (framework: 'react' | 'vue' | 'vanilla') => {
    const badges = {
      react: { color: 'ds-bg-blue-500', icon: '⚛️', name: 'React' },
      vue: { color: 'ds-bg-green-500', icon: '💚', name: 'Vue' },
      vanilla: { color: 'ds-bg-yellow-600', icon: '📦', name: 'Vanilla' }
    };
    return badges[framework];
  };

  const badge = getFrameworkBadge(framework);

  return (
    <div className={`ds-card ds-p-0 ${fullHeight ? 'ds-h-full ds-flex ds-flex-col' : ''} ${className}`}>
      <div className="ds-px-3 ds-py-2 ds-border-b ds-bg-slate-50 ds-flex ds-items-center ds-justify-between ds-flex-shrink-0">
        <div className="ds-flex ds-items-center ds-gap-2">
          <span className="ds-text-sm ds-font-medium">{title}</span>
        </div>
        <div className={`ds-badge ds-badge-sm ${badge.color} ds-text-white`}>
          {badge.icon} {badge.name}
        </div>
      </div>
      <div className={`${fullHeight ? 'ds-flex-1 ds-overflow-hidden' : ''}`}>
        <RegistryMFELoader id={id} />
      </div>
    </div>
  );
};
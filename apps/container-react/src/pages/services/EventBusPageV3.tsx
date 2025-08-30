import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUI } from '@/contexts/UIContext';
import { RegistryMFELoader } from '@/components/RegistryMFELoader';
import { EventLog, TabGroup } from '@mfe/design-system-react';
import { getSharedServices } from '@/services/shared-services';

// Types
type LayoutMode = 'grid' | 'stacked' | 'focus';

type EventMessage = {
  id: string;
  event: string;
  data: any; // Make data required to match EventLog component
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
  const serviceContainer = useMemo(() => getSharedServices(), []);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Core state
  const [activeScenario] = useState<string>('trading');
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
  const [searchTerm] = useState('');
  const [filterType] = useState<string>('all');
  
  // Container playground state
  const [containerEventName, setContainerEventName] = useState('container:test');
  const [containerPayload, setContainerPayload] = useState('{"message": "Hello from Container!"}');
  const [listeningEvents, setListeningEvents] = useState<string[]>([
    'playground:*',    // Listen to all playground events
    'trade:*',         // Listen to trading events
    'market:*'         // Listen to market events
  ]);
  const [newListener, setNewListener] = useState('');
  const [containerEventHistory, setContainerEventHistory] = useState<EventMessage[]>([]);
  
  // Tab state - get initial tab from URL or default to 'dashboard'
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // Sync tab state with URL
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };
  
  // Container playground functions
  const sendContainerEvent = () => {
    try {
      const payload = JSON.parse(containerPayload);
      const eventBus = serviceContainer.get('eventBus');
      eventBus?.emit(containerEventName, payload);
      
      // Add to container event history
      const newEvent: EventMessage = {
        id: `${Date.now()}-${Math.random()}`,
        event: containerEventName,
        data: payload,
        timestamp: new Date().toLocaleTimeString(),
        source: 'sent'
      };
      setContainerEventHistory(prev => [newEvent, ...prev].slice(0, 20));
      
      addNotification({
        type: 'success',
        title: 'Event Sent',
        message: `Event "${containerEventName}" emitted from container`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Invalid JSON',
        message: 'Please enter valid JSON in the payload field'
      });
    }
  };
  
  const addContainerListener = () => {
    if (newListener && !listeningEvents.includes(newListener)) {
      setListeningEvents([...listeningEvents, newListener]);
      setNewListener('');
    }
  };
  
  const removeContainerListener = (eventPattern: string) => {
    setListeningEvents(listeningEvents.filter(e => e !== eventPattern));
  };
  
  // Helper to check if event matches pattern
  const matchesPattern = (eventName: string, pattern: string): boolean => {
    if (pattern === eventName) return true;
    if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, -2);
      return eventName.startsWith(prefix + ':');
    }
    return false;
  };

  // Subscribe to container playground events
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];
    
    listeningEvents.forEach(eventPattern => {
      // If it's a pattern, subscribe to all events and filter
      if (eventPattern.endsWith(':*')) {
        const eventBus = serviceContainer.get('eventBus');
        const unsubscribe = eventBus?.on('*', (event: any) => {
          const actualEventName = event.type;
          if (matchesPattern(actualEventName, eventPattern)) {
            // Add to container event history
            const newEvent: EventMessage = {
              id: `${Date.now()}-${Math.random()}`,
              event: actualEventName,
              data: event.data,
              timestamp: new Date().toLocaleTimeString(),
              source: 'received'
            };
            setContainerEventHistory(prev => [newEvent, ...prev].slice(0, 20));
            
            addNotification({
              type: 'info',
              title: `Event Received: ${actualEventName}`,
              message: `Matched pattern: ${eventPattern}`
            });
          }
        });
        if (unsubscribe) unsubscribes.push(unsubscribe);
      } else {
        // For exact event names, subscribe directly
        const eventBus = serviceContainer.get('eventBus');
        const unsubscribe = eventBus?.on(eventPattern, (event: any) => {
          // Add to container event history
          const newEvent: EventMessage = {
            id: `${Date.now()}-${Math.random()}`,
            event: event.type || eventPattern,
            data: event.data,
            timestamp: new Date().toLocaleTimeString(),
            source: 'received'
          };
          setContainerEventHistory(prev => [newEvent, ...prev].slice(0, 20));
          
          addNotification({
            type: 'info',
            title: `Event Received: ${eventPattern}`,
            message: JSON.stringify(event, null, 2).substring(0, 100)
          });
        });
        if (unsubscribe) unsubscribes.push(unsubscribe);
      }
    });
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [listeningEvents, serviceContainer, addNotification]);
  
  // Initialize selectedMFE when switching to focus mode
  useEffect(() => {
    if (layoutMode === 'focus' && !selectedMFE) {
      const currentScenario = scenarios.find(s => s.id === activeScenario);
      if (currentScenario && currentScenario.mfes.length > 0) {
        setSelectedMFE(currentScenario.mfes[0].id);
      }
    }
  }, [layoutMode, selectedMFE, activeScenario]);
  
  // Sync tab state with URL changes (e.g., browser back/forward)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

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

    const eventBus = serviceContainer.get('eventBus');
    const unsubscribe = eventBus?.on('*', handleEvent);
    return () => unsubscribe?.();
  }, [serviceContainer, activeScenario]);

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
                {/* Introduction */}
                <div className="ds-p-3 ds-bg-blue-50 ds-rounded-lg ds-border ds-border-blue-200">
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-2 ds-text-blue-800">🚀 Event Bus Overview</h5>
                  <div className="ds-text-xs ds-text-blue-700">
                    The Event Bus enables decoupled communication between MFEs using a publish-subscribe pattern. 
                    MFEs can emit events without knowing who will consume them, and subscribe to events without 
                    knowing who produces them. This creates a flexible, scalable architecture where MFEs remain 
                    independent yet collaborative.
                  </div>
                </div>

                {/* Basic Methods */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">Core Methods</h5>
                  <div className="ds-space-y-3">
                    <div className="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-mb-2">Emit Event</div>
                      <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border">
{`serviceContainer.eventBus.emit('event:type', {
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
{`const unsubscribe = serviceContainer.get('eventBus').on(
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
{`serviceContainer.eventBus.on('*', (payload) => {
  console.log(\`Event \${payload.type}:\`, payload.data);
});`}
                      </pre>
                      <div className="ds-text-xs ds-text-muted ds-mt-2">
                        Wildcard subscription to monitor all events. Useful for debugging.
                      </div>
                    </div>

                    <div className="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-mb-2">One-Time Event Listener</div>
                      <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border">
{`serviceContainer.eventBus.once('event:type', (payload) => {
  console.log('This fires only once:', payload);
});`}
                      </pre>
                      <div className="ds-text-xs ds-text-muted ds-mt-2">
                        Subscribe to an event that automatically unsubscribes after first trigger.
                      </div>
                    </div>

                    <div className="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-mb-2">Remove All Listeners</div>
                      <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border">
{`// Remove all listeners for a specific event
serviceContainer.get('eventBus').off('event:type');

// Remove all listeners for all events
serviceContainer.get('eventBus').off('*');`}
                      </pre>
                      <div className="ds-text-xs ds-text-muted ds-mt-2">
                        Clean up multiple subscriptions at once. Useful in cleanup scenarios.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Patterns */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">📊 Trading Dashboard Events</h5>
                  <div className="ds-space-y-3">
                    <div className="ds-p-3 ds-border ds-border-green-200 ds-bg-green-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-text-green-700 ds-mb-2">📈 Market Watch Events (React MFE)</div>
                      <div className="ds-grid ds-grid-cols-2 ds-gap-3">
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-green-800">market:stock-selected</code>
                          <div className="ds-text-xs ds-text-green-600 ds-mt-1">
                            Fired when user clicks on a stock. Payload: {`{symbol, name, price, change}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-green-800">market:price-alert</code>
                          <div className="ds-text-xs ds-text-green-600 ds-mt-1">
                            Random price updates every 2s. Payload: {`{symbol, price, change}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-green-800">market:volume-spike</code>
                          <div className="ds-text-xs ds-text-green-600 ds-mt-1">
                            Unusual volume detected. Payload: {`{symbol, volume, timestamp}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-green-800">market:watchlist-updated</code>
                          <div className="ds-text-xs ds-text-green-600 ds-mt-1">
                            Watchlist changed. Payload: {`{action, symbol, watchlist[]}`}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ds-p-3 ds-border ds-border-blue-200 ds-bg-blue-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-text-blue-700 ds-mb-2">💹 Trading Terminal Events (Vue MFE)</div>
                      <div className="ds-grid ds-grid-cols-2 ds-gap-3">
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-blue-800">trade:placed</code>
                          <div className="ds-text-xs ds-text-blue-600 ds-mt-1">
                            Order submitted. Payload: {`{orderId, symbol, action, quantity, price}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-blue-800">trade:executed</code>
                          <div className="ds-text-xs ds-text-blue-600 ds-mt-1">
                            Order filled. Payload: {`{orderId, symbol, action, quantity, price, total}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-blue-800">trade:cancelled</code>
                          <div className="ds-text-xs ds-text-blue-600 ds-mt-1">
                            Order cancelled. Payload: {`{orderId, symbol, reason}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-blue-800">trade:positions-closed</code>
                          <div className="ds-text-xs ds-text-blue-600 ds-mt-1">
                            All positions closed. Payload: {`{count, timestamp}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-blue-800">trade:portfolio-refreshed</code>
                          <div className="ds-text-xs ds-text-blue-600 ds-mt-1">
                            Portfolio updated. Payload: {`{positions, totalValue}`}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ds-p-3 ds-border ds-border-purple-200 ds-bg-purple-50 ds-rounded-lg">
                      <div className="ds-text-xs ds-font-semibold ds-text-purple-700 ds-mb-2">📊 Analytics Engine Events (Vanilla TS MFE)</div>
                      <div className="ds-grid ds-grid-cols-2 ds-gap-3">
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-purple-800">analytics:market-status</code>
                          <div className="ds-text-xs ds-text-purple-600 ds-mt-1">
                            Market metrics update (every 5s). Payload: {`{sentiment, volatility, momentum, riskLevel}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-purple-800">analytics:sentiment-change</code>
                          <div className="ds-text-xs ds-text-purple-600 ds-mt-1">
                            Market sentiment shift. Payload: {`{from, to, confidence}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-purple-800">analytics:risk-alert</code>
                          <div className="ds-text-xs ds-text-purple-600 ds-mt-1">
                            Risk level warning. Payload: {`{level, message, symbols[]}`}
                          </div>
                        </div>
                        <div>
                          <code className="ds-text-xs ds-font-mono ds-text-purple-800">analytics:report-generated</code>
                          <div className="ds-text-xs ds-text-purple-600 ds-mt-1">
                            Report ready. Payload: {`{type, url, timestamp}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Advanced Patterns */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">🔧 Advanced Patterns</h5>
                  <div className="ds-space-y-3">
                    <div className="ds-p-3 ds-bg-yellow-50 ds-rounded-lg ds-border ds-border-yellow-200">
                      <div className="ds-text-xs ds-font-semibold ds-mb-2 ds-text-yellow-800">Event Filtering</div>
                      <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border">
{`// Subscribe only to specific stock events
serviceContainer.get('eventBus').on('market:*', (payload) => {
  if (payload.data?.symbol === 'AAPL') {
    handleAppleEvents(payload);
  }
});`}
                      </pre>
                    </div>

                    <div className="ds-p-3 ds-bg-yellow-50 ds-rounded-lg ds-border ds-border-yellow-200">
                      <div className="ds-text-xs ds-font-semibold ds-mb-2 ds-text-yellow-800">Request-Response Pattern</div>
                      <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border">
{`// MFE A: Request data
serviceContainer.get('eventBus').emit('data:request', {
  requestId: 'req-123',
  type: 'portfolio'
});

// MFE B: Respond to request
serviceContainer.get('eventBus').on('data:request', (payload) => {
  serviceContainer.get('eventBus').emit('data:response', {
    requestId: payload.data.requestId,
    data: getPortfolioData()
  });
});`}
                      </pre>
                    </div>

                    <div className="ds-p-3 ds-bg-yellow-50 ds-rounded-lg ds-border ds-border-yellow-200">
                      <div className="ds-text-xs ds-font-semibold ds-mb-2 ds-text-yellow-800">Event Chaining</div>
                      <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border">
{`// Chain multiple events for workflows
serviceContainer.get('eventBus').on('trade:executed', async (payload) => {
  // Update analytics
  await updateMetrics(payload.data);
  serviceContainer.get('eventBus').emit('analytics:updated', {
    tradeId: payload.data.orderId
  });
  
  // Trigger risk assessment
  serviceContainer.get('eventBus').emit('risk:assess', {
    portfolio: getCurrentPortfolio()
  });
});`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Best Practices */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">✨ Best Practices & Tips</h5>
                  <div className="ds-grid ds-grid-cols-2 ds-gap-3">
                    <div className="ds-p-3 ds-bg-green-50 ds-rounded-lg ds-border ds-border-green-200">
                      <div className="ds-text-xs ds-font-semibold ds-text-green-700 ds-mb-2">✅ Do's</div>
                      <ul className="ds-text-xs ds-space-y-1 ds-text-green-600">
                        <li>• Use namespaced events (e.g., 'module:action')</li>
                        <li>• Always unsubscribe when component unmounts</li>
                        <li>• Include timestamp in event payload</li>
                        <li>• Handle errors gracefully in subscribers</li>
                        <li>• Document your event contracts</li>
                        <li>• Use TypeScript interfaces for payloads</li>
                        <li>• Implement retry logic for critical events</li>
                        <li>• Log events in development mode</li>
                      </ul>
                    </div>
                    
                    <div className="ds-p-3 ds-bg-red-50 ds-rounded-lg ds-border ds-border-red-200">
                      <div className="ds-text-xs ds-font-semibold ds-text-red-700 ds-mb-2">❌ Don'ts</div>
                      <ul className="ds-text-xs ds-space-y-1 ds-text-red-600">
                        <li>• Don't use generic event names</li>
                        <li>• Don't forget to clean up subscriptions</li>
                        <li>• Don't emit sensitive data in events</li>
                        <li>• Don't create circular event chains</li>
                        <li>• Don't rely on event ordering</li>
                        <li>• Don't mutate event payload objects</li>
                        <li>• Don't emit events in tight loops</li>
                        <li>• Don't assume events will always arrive</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Performance Tips */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">⚡ Performance Optimization</h5>
                  <div className="ds-p-3 ds-bg-orange-50 ds-rounded-lg ds-border ds-border-orange-200">
                    <ul className="ds-text-xs ds-space-y-2 ds-text-orange-700">
                      <li>
                        <strong>Debounce High-Frequency Events:</strong> Use debouncing for events that fire rapidly
                        <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border ds-mt-1">
{`const debouncedEmit = debounce((data) => {
  serviceContainer.get('eventBus').emit('search:query', data);
}, 300);`}
                        </pre>
                      </li>
                      <li>
                        <strong>Batch Events:</strong> Combine multiple related events into one
                        <pre className="ds-text-xs ds-bg-white ds-p-2 ds-rounded ds-border ds-mt-1">
{`serviceContainer.eventBus.emit('trades:batch', {
  trades: [trade1, trade2, trade3]
});`}
                        </pre>
                      </li>
                      <li>
                        <strong>Use Event Pools:</strong> Reuse event objects to reduce garbage collection
                      </li>
                      <li>
                        <strong>Implement Event Throttling:</strong> Limit event emission rate for non-critical updates
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Example Implementation */}
                <div>
                  <h5 className="ds-text-sm ds-font-semibold ds-mb-3 ds-text-primary">Complete Example</h5>
                  <div className="ds-p-3 ds-bg-slate-50 ds-rounded-lg">
                    <pre className="ds-text-xs ds-bg-white ds-p-3 ds-rounded ds-border ds-overflow-x-auto">
{`// React Component Example
const MyTradingComponent: React.FC<{ serviceContainer: ServiceContainer }> = ({ serviceContainer }) => {
  useEffect(() => {
    // Subscribe to stock selection
    const unsubStockSelected = serviceContainer.get('eventBus')?.on(
      'market:stock-selected',
      (payload) => {
        console.log('Stock selected:', payload.data.symbol);
        // Update component state
      }
    );

    // Subscribe to trade execution
    const unsubTradeExecuted = serviceContainer.get('eventBus')?.on(
      'trade:executed',
      (payload) => {
        const { symbol, quantity, price } = payload.data;
        console.log(\`Trade executed: \${quantity} \${symbol} @ $\${price}\`);
      }
    );

    // Emit an event
    serviceContainer.get('eventBus')?.emit('trade:placed', {
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
  }, [serviceContainer]);

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

      </div>

      {/* Tabs for Trading Terminal Demo and Playground */}
      <TabGroup
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={[
          {
            id: 'dashboard',
            label: '📊 Trading Terminal Demo',
            content: (
              <>
                {/* Scenario Description */}
                <div className="ds-alert-info ds-mb-4">
                  <div className="ds-flex ds-items-center ds-gap-2">
                    <span className="ds-text-lg">{currentScenario.icon}</span>
                    <div>
                      <div className="ds-font-semibold">{currentScenario.name}</div>
                      <div className="ds-text-sm ds-text-muted">{currentScenario.description}</div>
                    </div>
                  </div>
                </div>

                {/* Layout Controls */}
                <div className="ds-flex ds-justify-between ds-items-center ds-mb-4">
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
                  <div className="ds-flex ds-gap-2">
                    <span className="ds-badge ds-badge-info">React MFE</span>
                    <span className="ds-badge ds-badge-success">Vue MFE</span>
                    <span className="ds-badge ds-badge-warning">Vanilla MFE</span>
                  </div>
                </div>

                {/* MFE Container */}
                <div className="ds-w-full">
                  <div className={
                    layoutMode === 'grid' ? 'ds-grid ds-grid-cols-2 ds-gap-3' :
                    layoutMode === 'stacked' ? 'ds-flex ds-flex-col ds-gap-3' :
                    'ds-space-y-4'
                  }>
                    {layoutMode === 'focus' && (
                      <div className="ds-flex ds-gap-2 ds-mb-4">
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
                    
                    {currentScenario.mfes.map((mfe) => {
                      const isFullWidth = mfe.position === 'full-width';
                      
                      return (
                        <div
                          key={`${activeScenario}-${mfe.id}`}
                          className={
                            layoutMode === 'focus' 
                              ? (selectedMFE === mfe.id ? 'ds-block' : 'ds-hidden')
                              : (isFullWidth && layoutMode === 'grid' ? 'ds-col-span-2' : '')
                          }
                        >
                          <MFECard 
                            id={mfe.id}
                            title={mfe.title}
                            framework={mfe.framework}
                            fullHeight={layoutMode === 'focus'}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )
          },
          {
            id: 'playground',
            label: '🎮 Playground',
            content: (
              <div className="ds-space-y-4">
                <div className="ds-alert-info">
                  <div className="ds-flex ds-items-center ds-gap-2">
                    <span className="ds-text-lg">🚀</span>
                    <div>
                      <div className="ds-font-semibold">Interactive Event Bus Playground</div>
                      <div className="ds-text-sm ds-text-muted">Test event emission and subscription from both Container and MFEs</div>
                    </div>
                  </div>
                </div>
                
                {/* Container Event Playground */}
                <div className="ds-card ds-p-4">
                  <div className="ds-flex ds-justify-between ds-items-center ds-mb-4">
                    <h4 className="ds-card-title ds-mb-0">🏠 Container Event Controls</h4>
                    <span className="ds-badge ds-badge-info">React Container</span>
                  </div>
                  
                  <div className="ds-grid ds-grid-cols-3 ds-gap-4">
                    {/* Container Event Emitter */}
                    <div className="ds-p-3 ds-border ds-rounded-lg">
                      <h5 className="ds-text-sm ds-font-semibold ds-mb-3">📤 Event Emitter</h5>
                      
                      <div className="ds-space-y-3">
                        <div>
                          <label className="ds-text-xs ds-text-muted ds-block ds-mb-1">Event Name</label>
                          <input
                            type="text"
                            className="ds-input ds-input-sm"
                            value={containerEventName}
                            onChange={(e) => setContainerEventName(e.target.value)}
                            placeholder="e.g., container:test"
                          />
                        </div>
                        
                        <div>
                          <label className="ds-text-xs ds-text-muted ds-block ds-mb-1">
                            Payload (JSON)
                          </label>
                          <textarea
                            className="ds-textarea ds-textarea-sm"
                            rows={3}
                            value={containerPayload}
                            onChange={(e) => setContainerPayload(e.target.value)}
                            placeholder='{"message": "Hello World"}'
                          />
                        </div>
                        
                        <button
                          className="ds-btn-primary ds-btn-sm ds-w-full"
                          onClick={sendContainerEvent}
                        >
                          Send Event
                        </button>
                      </div>
                    </div>
                    
                    {/* Container Event Listeners */}
                    <div className="ds-p-3 ds-border ds-rounded-lg">
                      <h5 className="ds-text-sm ds-font-semibold ds-mb-3">📥 Event Listeners</h5>
                      
                      <div className="ds-space-y-3">
                        <div>
                          <label className="ds-text-xs ds-text-muted ds-block ds-mb-1">Add Listener</label>
                          <div className="ds-flex ds-gap-2">
                            <input
                              type="text"
                              className="ds-input ds-input-sm ds-flex-1"
                              value={newListener}
                              onChange={(e) => setNewListener(e.target.value)}
                              placeholder="Event pattern..."
                              onKeyDown={(e) => e.key === 'Enter' && addContainerListener()}
                            />
                            <button
                              className="ds-btn-secondary ds-btn-sm"
                              onClick={addContainerListener}
                              disabled={!newListener.trim()}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="ds-text-xs ds-text-muted ds-block ds-mb-1">Active Listeners</label>
                          {listeningEvents.length > 0 ? (
                            <div className="ds-flex ds-flex-wrap ds-gap-1">
                              {listeningEvents.map((eventPattern) => (
                                <div key={eventPattern} className="ds-badge ds-badge-sm ds-badge-info ds-flex ds-items-center ds-gap-1">
                                  <span className="ds-text-xs">{eventPattern}</span>
                                  <button
                                    className="ds-text-xs ds-opacity-70 ds-hover:opacity-100"
                                    onClick={() => removeContainerListener(eventPattern)}
                                    aria-label={`Stop listening to ${eventPattern}`}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="ds-text-muted ds-text-xs">No active listeners</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Container Event History */}
                    <div className="ds-p-3 ds-border ds-rounded-lg">
                      <div className="ds-flex ds-justify-between ds-items-center ds-mb-3">
                        <h5 className="ds-text-sm ds-font-semibold">📜 Event History</h5>
                        <button
                          className="ds-btn-outline ds-btn-sm"
                          onClick={() => setContainerEventHistory([])}
                          disabled={containerEventHistory.length === 0}
                        >
                          Clear
                        </button>
                      </div>
                      
                      {containerEventHistory.length > 0 ? (
                        <div className="ds-space-y-2 ds-max-h-64 ds-overflow-y-auto">
                          {containerEventHistory.map((event) => (
                            <div
                              key={event.id}
                              className={`ds-p-2 ds-rounded ds-border ds-text-xs ${
                                event.source === 'sent' 
                                  ? 'ds-bg-accent-primary-soft ds-border-accent-primary' 
                                  : 'ds-bg-accent-success-soft ds-border-accent-success'
                              }`}
                            >
                              <div className="ds-flex ds-justify-between ds-items-start ds-mb-1">
                                <div className="ds-flex ds-items-center ds-gap-2">
                                  <span className="ds-font-medium">
                                    {event.source === 'sent' ? '📤' : '📥'}
                                  </span>
                                  <span className="ds-font-mono">{event.event}</span>
                                </div>
                                <span className="ds-text-muted">{event.timestamp}</span>
                              </div>
                              <pre className="ds-text-xs ds-bg-surface ds-p-1 ds-rounded ds-overflow-x-auto">
                                {JSON.stringify(event.data, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="ds-text-muted ds-text-xs ds-text-center ds-py-4">
                          No events yet. Send an event or add a listener!
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="ds-mt-3 ds-p-2 ds-bg-accent-primary-soft ds-rounded ds-text-xs">
                    <p className="ds-text-center">
                      💡 <strong>Tip:</strong> Container events can communicate with all MFEs. Try sending events between the container and Solid.js MFE below!
                    </p>
                  </div>
                </div>

                {/* Solid.js MFE Playground */}
                <div className="ds-card">
                  <RegistryMFELoader id="mfe-event-playground" />
                </div>
              </div>
            )
          }
        ]}
        defaultTab="dashboard"
        className="ds-mt-4"
      />
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
      react: { color: 'ds-bg-blue-500', icon: '⚛️', name: 'React MFE' },
      vue: { color: 'ds-bg-green-500', icon: '💚', name: 'Vue MFE' },
      vanilla: { color: 'ds-bg-yellow-600', icon: '📦', name: 'Vanilla MFE' }
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
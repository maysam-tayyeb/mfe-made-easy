import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useUI } from '@/contexts/UIContext';
import { EventPayload } from '@mfe/dev-kit';
import { getMFEServicesSingleton } from '@/services/mfe-services-singleton';
import { EVENTS } from '@mfe/shared';
import { IsolatedMFELoader } from '@/components/IsolatedMFELoader';
import { useRegistryContext } from '@/contexts/RegistryContext';

interface EventLogEntry {
  id: string;
  timestamp: Date;
  type: string;
  source: string;
  data: any;
  direction: 'sent' | 'received';
}

interface MFEStatus {
  name: string;
  version: string;
  loadTime: number;
  status: 'loaded' | 'loading' | 'error';
  lastEvent?: string;
}

export const MFECommunicationPage: React.FC = () => {
  const { addNotification } = useUI();
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [mfeStatuses, setMfeStatuses] = useState<Record<string, MFEStatus>>({});
  const [customEventType, setCustomEventType] = useState('container.broadcast');
  const [customEventData, setCustomEventData] = useState(
    '{"message": "Broadcast from container", "timestamp": "' + new Date().toISOString() + '"}'
  );
  // Get the registry from context
  const { registry, isLoading: registryLoading } = useRegistryContext();

  // Get MFE manifests
  const serviceExplorerManifest = registry?.get('serviceExplorer');
  const legacyServiceExplorerManifest = registry?.get('legacyServiceExplorer');

  // Get singleton MFE services
  const mfeServices = useMemo(() => {
    return getMFEServicesSingleton();
  }, []);

  // Get the shared event bus from services
  const eventBus = mfeServices.eventBus;

  // Memoize error handlers to prevent re-renders
  const handleServiceExplorerError = useCallback(
    (error: Error) => {
      addNotification({
        type: 'error',
        title: 'MFE Load Error',
        message: `Failed to load Service Explorer MFE: ${error.message}`,
      });
    },
    [addNotification]
  );

  const handleLegacyServiceExplorerError = useCallback(
    (error: Error) => {
      addNotification({
        type: 'error',
        title: 'MFE Load Error',
        message: `Failed to load Legacy Service Explorer MFE: ${error.message}`,
      });
    },
    [addNotification]
  );

  useEffect(() => {
    let eventQueue: EventLogEntry[] = [];
    let timeoutId: NodeJS.Timeout;

    // Batch event updates to reduce re-renders
    const flushEventQueue = () => {
      if (eventQueue.length > 0) {
        setEventLog((prev) => [...eventQueue, ...prev].slice(0, 50));
        eventQueue = [];
      }
    };

    // Listen to ALL events using wildcard
    const unsubscribe = eventBus.on('*', (payload: EventPayload<any>) => {
      // Track MFE status immediately (important for UI)
      const eventType = payload.type;
      if (eventType === EVENTS.MFE_LOADED || eventType === 'mfe.loaded') {
        const { name, version } = payload.data;
        setMfeStatuses((prev) => ({
          ...prev,
          [name]: {
            name,
            version,
            loadTime: Date.now(),
            status: 'loaded',
            lastEvent: 'loaded',
          },
        }));
      } else if (eventType === EVENTS.MFE_UNLOADED || eventType === 'mfe.unloaded') {
        const { name } = payload.data;
        setMfeStatuses((prev) => {
          const newStatuses = { ...prev };
          delete newStatuses[name];
          return newStatuses;
        });
      }

      const logEntry: EventLogEntry = {
        id: Date.now() + Math.random().toString(),
        timestamp: new Date(payload.timestamp),
        type: payload.type,
        source: payload.source || 'unknown',
        data: payload.data,
        direction: payload.source === 'container' ? 'sent' : 'received',
      };

      // Queue the event instead of updating state immediately
      eventQueue.push(logEntry);

      // Debounce the flush to batch updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(flushEventQueue, 100);
    });

    // Add initial log entry
    const initialEntry: EventLogEntry = {
      id: 'init',
      timestamp: new Date(),
      type: 'system.initialized',
      source: 'container',
      data: { message: 'MFE Communication page loaded' },
      direction: 'sent',
    };
    setEventLog([initialEntry]);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
      flushEventQueue(); // Flush any remaining events
    };
  }, [eventBus, mfeServices]);

  const handlePublishEvent = () => {
    try {
      const data = JSON.parse(customEventData);
      eventBus.emit(customEventType, data);

      // Manually add to event log since the container doesn't listen to its own events
      const logEntry: EventLogEntry = {
        id: Date.now() + Math.random().toString(),
        timestamp: new Date(),
        type: customEventType,
        source: 'container',
        data: data,
        direction: 'sent',
      };
      setEventLog((prev) => [logEntry, ...prev].slice(0, 50));

      addNotification({
        type: 'success',
        title: 'Event Emitted',
        message: `Emitted "${customEventType}" event to all MFEs`,
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Invalid JSON',
        message: 'Please check your event data format',
      });
    }
  };

  const clearEventLog = () => {
    setEventLog([]);
    addNotification({
      type: 'info',
      title: 'Event Log Cleared',
      message: 'All event log entries have been cleared',
    });
  };

  const formatEventData = (data: any) => {
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MFE Communication Center</h1>
        <p className="text-muted-foreground mt-2">
          Test inter-MFE communication with real-time event monitoring
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Active MFEs</p>
          <p className="text-2xl font-bold">{Object.keys(mfeStatuses).length}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Total Events</p>
          <p className="text-2xl font-bold">{eventLog.length}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">From Container</p>
          <p className="text-2xl font-bold">
            {eventLog.filter((e) => e.direction === 'sent').length}
          </p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">From MFEs</p>
          <p className="text-2xl font-bold">
            {eventLog.filter((e) => e.direction === 'received').length}
          </p>
        </div>
      </div>

      {/* Event Bus Controls and Event Log */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Bus Controls */}
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Event Bus Controls</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <input
                type="text"
                value={customEventType}
                onChange={(e) => setCustomEventType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="container.broadcast"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Data (JSON)</label>
              <textarea
                value={customEventData}
                onChange={(e) => setCustomEventData(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                rows={3}
                placeholder='{"message": "Hello from container!"}'
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePublishEvent} size="sm">
                Emit Event
              </Button>
              <Button onClick={clearEventLog} variant="outline" size="sm">
                Clear Event Log
              </Button>
            </div>
          </div>
        </div>

        {/* Event Log */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Real-time Event Log</h2>
            <div className="text-sm text-muted-foreground">{eventLog.length} events</div>
          </div>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '300px' }}>
            {eventLog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events logged yet. Interact with the MFEs below to see events.
              </div>
            ) : (
              eventLog.map((entry) => (
                <div key={entry.id} className="p-3 rounded border border-border bg-card">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{entry.type}</span>
                      <span className="px-2 py-1 rounded text-xs border border-border bg-background text-foreground font-medium">
                        {entry.direction === 'sent' ? '→ OUT' : '← IN'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span>
                      From: <strong>{entry.source}</strong>
                    </span>
                  </div>
                  <pre className="text-xs bg-muted text-foreground p-2 rounded border border-border overflow-x-auto font-mono">
                    {formatEventData(entry.data)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two-Column MFE Layout - Service Explorer MFEs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold">Service Explorer MFE (React 19)</h3>
          </div>
          <div className="p-4">
            {!registryLoading && serviceExplorerManifest ? (
              <IsolatedMFELoader
                name={serviceExplorerManifest.name}
                url={serviceExplorerManifest.url}
                services={mfeServices}
                fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading Service Explorer MFE...
                      </p>
                    </div>
                  </div>
                }
                onError={handleServiceExplorerError}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">
                  {registryLoading ? 'Loading registry...' : 'MFE not found in registry'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h3 className="text-sm font-semibold">Legacy Service Explorer MFE (React 17)</h3>
          </div>
          <div className="p-4">
            {!registryLoading && legacyServiceExplorerManifest ? (
              <IsolatedMFELoader
                name={legacyServiceExplorerManifest.name}
                url={legacyServiceExplorerManifest.url}
                services={mfeServices}
                fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">
                        Loading Legacy Service Explorer MFE...
                      </p>
                    </div>
                  </div>
                }
                onError={handleLegacyServiceExplorerError}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">
                  {registryLoading ? 'Loading registry...' : 'MFE not found in registry'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

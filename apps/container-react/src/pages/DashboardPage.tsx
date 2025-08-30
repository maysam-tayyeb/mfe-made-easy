import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUI } from '@/contexts/UIContext';
import { useRegistry } from '@/hooks/useRegistry';
import { Hero, MetricCard, LoadingState, EmptyState, TabGroup } from '@mfe/design-system-react';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Package,
  Shield,
  Zap,
  Server,
  Globe,
  Database,
  GitBranch,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { addNotification } = useUI();
  const { registry, isLoading, error, reload } = useRegistry();

  const allMfes = useMemo(() => registry.getAll(), [registry]);
  const mfeCount = Object.keys(allMfes).length;

  const handleReloadRegistry = () => {
    addNotification({
      type: 'info',
      title: 'Registry Reloading',
      message: 'Refreshing MFE registry...',
    });

    reload();

    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Registry Updated',
        message: 'MFE registry has been successfully reloaded.',
      });
    }, 1500);
  };

  const platformInfoTabs = [
    {
      id: 'services',
      label: 'Services',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 ds-card-compact">
            <div className="flex items-center gap-3">
              <div className="ds-status-dot ds-status-online"></div>
              <span className="text-sm font-medium">Container App</span>
            </div>
            <Badge variant="default" className="text-xs">
              Running
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 ds-card-compact">
            <div className="flex items-center gap-3">
              <div className="ds-status-dot ds-status-online"></div>
              <span className="text-sm font-medium">Event Bus</span>
            </div>
            <Badge variant="default" className="text-xs">
              Active
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 ds-card-compact">
            <div className="flex items-center gap-3">
              <div className="ds-status-dot ds-status-online"></div>
              <span className="text-sm font-medium">Auth Service</span>
            </div>
            <Badge variant="default" className="text-xs">
              Connected
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 ds-card-compact">
            <div className="flex items-center gap-3">
              <div className="ds-status-dot ds-status-online"></div>
              <span className="text-sm font-medium">Modal Service</span>
            </div>
            <Badge variant="default" className="text-xs">
              Ready
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 ds-card-compact">
            <div className="flex items-center gap-3">
              <div className="ds-status-dot ds-status-online"></div>
              <span className="text-sm font-medium">Notification Service</span>
            </div>
            <Badge variant="default" className="text-xs">
              Active
            </Badge>
          </div>
        </div>
      ),
    },
    {
      id: 'configuration',
      label: 'Configuration',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs ds-text-muted">Version</p>
            <p className="text-sm font-medium">1.0.0</p>
          </div>
          <div>
            <p className="text-xs ds-text-muted">Environment</p>
            <p className="text-sm font-medium">Development</p>
          </div>
          <div>
            <p className="text-xs ds-text-muted">Module Format</p>
            <p className="text-sm font-medium">ES Modules</p>
          </div>
          <div>
            <p className="text-xs ds-text-muted">React Version</p>
            <p className="text-sm font-medium">19.0.0</p>
          </div>
          <div>
            <p className="text-xs ds-text-muted">Container Port</p>
            <p className="text-sm font-medium">3000</p>
          </div>
          <div>
            <p className="text-xs ds-text-muted">Registry Type</p>
            <p className="text-sm font-medium">Standard Manifest</p>
          </div>
        </div>
      ),
    },
    {
      id: 'features',
      label: 'Features',
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 ds-icon-success" />
            <span className="text-sm">Dynamic MFE Loading</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 ds-icon-success" />
            <span className="text-sm">Event-driven Architecture</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 ds-icon-success" />
            <span className="text-sm">Shared Dependencies</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 ds-icon-success" />
            <span className="text-sm">Cross-version React Support</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 ds-icon-success" />
            <span className="text-sm">Standard Manifest Schema</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 ds-icon-success" />
            <span className="text-sm">Zero Global Pollution</span>
          </div>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <LoadingState
        size="lg"
        text="Loading platform data..."
        subtext="Fetching registry and service status"
      />
    );
  }

  if (error) {
    return (
      <div className="ds-page">
        <EmptyState
          title="Dashboard Load Error"
          description={error.message}
          icon={<XCircle className="h-16 w-16 ds-icon-danger" />}
          action={
            <Button onClick={reload} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="ds-page">
      {/* Hero Section */}
      <Hero
        title="Platform Dashboard"
        description="Monitor and manage your microfrontend platform in real-time"
        gradient
        actions={
          <Button onClick={handleReloadRegistry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Registry
          </Button>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ds-mb-lg">
        <MetricCard
          label="Total MFEs"
          value={mfeCount}
          trend={{
            value: 'Available in registry',
            direction: 'up',
          }}
          icon={<Package className="h-4 w-4" />}
        />
        <MetricCard
          label="Frameworks"
          value="4"
          trend={{
            value: 'React, Vue, Solid, Vanilla',
            direction: 'up',
          }}
          icon={<Zap className="h-4 w-4" />}
        />
        <MetricCard
          label="Services"
          value="5"
          trend={{
            value: 'Event Bus, Modal, Auth, etc.',
            direction: 'up',
          }}
          icon={<Shield className="h-4 w-4" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ds-mb-lg">
        {/* Platform Information */}
        <div className="lg:col-span-2">
          <div className="ds-card-padded">
            <h2 className="ds-section-title ds-mb-md">Platform Information</h2>
            <TabGroup tabs={platformInfoTabs} defaultTab="services" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ds-card-padded">
          <h2 className="ds-section-title ds-mb-md">Quick Actions</h2>
          <div className="ds-stack-sm">
            <button
              onClick={handleReloadRegistry}
              className="ds-card-compact ds-hover-scale flex items-center gap-3 w-full text-left"
            >
              <RefreshCw className="h-4 w-4 ds-icon-success" />
              <div className="flex-1">
                <p className="text-sm font-medium">Reload Registry</p>
                <p className="text-xs ds-text-muted">Refresh MFE list</p>
              </div>
              <ChevronRight className="h-4 w-4 ds-text-muted" />
            </button>

            <button
              onClick={() => (window.location.href = '/services/event-bus')}
              className="ds-card-compact ds-hover-scale flex items-center gap-3 w-full text-left"
            >
              <Globe className="h-4 w-4 ds-icon-info" />
              <div className="flex-1">
                <p className="text-sm font-medium">Event Bus Demo</p>
                <p className="text-xs ds-text-muted">Trading platform scenario</p>
              </div>
              <ChevronRight className="h-4 w-4 ds-text-muted" />
            </button>

            <button
              onClick={() => (window.location.href = '/services/notifications')}
              className="ds-card-compact ds-hover-scale flex items-center gap-3 w-full text-left"
            >
              <Shield className="h-4 w-4 ds-icon-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Notifications Demo</p>
                <p className="text-xs ds-text-muted">Cross-framework demos</p>
              </div>
              <ChevronRight className="h-4 w-4 ds-text-muted" />
            </button>
          </div>
        </div>
      </div>

      {/* MFE Registry */}
      <div className="ds-mb-lg">
        <h2 className="ds-section-title ds-mb-md">MFE Registry</h2>
        <div className="grid gap-4">
          {Object.entries(allMfes).map(([name, manifest]) => {
            return (
              <div key={name} className="ds-card-padded">
                <div className="flex items-start justify-between ds-mb-sm">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 ds-icon-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="ds-card-title">{manifest.metadata?.displayName || name}</h3>
                        <Badge variant="default" className="text-xs">
                          MFE
                        </Badge>
                      </div>
                      <p className="text-xs ds-text-muted mt-1">
                        {manifest.metadata?.description || `Version ${manifest.version}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    v{manifest.version}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs ds-text-muted mb-1">URL</p>
                    <code className="text-xs p-2 ds-bg-muted rounded block truncate">
                      {manifest.url}
                    </code>
                  </div>

                  {manifest.metadata?.tags && manifest.metadata.tags.length > 0 && (
                    <div>
                      <p className="text-xs ds-text-muted mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {manifest.metadata.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {manifest.requirements?.services && manifest.requirements.services.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs ds-text-muted mb-2">Required Services</p>
                    <div className="flex flex-wrap gap-2">
                      {manifest.requirements.services
                        .filter((s) => !s.optional)
                        .map((service) => (
                          <Badge key={service.name} variant="outline" className="text-xs">
                            {service.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="ds-card-padded ds-bg-accent-primary-soft">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <Server className="h-6 w-6 ds-icon-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{mfeCount}</p>
            <p className="text-xs ds-text-muted">Total MFEs</p>
          </div>
          <div>
            <Database className="h-6 w-6 ds-icon-success mx-auto mb-2" />
            <p className="text-2xl font-bold">4</p>
            <p className="text-xs ds-text-muted">Frameworks</p>
          </div>
          <div>
            <GitBranch className="h-6 w-6 ds-icon-info mx-auto mb-2" />
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs ds-text-muted">Services</p>
          </div>
        </div>
      </div>
    </div>
  );
};

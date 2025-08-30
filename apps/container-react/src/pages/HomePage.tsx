import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Zap,
  Package,
  Radio,
  Database,
  AlertCircle,
  Activity,
  Blocks,
  Shield,
  Users,
  Sparkles,
  Code,
  Globe,
  Layers,
  GitBranch,
} from 'lucide-react';
import { Hero, MetricCard } from '@mfe/design-system-react';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import { useRegistryContext } from '@/contexts/RegistryContext';

export const HomePage: React.FC = () => {
  const metrics = usePlatformMetrics();
  const { registry } = useRegistryContext();

  // Default values for when metrics are not yet loaded
  const bundleReduction = metrics?.bundleReduction ?? 97;
  const stateSyncLatency = metrics?.stateSyncLatency ?? 0;
  const typeSafetyCoverage = metrics?.typeSafetyCoverage ?? 100;
  const activeMFEs = metrics?.activeMFEs ?? (registry ? Object.keys(registry.getAll()).length : 0);

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Dynamic Loading',
      description: 'ES modules with on-demand loading',
      color: 'ds-icon-primary',
      link: '/services/loader',
    },
    {
      icon: <Database className="h-5 w-5" />,
      title: 'Universal State',
      description: 'Cross-MFE & cross-tab sync',
      color: 'ds-icon-success',
      link: '/universal-state-demo',
    },
    {
      icon: <Radio className="h-5 w-5" />,
      title: 'Event System',
      description: 'Type-safe pub/sub communication',
      color: 'ds-icon-info',
      link: '/services/event-bus',
    },
    {
      icon: <Blocks className="h-5 w-5" />,
      title: 'Any Framework',
      description: 'React, Vue, Solid.js, Vanilla JS',
      color: 'ds-icon-warning',
      link: '/dashboard',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Error Boundaries',
      description: 'Isolate failures, keep running',
      color: 'ds-icon-danger',
      link: '/error-boundary-demo',
    },
    {
      icon: <GitBranch className="h-5 w-5" />,
      title: 'Independent Deploy',
      description: 'Deploy MFEs separately',
      color: 'ds-accent-neutral',
      link: '/dashboard',
    },
  ];

  return (
    <div className="ds-page">
      {/* Hero Section */}
      <Hero
        title="MFE Toolkit"
        description="A comprehensive microfrontend toolkit with dynamic ES module loading, cross-framework state management, and strong isolation boundaries"
        gradient
        actions={
          <>
            <Button asChild>
              <Link to="/dashboard">
                <Sparkles className="h-4 w-4 mr-2" />
                Explore Platform
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/services/event-bus">
                <Radio className="h-4 w-4 mr-2" />
                Try Event Bus
              </Link>
            </Button>
          </>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ds-mb-lg">
        <MetricCard
          label="Bundle Reduction"
          value={`${bundleReduction}%`}
          trend={{ value: 'via import maps', direction: 'up' }}
          icon={<Package className="h-4 w-4" />}
        />
        <MetricCard
          label="Active MFEs"
          value={activeMFEs}
          trend={{ value: 'ready', direction: 'neutral' }}
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          label="State Sync"
          value={`${stateSyncLatency}ms`}
          trend={{ value: 'real-time', direction: 'up' }}
          icon={<Database className="h-4 w-4" />}
        />
        <MetricCard
          label="Type Safety"
          value={`${typeSafetyCoverage}%`}
          trend={{ value: 'end-to-end', direction: 'up' }}
          icon={<Shield className="h-4 w-4" />}
        />
      </div>

      {/* Core Features Grid */}
      <div className="ds-mb-lg">
        <h2 className="ds-section-title ds-mb-md ds-center">Core Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <Link key={index} to={feature.link} className="ds-card-padded ds-hover-lift group">
              <div className="flex items-start gap-4">
                <div className={`${feature.color} ds-mt-xs`}>{feature.icon}</div>
                <div className="flex-1">
                  <h3 className="ds-card-title group-hover:ds-accent-primary ds-mb-xs">
                    {feature.title}
                  </h3>
                  <p className="ds-text-sm ds-text-muted">{feature.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 ds-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demo Applications */}
        <div className="ds-card-padded">
          <div className="flex items-center gap-2 ds-mb-sm">
            <Code className="h-5 w-5 ds-icon-primary" />
            <h3 className="ds-section-title">Demo Applications</h3>
          </div>
          <p className="ds-text-sm ds-text-muted ds-mb-md">
            Explore live demonstrations of platform capabilities
          </p>
          <div className="ds-stack-sm">
            <Link
              to="/services/event-bus"
              className="ds-card-compact ds-hover-scale flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Radio className="h-4 w-4 ds-icon-success" />
                <span className="ds-text-sm font-medium">Trading Platform</span>
              </div>
              <Badge variant="secondary" className="ds-text-xs">
                Live
              </Badge>
            </Link>

            <Link
              to="/services/notifications"
              className="ds-card-compact ds-hover-scale flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 ds-icon-info" />
                <span className="ds-text-sm font-medium">Notifications</span>
              </div>
              <Badge variant="secondary" className="ds-text-xs">
                Live
              </Badge>
            </Link>

            <Link
              to="/services/modal"
              className="ds-card-compact ds-hover-scale flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Blocks className="h-4 w-4 ds-icon-warning" />
                <span className="ds-text-sm font-medium">Modal Service</span>
              </div>
              <Badge variant="secondary" className="ds-text-xs">
                Live
              </Badge>
            </Link>
          </div>
        </div>

        {/* Available MFEs */}
        <div className="ds-card-padded">
          <div className="flex items-center gap-2 ds-mb-sm">
            <Layers className="h-5 w-5 ds-icon-warning" />
            <h3 className="ds-section-title">Microfrontends</h3>
          </div>
          <p className="ds-text-sm ds-text-muted ds-mb-md">
            Real-world trading platform MFEs
          </p>
          <div className="ds-stack-sm">
            <Link
              to="/services/event-bus"
              className="ds-card-compact ds-hover-scale flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 ds-icon-primary" />
                <span className="text-sm font-medium">Market Watch</span>
              </div>
              <Badge variant="outline" className="text-xs">
                React
              </Badge>
            </Link>

            <Link
              to="/services/event-bus"
              className="ds-card-compact ds-hover-scale flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 ds-icon-success" />
                <span className="text-sm font-medium">Trading Terminal</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Vue 3
              </Badge>
            </Link>

            <Link
              to="/services/event-bus"
              className="ds-card-compact ds-hover-scale flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 ds-icon-info" />
                <span className="text-sm font-medium">Event Playground</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Solid.js
              </Badge>
            </Link>
          </div>
        </div>

        {/* Documentation */}
        <div className="ds-card-padded">
          <div className="flex items-center gap-2 ds-mb-sm">
            <Globe className="h-5 w-5 ds-icon-success" />
            <h3 className="ds-section-title">Documentation</h3>
          </div>
          <p className="ds-text-sm ds-text-muted ds-mb-md">Learn about the platform architecture</p>
          <div className="ds-stack-sm">
            <Link
              to="/dashboard"
              className="ds-card-compact ds-hover-scale flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 ds-icon-primary" />
                <span className="text-sm font-medium">Getting Started</span>
              </div>
              <ArrowRight className="h-4 w-4 ds-text-muted" />
            </Link>

            <Link
              to="/dashboard#mfe-registry"
              className="ds-card-compact ds-hover-scale flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Blocks className="h-4 w-4 ds-icon-warning" />
                <span className="text-sm font-medium">View All MFEs</span>
              </div>
              <ArrowRight className="h-4 w-4 ds-text-muted" />
            </Link>

            <Link
              to="/services/event-bus"
              className="ds-card-compact ds-hover-scale flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Code className="h-4 w-4 ds-icon-success" />
                <span className="text-sm font-medium">Services API</span>
              </div>
              <ArrowRight className="h-4 w-4 ds-text-muted" />
            </Link>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="ds-card-padded bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 text-center">
        <h2 className="ds-section-title ds-mb-sm">Ready to Build?</h2>
        <p className="text-sm ds-text-muted ds-mb-md">
          Start building scalable microfrontend applications with the MFE Toolkit
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link to="/dashboard">
              <Users className="h-4 w-4 mr-2" />
              View Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href="https://github.com/mfe-toolkit" target="_blank" rel="noopener noreferrer">
              <GitBranch className="h-4 w-4 mr-2" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

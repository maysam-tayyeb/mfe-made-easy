import React from 'react';
import { MFELoader } from './MFELoader';
import type { ServiceContainer, MFEManifest } from '@mfe-toolkit/core';

interface MFEPageProps {
  manifest: MFEManifest;
  serviceContainer: ServiceContainer;
  fallback?: React.ReactNode;
  isolate?: boolean;
}

export const MFEPage: React.FC<MFEPageProps> = ({
  manifest,
  serviceContainer,
  fallback,
  isolate = false,
}) => {
  return (
    <MFELoader
      name={manifest.name}
      url={manifest.url}
      serviceContainer={serviceContainer}
      fallback={fallback}
      isolate={isolate}
      onError={(error) => {
        const logger = serviceContainer.get('logger');
        if (logger) {
          logger.error(`Failed to load MFE ${manifest.name}:`, error);
        }
        // Try to use notification service if available
        const notification = serviceContainer.get('notification' as any);
        if (notification && typeof (notification as any).error === 'function') {
          (notification as any).error('MFE Load Error', error.message);
        }
      }}
    />
  );
};

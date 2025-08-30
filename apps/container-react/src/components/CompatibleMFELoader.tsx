import React, { useEffect, useState } from 'react';
import type { MFEManifest, ServiceContainer } from '@mfe-toolkit/core';
import { MFELoader } from '@mfe-toolkit/react';
import { compatibilityChecker } from '@/services/compatibility-checker';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface CompatibleMFELoaderProps {
  manifest: MFEManifest;
  services: ServiceContainer;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  forceLoad?: boolean; // Allow loading even if incompatible (for development)
}

export const CompatibleMFELoader: React.FC<CompatibleMFELoaderProps> = ({
  manifest,
  services,
  fallback,
  onError,
  forceLoad = false,
}) => {
  const [compatibilityResult, setCompatibilityResult] = useState(() =>
    compatibilityChecker.checkCompatibility(manifest)
  );
  const [userAcceptedRisk, setUserAcceptedRisk] = useState(false);

  useEffect(() => {
    // Re-check compatibility if manifest changes
    setCompatibilityResult(compatibilityChecker.checkCompatibility(manifest));
    setUserAcceptedRisk(false);
  }, [manifest]);

  // Show errors if incompatible
  if (!compatibilityResult.compatible && !forceLoad && !userAcceptedRisk) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>MFE Compatibility Error: {manifest.name}</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>This MFE is not compatible with the current container:</p>
              <ul className="list-disc list-inside space-y-1">
                {compatibilityResult.errors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
              {import.meta.env.DEV && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setUserAcceptedRisk(true)}>
                    Load Anyway (Development Only)
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show warnings if any
  const showWarnings = compatibilityResult.warnings.length > 0;

  return (
    <div>
      {showWarnings && (
        <Alert className="mb-2">
          <AlertTitle>Compatibility Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {compatibilityResult.warnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <MFELoader
        name={manifest.name}
        url={manifest.url}
        serviceContainer={services}
        fallback={fallback}
        onError={onError}
        isolate={true}
      />
    </div>
  );
};

import React, { createContext, useContext } from 'react';
import type { ServiceContainer } from '@mfe-toolkit/core';

const MFEServicesContext = createContext<ServiceContainer | null>(null);

export interface MFEServicesProviderProps {
  serviceContainer: ServiceContainer;
  children: React.ReactNode;
}

export const MFEServicesProvider: React.FC<MFEServicesProviderProps> = ({ serviceContainer, children }) => {
  return <MFEServicesContext.Provider value={serviceContainer}>{children}</MFEServicesContext.Provider>;
};

export const useMFEServices = (): ServiceContainer => {
  const context = useContext(MFEServicesContext);
  if (!context) {
    throw new Error('useMFEServices must be used within MFEServicesProvider');
  }
  return context;
};

export const useMFEService = <T = any>(serviceName: string): T | undefined => {
  const services = useMFEServices();
  return services.get(serviceName as any) as T | undefined;
};
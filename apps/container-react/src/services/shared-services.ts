import { ServiceContainer } from '@mfe-toolkit/core';
import { createSharedServices } from './mfe-services';

let sharedServicesInstance: ServiceContainer | null = null;

export const getSharedServices = (): ServiceContainer => {
  if (!sharedServicesInstance) {
    sharedServicesInstance = createSharedServices();
  }

  return sharedServicesInstance;
};

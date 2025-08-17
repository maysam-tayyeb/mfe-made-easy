import type { MFEModule, MFEServiceContainer } from '@mfe-toolkit/core';

const module: MFEModule = {
  metadata: {
    name: 'mfe-modal-vanilla',
    version: '1.0.0',
    requiredServices: ["modal","logger"],
    capabilities: ["modal-demo","modal-testing"]
  },

  mount: async (element: HTMLElement, container: MFEServiceContainer) => {
    const services = container.getAllServices();
    
    let clickCount = 0;

    element.innerHTML = `
      <div class="ds-card ds-p-6 ds-m-4">
        <div class="ds-text-center">
          <h1 class="ds-text-3xl ds-font-bold ds-mb-2 ds-text-accent-primary">
            📦 Hello from mfe-modal-vanilla!
          </h1>
          <p class="ds-text-gray-600 ds-mb-6">
            Vanilla TypeScript MFE • Zero Dependencies
          </p>
          
          <div class="ds-card-compact ds-inline-block ds-p-4">
            <div class="ds-text-4xl ds-font-bold ds-text-accent-primary ds-mb-2">
              <span id="counter">0</span>
            </div>
            <button id="increment-btn" class="ds-btn-primary">
              Click me!
            </button>
          </div>
          
          <p class="ds-text-sm ds-text-gray-500 ds-mt-6">
            Built with ❤️ using MFE Toolkit
          </p>
        </div>
      </div>
    `;
    
    element.querySelector('#increment-btn')?.addEventListener('click', () => {
      clickCount++;
      const counterEl = element.querySelector('#counter');
      if (counterEl) counterEl.textContent = String(clickCount);
      services.logger?.info(`Button clicked! Count: ${clickCount}`);
    });
    
    if (services.logger) {
      services.logger.info('[mfe-modal-vanilla] Mounted successfully');
    }
  },
  
  unmount: async (container: MFEServiceContainer) => {
    const services = container.getAllServices();
    if (services.logger) {
      services.logger.info('[mfe-modal-vanilla] Unmounted successfully');
    }
  }
};

export default module;
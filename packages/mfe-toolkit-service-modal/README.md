# @mfe-toolkit/service-modal

Modal/dialog service for MFE Toolkit - provides centralized modal management across microfrontends.

## Installation

```bash
npm install @mfe-toolkit/service-modal
# or
pnpm add @mfe-toolkit/service-modal
```

## Overview

The Modal Service provides a centralized way to manage modals and dialogs across your microfrontend architecture. It handles modal stacking, focus management, and provides a consistent API for all MFEs to display modals.

## Key Features

- 📚 **Modal Stacking**: Manage multiple modals with proper z-index handling
- 🎯 **Focus Management**: Automatic focus trapping and restoration
- 🎨 **Customizable**: Support for different modal sizes and styles
- 🔄 **Dynamic Content**: Update modal content after opening
- 🎭 **Framework Agnostic**: Works with any frontend framework
- ⌨️ **Keyboard Support**: ESC to close, configurable behavior

## Usage

### Basic Setup

```typescript
import { createModalService } from '@mfe-toolkit/service-modal';

// Create service
const modalService = createModalService();
```

### Service Registration (MFE Container)

```typescript
import { createServiceRegistry } from '@mfe-toolkit/core';
import { modalServiceProvider } from '@mfe-toolkit/service-modal';

const registry = createServiceRegistry();
registry.registerProvider(modalServiceProvider);
await registry.initialize();
```

### Using in MFEs

```typescript
// In your MFE module
export default {
  mount(element: HTMLElement, container: ServiceContainer) {
    const modal = container.get('modal');
    
    // Open a simple modal
    const modalId = modal.open({
      title: 'Confirm Action',
      content: 'Are you sure you want to proceed?',
      onConfirm: () => {
        console.log('Confirmed!');
        modal.close(modalId);
      },
      onClose: () => {
        console.log('Cancelled');
      }
    });
  }
};
```

## API Reference

### `ModalService` Interface

#### Core Methods

##### `open(config: BaseModalConfig): string`
Opens a modal and returns its unique ID.

```typescript
const modalId = modal.open({
  title: 'Welcome',
  content: 'Welcome to our application!',
  size: 'md',
  showCloseButton: true
});
```

##### `close(id?: string): void`
Closes a specific modal by ID, or the most recent modal if no ID provided.

```typescript
// Close specific modal
modal.close(modalId);

// Close most recent modal
modal.close();
```

##### `closeAll(): void`
Closes all open modals.

```typescript
modal.closeAll();
```

##### `update(id: string, config: Partial<BaseModalConfig>): void`
Updates an existing modal's configuration.

```typescript
modal.update(modalId, {
  title: 'Updated Title',
  content: 'New content here'
});
```

##### `isOpen(id?: string): boolean`
Checks if a specific modal is open, or if any modal is open.

```typescript
// Check specific modal
if (modal.isOpen(modalId)) {
  console.log('Modal is still open');
}

// Check if any modal is open
if (modal.isOpen()) {
  console.log('At least one modal is open');
}
```

##### `getOpenModals(): Array<{ id: string; config: BaseModalConfig }>`
Returns all currently open modals.

```typescript
const openModals = modal.getOpenModals();
console.log(`${openModals.length} modals are open`);
```

### Types

#### `BaseModalConfig`
```typescript
interface BaseModalConfig<TContent = any> {
  // Required
  title: string;              // Modal title
  content: TContent;          // Modal content (string, HTML, or component data)
  
  // Optional - Appearance
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; // Modal size
  className?: string;         // Custom CSS class
  zIndex?: number;           // Custom z-index
  
  // Optional - Behavior
  showCloseButton?: boolean;      // Show X button (default: true)
  closeOnOverlayClick?: boolean;  // Close on backdrop click (default: true)
  closeOnEscape?: boolean;         // Close on ESC key (default: true)
  
  // Optional - Actions
  showConfirmButton?: boolean;     // Show confirm button
  showCancelButton?: boolean;      // Show cancel button
  confirmText?: string;            // Confirm button text (default: 'Confirm')
  cancelText?: string;             // Cancel button text (default: 'Cancel')
  confirmVariant?: 'primary' | 'danger' | 'success'; // Confirm button style
  
  // Callbacks
  onClose?: () => void;           // Called when modal closes
  onConfirm?: () => void | Promise<void>; // Called on confirm
}
```

## Common Use Cases

### Confirmation Dialog

```typescript
function deleteItem(itemId: string) {
  const modal = getModalService();
  
  modal.open({
    title: 'Delete Item',
    content: 'Are you sure you want to delete this item? This action cannot be undone.',
    size: 'sm',
    confirmVariant: 'danger',
    confirmText: 'Delete',
    cancelText: 'Keep',
    showConfirmButton: true,
    showCancelButton: true,
    onConfirm: async () => {
      await api.deleteItem(itemId);
      toast.success('Item deleted');
      modal.close();
    }
  });
}
```

### Information Modal

```typescript
function showInfo() {
  const modal = getModalService();
  
  modal.open({
    title: 'How It Works',
    content: `
      <div>
        <h3>Step 1: Create Account</h3>
        <p>Sign up with your email address</p>
        
        <h3>Step 2: Verify Email</h3>
        <p>Check your inbox for verification link</p>
        
        <h3>Step 3: Start Using</h3>
        <p>You're ready to go!</p>
      </div>
    `,
    size: 'lg',
    showConfirmButton: false,
    showCancelButton: false
  });
}
```

### Form Modal

```typescript
function openEditForm(userId: string) {
  const modal = getModalService();
  
  const modalId = modal.open({
    title: 'Edit User',
    content: {
      type: 'form',
      userId: userId,
      fields: ['name', 'email', 'role']
    },
    size: 'md',
    confirmText: 'Save Changes',
    showConfirmButton: true,
    showCancelButton: true,
    onConfirm: async () => {
      const formData = getFormData(modalId);
      await api.updateUser(userId, formData);
      modal.close(modalId);
      toast.success('User updated');
    }
  });
}
```

### Loading Modal

```typescript
async function performLongOperation() {
  const modal = getModalService();
  
  // Show loading modal
  const loadingId = modal.open({
    title: 'Processing',
    content: 'Please wait while we process your request...',
    showCloseButton: false,
    closeOnOverlayClick: false,
    closeOnEscape: false,
    showConfirmButton: false,
    showCancelButton: false
  });
  
  try {
    const result = await api.longOperation();
    
    // Update to success
    modal.update(loadingId, {
      title: 'Success!',
      content: 'Operation completed successfully.',
      showCloseButton: true,
      showConfirmButton: true,
      confirmText: 'OK'
    });
  } catch (error) {
    // Update to error
    modal.update(loadingId, {
      title: 'Error',
      content: `Operation failed: ${error.message}`,
      showCloseButton: true,
      confirmVariant: 'danger'
    });
  }
}
```

### Nested Modals

```typescript
function openParentModal() {
  const modal = getModalService();
  
  const parentId = modal.open({
    title: 'Parent Modal',
    content: 'This is the parent modal',
    showConfirmButton: true,
    confirmText: 'Open Child',
    onConfirm: () => {
      // Open child modal
      const childId = modal.open({
        title: 'Child Modal',
        content: 'This is a nested modal',
        size: 'sm',
        onClose: () => {
          console.log('Child closed');
        }
      });
    }
  });
}
```

## Framework Integration Examples

### React Component

```typescript
import { useEffect, useState } from 'react';
import { useService } from '@mfe-toolkit/react';

function ModalButton({ title, content }) {
  const modal = useService('modal');
  
  const handleClick = () => {
    modal?.open({
      title,
      content,
      onClose: () => console.log('Modal closed')
    });
  };
  
  return <button onClick={handleClick}>Open Modal</button>;
}
```

### Vue Component

```vue
<template>
  <button @click="openModal">Open Modal</button>
</template>

<script setup>
import { inject } from 'vue';

const modal = inject('modal');

const openModal = () => {
  modal?.open({
    title: 'Vue Modal',
    content: 'This modal was opened from Vue!',
    size: 'md'
  });
};
</script>
```

### Angular Component

```typescript
@Component({
  selector: 'app-modal-trigger',
  template: `<button (click)="openModal()">Open Modal</button>`
})
export class ModalTriggerComponent {
  constructor(
    @Inject('modal') private modal: ModalService
  ) {}
  
  openModal() {
    this.modal.open({
      title: 'Angular Modal',
      content: 'This modal was opened from Angular!',
      size: 'lg'
    });
  }
}
```

## Styling

The Modal Service provides semantic CSS classes that can be styled by your design system:

```css
/* Modal structure classes */
.ds-modal-backdrop     /* Overlay background */
.ds-modal             /* Modal container */
.ds-modal-content     /* Content wrapper */
.ds-modal-header      /* Header section */
.ds-modal-title       /* Title text */
.ds-modal-body        /* Body content */
.ds-modal-footer      /* Footer with actions */

/* Size modifiers */
.ds-modal-sm          /* Small modal */
.ds-modal-md          /* Medium modal (default) */
.ds-modal-lg          /* Large modal */
.ds-modal-xl          /* Extra large modal */
.ds-modal-full        /* Full screen modal */

/* State classes */
.ds-modal-open        /* Applied to body when modal is open */
.ds-modal-stacked     /* Applied when multiple modals are open */
```

## Accessibility

The Modal Service includes built-in accessibility features:

- **Focus Management**: Automatically traps focus within modal
- **Keyboard Navigation**: ESC to close, Tab to navigate
- **ARIA Attributes**: Proper roles and labels
- **Screen Reader Support**: Announces modal opening/closing

```typescript
// Accessibility-enhanced modal
modal.open({
  title: 'Accessible Modal',
  content: 'This modal follows WCAG guidelines',
  // These are applied automatically:
  // role="dialog"
  // aria-modal="true"
  // aria-labelledby={titleId}
  // aria-describedby={contentId}
});
```

## Best Practices

1. **Always provide a way to close**: Either close button, cancel button, or overlay click
2. **Use appropriate sizes**: Don't use 'xl' or 'full' for simple confirmations
3. **Handle async operations**: Show loading state for async confirms
4. **Clean up on unmount**: Close modals when components unmount
5. **Avoid deep nesting**: Limit to 2-3 levels of modal stacking
6. **Test keyboard navigation**: Ensure all interactive elements are reachable
7. **Provide clear actions**: Use descriptive button text

## Error Handling

```typescript
try {
  const modalId = modal.open({
    title: 'Data Form',
    content: formContent,
    onConfirm: async () => {
      try {
        await saveData();
        modal.close(modalId);
      } catch (error) {
        // Keep modal open and show error
        modal.update(modalId, {
          content: `Error: ${error.message}`,
          confirmVariant: 'danger'
        });
      }
    }
  });
} catch (error) {
  console.error('Failed to open modal:', error);
}
```

## License

MIT
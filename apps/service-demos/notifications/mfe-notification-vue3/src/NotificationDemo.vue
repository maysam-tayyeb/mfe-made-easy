<template>
  <div class="ds-p-4">
    <div class="ds-mb-6">
      <h2 class="ds-text-2xl ds-font-bold ds-mb-2">Vue 3 Notification Demo</h2>
      <p class="ds-text-gray-600">
        Framework: <span class="ds-font-medium">Vue 3.4.0</span> | 
        Pattern: <span class="ds-font-medium">MFEModule</span>
      </p>
    </div>

    <div class="ds-space-y-4">
      <!-- Notification Types -->
      <div>
        <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Notification Types</h3>
        <div class="ds-flex ds-flex-wrap ds-gap-2">
          <button 
            @click="showSuccess"
            class="ds-btn-success"
          >
            Success
          </button>
          <button 
            @click="showError"
            class="ds-btn-danger"
          >
            Error
          </button>
          <button 
            @click="showWarning"
            class="ds-btn-warning"
          >
            Warning
          </button>
          <button 
            @click="showInfo"
            class="ds-btn-primary"
          >
            Info
          </button>
        </div>
      </div>

      <!-- Custom Message -->
      <div>
        <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Custom Notification</h3>
        <div class="ds-space-y-3">
          <div>
            <label class="ds-block ds-text-sm ds-font-medium ds-mb-1">Title</label>
            <input 
              v-model="customTitle"
              type="text"
              class="ds-input"
              placeholder="Enter notification title"
            />
          </div>
          <div>
            <label class="ds-block ds-text-sm ds-font-medium ds-mb-1">Message</label>
            <textarea 
              v-model="customMessage"
              class="ds-textarea"
              rows="3"
              placeholder="Enter notification message"
            ></textarea>
          </div>
          <div>
            <label class="ds-block ds-text-sm ds-font-medium ds-mb-1">Type</label>
            <select v-model="customType" class="ds-select">
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <button 
            @click="showCustom"
            class="ds-btn-primary"
          >
            Show Custom Notification
          </button>
        </div>
      </div>

      <!-- Duration Control -->
      <div>
        <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Duration Control</h3>
        <div class="ds-flex ds-gap-2">
          <button 
            @click="showShortDuration"
            class="ds-btn-outline"
          >
            Short (1s)
          </button>
          <button 
            @click="showNormalDuration"
            class="ds-btn-outline"
          >
            Normal (3s)
          </button>
          <button 
            @click="showLongDuration"
            class="ds-btn-outline"
          >
            Long (10s)
          </button>
          <button 
            @click="showPersistent"
            class="ds-btn-outline"
          >
            Persistent
          </button>
        </div>
      </div>

      <!-- Batch Notifications -->
      <div>
        <h3 class="ds-text-lg ds-font-semibold ds-mb-3">Batch Operations</h3>
        <div class="ds-flex ds-gap-2">
          <button 
            @click="showMultiple"
            class="ds-btn-secondary"
          >
            Show 5 Notifications
          </button>
          <button 
            @click="clearAll"
            class="ds-btn-outline"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Counter -->
    <div class="ds-mt-6 ds-p-3 ds-bg-gray-50 ds-rounded">
      <p class="ds-text-sm ds-text-gray-600">
        Notifications shown: <span class="ds-font-semibold">{{ notificationCount }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Logger } from '@mfe-toolkit/core';
import type { NotificationService, NotificationType } from '@mfe-toolkit/service-notification';

interface Props {
  notification: NotificationService;
  logger: Logger;
}

const props = defineProps<Props>();

const notificationCount = ref(0);
const customTitle = ref('Custom Notification');
const customMessage = ref('This is a custom notification message');
const customType = ref<NotificationType>('info');

const showNotification = (
  title: string,
  message: string,
  type: NotificationType = 'info',
  duration?: number
) => {
  props.notification.show({
      title,
      message,
      type,
      duration
  });
  notificationCount.value++;
  props.logger.info(`Notification shown: ${title} - ${message}`);
};

const showSuccess = () => {
  showNotification(
    'Success!',
    'Operation completed successfully from Vue 3 MFE',
    'success'
  );
};

const showError = () => {
  showNotification(
    'Error Occurred',
    'Something went wrong in the Vue 3 MFE',
    'error'
  );
};

const showWarning = () => {
  showNotification(
    'Warning',
    'Please review this warning from Vue 3',
    'warning'
  );
};

const showInfo = () => {
  showNotification(
    'Information',
    'This is an informational message from Vue 3',
    'info'
  );
};

const showCustom = () => {
  showNotification(
    customTitle.value,
    customMessage.value,
    customType.value
  );
};

const showShortDuration = () => {
  showNotification(
    'Quick Message',
    'This will disappear in 1 second',
    'info',
    1000
  );
};

const showNormalDuration = () => {
  showNotification(
    'Normal Duration',
    'This will disappear in 3 seconds',
    'info',
    3000
  );
};

const showLongDuration = () => {
  showNotification(
    'Long Duration',
    'This will stay for 10 seconds',
    'info',
    10000
  );
};

const showPersistent = () => {
  showNotification(
    'Persistent Notification',
    'This won\'t auto-dismiss (close manually)',
    'warning',
    0
  );
};

const showMultiple = () => {
  const messages = [
    { title: 'First', message: 'Vue 3 notification 1', type: 'info' as const },
    { title: 'Second', message: 'Vue 3 notification 2', type: 'success' as const },
    { title: 'Third', message: 'Vue 3 notification 3', type: 'warning' as const },
    { title: 'Fourth', message: 'Vue 3 notification 4', type: 'error' as const },
    { title: 'Fifth', message: 'Vue 3 notification 5', type: 'info' as const }
  ];

  messages.forEach((msg, index) => {
    setTimeout(() => {
      showNotification(msg.title, msg.message, msg.type);
    }, index * 200);
  });
};

const clearAll = () => {
  props.notification.dismissAll();
  props.logger.info('All notifications cleared');
};
</script>
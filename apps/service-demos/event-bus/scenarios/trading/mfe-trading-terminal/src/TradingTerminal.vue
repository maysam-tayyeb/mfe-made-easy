<template>
  <div class="ds-p-4">
    <div class="ds-flex ds-justify-between ds-items-center ds-mb-4">
      <h4 class="ds-card-title ds-mb-0">💹 Trading Terminal</h4>
      <div class="ds-flex ds-gap-2">
        <span class="ds-badge ds-badge-info">Balance: ${{ accountBalance.toLocaleString() }}</span>
        <span class="ds-badge" :class="marketStatus === 'open' ? 'ds-badge-success' : 'ds-badge-secondary'">
          Market: {{ marketStatus }}
        </span>
      </div>
    </div>

    <div class="ds-grid ds-grid-cols-2 ds-gap-4">
      <!-- Order Form -->
      <div class="ds-p-3 ds-border ds-rounded-lg">
        <h5 class="ds-text-sm ds-font-semibold ds-mb-3">Place Order</h5>
        
        <div class="ds-space-y-3">
          <div>
            <label class="ds-text-xs ds-text-muted ds-block ds-mb-1">Symbol</label>
            <input 
              v-model="orderForm.symbol" 
              type="text" 
              class="ds-input ds-input-sm"
              placeholder="e.g., AAPL"
            >
          </div>

          <div>
            <label class="ds-text-xs ds-text-muted ds-block ds-mb-1">Order Type</label>
            <div class="ds-flex ds-gap-2">
              <button 
                @click="orderForm.type = 'market'"
                :class="['ds-btn-sm', orderForm.type === 'market' ? 'ds-btn-primary' : 'ds-btn-outline']"
              >
                Market
              </button>
              <button 
                @click="orderForm.type = 'limit'"
                :class="['ds-btn-sm', orderForm.type === 'limit' ? 'ds-btn-primary' : 'ds-btn-outline']"
              >
                Limit
              </button>
              <button 
                @click="orderForm.type = 'stop'"
                :class="['ds-btn-sm', orderForm.type === 'stop' ? 'ds-btn-primary' : 'ds-btn-outline']"
              >
                Stop
              </button>
            </div>
          </div>

          <div>
            <label class="ds-text-xs ds-text-muted ds-block ds-mb-1">Action</label>
            <div class="ds-flex ds-gap-2">
              <button 
                @click="orderForm.action = 'buy'"
                :class="['ds-btn-sm ds-flex-1', orderForm.action === 'buy' ? 'ds-btn-success' : 'ds-btn-outline']"
              >
                Buy
              </button>
              <button 
                @click="orderForm.action = 'sell'"
                :class="['ds-btn-sm ds-flex-1', orderForm.action === 'sell' ? 'ds-btn-danger' : 'ds-btn-outline']"
              >
                Sell
              </button>
            </div>
          </div>

          <div class="ds-grid ds-grid-cols-2 ds-gap-2">
            <div>
              <label class="ds-text-xs ds-text-muted ds-block ds-mb-1">Quantity</label>
              <input 
                v-model.number="orderForm.quantity" 
                type="number" 
                class="ds-input ds-input-sm"
                placeholder="100"
              >
            </div>
            <div v-if="orderForm.type !== 'market'">
              <label class="ds-text-xs ds-text-muted ds-block ds-mb-1">Price</label>
              <input 
                v-model.number="orderForm.price" 
                type="number" 
                step="0.01"
                class="ds-input ds-input-sm"
                placeholder="0.00"
              >
            </div>
          </div>

          <div v-if="estimatedTotal > 0" class="ds-p-2 ds-bg-slate-50 ds-rounded ds-text-sm">
            <div class="ds-flex ds-justify-between">
              <span class="ds-text-muted">Estimated Total:</span>
              <span class="ds-font-medium">${{ estimatedTotal.toFixed(2) }}</span>
            </div>
          </div>

          <button 
            @click="placeOrder"
            :class="['ds-btn-sm ds-w-full', orderForm.action === 'buy' ? 'ds-btn-success' : 'ds-btn-danger']"
            :disabled="!canPlaceOrder"
          >
            {{ orderForm.action === 'buy' ? '🛒' : '💰' }} Place {{ orderForm.action }} Order
          </button>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="ds-p-3 ds-border ds-rounded-lg">
        <h5 class="ds-text-sm ds-font-semibold ds-mb-3">Recent Orders</h5>
        
        <div v-if="orders.length === 0" class="ds-text-center ds-py-8 ds-text-muted ds-text-sm">
          No orders placed yet
        </div>
        
        <div v-else class="ds-space-y-2 ds-max-h-64 ds-overflow-y-auto">
          <div 
            v-for="order in orders" 
            :key="order.id"
            class="ds-p-2 ds-border ds-rounded ds-text-xs"
          >
            <div class="ds-flex ds-justify-between ds-items-start">
              <div>
                <div class="ds-flex ds-items-center ds-gap-2">
                  <span class="ds-font-medium">{{ order.symbol }}</span>
                  <span :class="['ds-badge ds-badge-sm', order.action === 'buy' ? 'ds-badge-success' : 'ds-badge-danger']">
                    {{ order.action }}
                  </span>
                  <span :class="['ds-badge ds-badge-sm', getStatusBadgeClass(order.status)]">
                    {{ order.status }}
                  </span>
                </div>
                <div class="ds-text-muted ds-mt-1">
                  {{ order.quantity }} @ ${{ order.price.toFixed(2) }} • {{ order.type }}
                </div>
              </div>
              <div class="ds-text-right">
                <div class="ds-font-medium">${{ (order.quantity * order.price).toFixed(2) }}</div>
                <div class="ds-text-muted">{{ order.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Positions -->
    <div class="ds-mt-4 ds-p-3 ds-border ds-rounded-lg">
        <h5 class="ds-text-sm ds-font-semibold ds-mb-3">Open Positions</h5>
        
        <div v-if="positions.length === 0" class="ds-text-center ds-py-4 ds-text-muted ds-text-sm">
          No open positions
        </div>
        
        <div v-else class="ds-grid ds-grid-cols-3 ds-gap-2">
          <div 
            v-for="position in positions" 
            :key="position.symbol"
            class="ds-p-2 ds-border ds-rounded ds-text-xs"
          >
            <div class="ds-flex ds-justify-between ds-items-center">
              <div>
                <span class="ds-font-medium">{{ position.symbol }}</span>
                <div class="ds-text-muted">{{ position.shares }} shares</div>
              </div>
              <div class="ds-text-right">
                <div :class="position.pnl >= 0 ? 'ds-text-success' : 'ds-text-danger'">
                  {{ position.pnl >= 0 ? '+' : '' }}{{ position.pnl.toFixed(2) }}%
                </div>
                <div class="ds-text-muted">${{ position.value.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Quick Actions -->
    <div class="ds-mt-4 ds-flex ds-gap-2">
        <button @click="closeAllPositions" class="ds-btn-outline ds-btn-sm">
          🚪 Close All
        </button>
        <button @click="cancelPendingOrders" class="ds-btn-outline ds-btn-sm">
          ❌ Cancel Pending
        </button>
        <button @click="refreshPortfolio" class="ds-btn-outline ds-btn-sm">
          🔄 Refresh
        </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { ServiceContainer } from '@mfe-toolkit/core';

const props = defineProps<{
  serviceContainer: ServiceContainer;
}>();

const eventBus = props.serviceContainer.require('eventBus');
const logger = props.serviceContainer.require('logger');
const notification = props.serviceContainer.get('notification');

type Order = {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  quantity: number;
  price: number;
  status: 'pending' | 'executed' | 'cancelled' | 'rejected';
  time: string;
};

type Position = {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
};

const orderForm = ref({
  symbol: 'AAPL',
  type: 'market' as 'market' | 'limit' | 'stop',
  action: 'buy' as 'buy' | 'sell',
  quantity: 100,
  price: 0
});

const orders = ref<Order[]>([]);
const positions = ref<Position[]>([]);
const accountBalance = ref(100000);
const marketStatus = ref<'open' | 'closed'>('open');
const currentPrices = ref<Record<string, number>>({
  AAPL: 178.35,
  GOOGL: 138.92,
  MSFT: 405.63,
  AMZN: 155.47,
  TSLA: 242.84,
  META: 492.31,
  NVDA: 875.28
});

const estimatedTotal = computed(() => {
  const price = orderForm.value.type === 'market' 
    ? (currentPrices.value[orderForm.value.symbol] || 0)
    : orderForm.value.price;
  return orderForm.value.quantity * price;
});

const canPlaceOrder = computed(() => {
  return orderForm.value.symbol && 
         orderForm.value.quantity > 0 && 
         (orderForm.value.type === 'market' || orderForm.value.price > 0);
});

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'executed': return 'ds-badge-success';
    case 'pending': return 'ds-badge-warning';
    case 'cancelled': return 'ds-badge-secondary';
    case 'rejected': return 'ds-badge-danger';
    default: return 'ds-badge-info';
  }
};

const placeOrder = () => {
  if (!canPlaceOrder.value) return;

  const price = orderForm.value.type === 'market'
    ? (currentPrices.value[orderForm.value.symbol] || 100)
    : orderForm.value.price;

  const order: Order = {
    id: `ORD-${Date.now()}`,
    symbol: orderForm.value.symbol,
    action: orderForm.value.action,
    type: orderForm.value.type,
    quantity: orderForm.value.quantity,
    price,
    status: 'pending',
    time: new Date().toLocaleTimeString()
  };

  orders.value = [order, ...orders.value].slice(0, 10);

  // Emit trade event
  eventBus.emit('trade:placed', {
    orderId: order.id,
    symbol: order.symbol,
    action: order.action,
    type: order.type,
    quantity: order.quantity,
    price: order.price
  });

  // Simulate order execution
  setTimeout(() => {
    const executedOrder = orders.value.find(o => o.id === order.id);
    if (executedOrder && executedOrder.status === 'pending') {
      executedOrder.status = Math.random() > 0.1 ? 'executed' : 'rejected';
      
      if (executedOrder.status === 'executed') {
        updatePositions(executedOrder);
        
        eventBus.emit('trade:executed', {
          orderId: order.id,
          symbol: order.symbol,
          action: order.action,
          quantity: order.quantity,
          price: order.price,
          total: order.quantity * order.price
        });

        notification?.addNotification({
          type: 'success',
          title: 'Order Executed',
          message: `${order.action} ${order.quantity} ${order.symbol} @ $${order.price.toFixed(2)}`
        });
      } else {
        notification?.addNotification({
          type: 'error',
          title: 'Order Rejected',
          message: `Failed to ${order.action} ${order.symbol}`
        });
      }
    }
  }, 1000 + Math.random() * 2000);
};

const updatePositions = (order: Order) => {
  if (order.action === 'buy') {
    const existingPosition = positions.value.find(p => p.symbol === order.symbol);
    if (existingPosition) {
      const totalShares = existingPosition.shares + order.quantity;
      const totalCost = (existingPosition.avgPrice * existingPosition.shares) + (order.price * order.quantity);
      existingPosition.shares = totalShares;
      existingPosition.avgPrice = totalCost / totalShares;
    } else {
      positions.value.push({
        symbol: order.symbol,
        shares: order.quantity,
        avgPrice: order.price,
        currentPrice: order.price,
        value: order.quantity * order.price,
        pnl: 0
      });
    }
    accountBalance.value -= order.quantity * order.price;
  } else {
    const position = positions.value.find(p => p.symbol === order.symbol);
    if (position) {
      position.shares -= order.quantity;
      if (position.shares <= 0) {
        positions.value = positions.value.filter(p => p.symbol !== order.symbol);
      }
      accountBalance.value += order.quantity * order.price;
    }
  }
};

const closeAllPositions = () => {
  positions.value.forEach(position => {
    const order: Order = {
      id: `ORD-${Date.now()}-${position.symbol}`,
      symbol: position.symbol,
      action: 'sell',
      type: 'market',
      quantity: position.shares,
      price: position.currentPrice,
      status: 'executed',
      time: new Date().toLocaleTimeString()
    };
    orders.value = [order, ...orders.value].slice(0, 10);
    accountBalance.value += position.value;
  });
  
  positions.value = [];
  
  eventBus.emit('trade:positions-closed', {
    count: positions.value.length,
    timestamp: Date.now()
  });
  
  notification?.addNotification({
    type: 'info',
    title: 'Positions Closed',
    message: 'All positions have been closed'
  });
};

const cancelPendingOrders = () => {
  let cancelCount = 0;
  orders.value.forEach(order => {
    if (order.status === 'pending') {
      order.status = 'cancelled';
      cancelCount++;
    }
  });
  
  if (cancelCount > 0) {
    notification?.addNotification({
      type: 'warning',
      title: 'Orders Cancelled',
      message: `${cancelCount} pending orders cancelled`
    });
  }
};

const refreshPortfolio = () => {
  // Update position values with current prices
  positions.value.forEach(position => {
    const currentPrice = currentPrices.value[position.symbol] || position.avgPrice;
    position.currentPrice = currentPrice;
    position.value = position.shares * currentPrice;
    position.pnl = ((currentPrice - position.avgPrice) / position.avgPrice) * 100;
  });
  
  eventBus.emit('trade:portfolio-refreshed', {
    positions: positions.value.length,
    totalValue: positions.value.reduce((sum, p) => sum + p.value, 0)
  });
};

let unsubscribes: Array<() => void> = [];

onMounted(() => {
  // Listen for stock selection from market watch
  const unsub1 = eventBus.on('market:stock-selected', (payload: any) => {
    // Handle both direct payload and wrapped payload formats
    const data = payload.data || payload;
    orderForm.value.symbol = data?.symbol || 'AAPL';
    if (data?.price && orderForm.value.type === 'limit') {
      orderForm.value.price = data.price;
    }
  });

  // Listen for price updates
  const unsub2 = eventBus.on('market:price-alert', (payload: any) => {
    if (payload.data?.symbol && payload.data?.price) {
      currentPrices.value[payload.data.symbol] = payload.data.price;
      refreshPortfolio();
    }
  });

  // Listen for market status changes
  const unsub3 = eventBus.on('analytics:market-status', (payload: any) => {
    marketStatus.value = payload.data?.status || 'open';
  });

  unsubscribes = [unsub1, unsub2, unsub3];

  // Simulate market hours
  const marketInterval = setInterval(() => {
    const hour = new Date().getHours();
    marketStatus.value = (hour >= 9 && hour < 16) ? 'open' : 'closed';
  }, 60000);

  return () => {
    clearInterval(marketInterval);
  };
});

onUnmounted(() => {
  unsubscribes.forEach(unsub => unsub());
});
</script>
/**
 * In-memory fallback store for users, addresses, wishlist, and orders.
 * Used when no PostgreSQL database is connected, so the entire ecommerce
 * account, login, order history, and checkout flows work instantly out-of-the-box.
 */

export interface MemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isVerified: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryAddress {
  id: number;
  userId: string;
  label: string;
  recipientName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

export interface MemoryOrderItem {
  id: number;
  orderId: string;
  productId: number | null;
  variantId?: number | null;
  nameSnapshot: string;
  skuSnapshot: string;
  optionLabelSnapshot: string | null;
  optionValueSnapshot: string | null;
  unitPricePaise: number;
  qty: number;
  lineTotalPaise: number;
}

export interface MemoryOrderEvent {
  id: number;
  orderId: string;
  status: string;
  note: string | null;
  createdAt: Date;
}

export interface MemoryOrder {
  id: string;
  orderNumber: number;
  status: string;
  email: string;
  phone: string | null;
  shippingAddress: Record<string, unknown> | null;
  couponCode: string | null;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  idempotencyKey: string | null;
  userId: string | null;
  paymentMethod: string;
  paymentId: string | null;
  razorpayOrderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
const now = Date.now();

// Global memory state so it persists across Next.js API requests in dev server
const g = globalThis as unknown as {
  __aurnyaMemory?: {
    users: MemoryUser[];
    addresses: MemoryAddress[];
    wishlist: Array<{ userId: string; productId: number; addedAt: Date }>;
    orders: MemoryOrder[];
    orderItems: MemoryOrderItem[];
    orderEvents: MemoryOrderEvent[];
    nextAddrId: number;
    nextOrderNumber: number;
    nextItemId: number;
    nextEventId: number;
  };
};

if (!g.__aurnyaMemory) {
  g.__aurnyaMemory = {
    users: [
      {
        id: DEMO_USER_ID,
        email: 'demo@aurnya.com',
        passwordHash: 'demo_pwd',
        firstName: 'Priya',
        lastName: 'Demo',
        phone: '+91 98765 43210',
        isVerified: true,
        isDemo: true,
        createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
      },
    ],
    addresses: [
      {
        id: 1,
        userId: DEMO_USER_ID,
        label: 'Home',
        recipientName: 'Priya Demo',
        line1: '42 Marine Lines',
        line2: 'Near Gateway of India',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        phone: '+91 98765 43210',
        isDefault: true,
      },
      {
        id: 2,
        userId: DEMO_USER_ID,
        label: 'Work',
        recipientName: 'Priya Demo',
        line1: 'Level 14, Tower 3, One World Center',
        line2: 'Senapati Bapat Marg, Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400013',
        country: 'India',
        phone: '+91 98765 43210',
        isDefault: false,
      },
    ],
    wishlist: [
      { userId: DEMO_USER_ID, productId: 1, addedAt: new Date(now - 5 * 24 * 60 * 60 * 1000) },
      { userId: DEMO_USER_ID, productId: 2, addedAt: new Date(now - 2 * 24 * 60 * 60 * 1000) },
    ],
    orders: [
      {
        id: 'aur-ord-demo-1001',
        orderNumber: 1001,
        status: 'delivered',
        email: 'demo@aurnya.com',
        phone: '+91 98765 43210',
        shippingAddress: {
          recipientName: 'Priya Demo',
          line1: '42 Marine Lines',
          line2: 'Near Gateway of India',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
          phone: '+91 98765 43210',
        },
        couponCode: null,
        subtotalPaise: 249900,
        discountPaise: 0,
        shippingPaise: 0,
        taxPaise: 0,
        totalPaise: 249900,
        idempotencyKey: 'demo-key-1',
        userId: DEMO_USER_ID,
        paymentMethod: 'razorpay',
        paymentId: 'pay_demo_delivered_001',
        razorpayOrderId: 'order_demo_rzp_1',
        createdAt: new Date(now - 25 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'aur-ord-demo-1002',
        orderNumber: 1002,
        status: 'shipped',
        email: 'demo@aurnya.com',
        phone: '+91 98765 43210',
        shippingAddress: {
          recipientName: 'Priya Demo',
          line1: '42 Marine Lines',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
          phone: '+91 98765 43210',
        },
        couponCode: 'AURDEMO10',
        subtotalPaise: 189800,
        discountPaise: 18980,
        shippingPaise: 0,
        taxPaise: 0,
        totalPaise: 170820,
        idempotencyKey: 'demo-key-2',
        userId: DEMO_USER_ID,
        paymentMethod: 'razorpay',
        paymentId: 'pay_demo_paid_002',
        razorpayOrderId: 'order_demo_rzp_2',
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'aur-ord-demo-1003',
        orderNumber: 1003,
        status: 'pending_payment',
        email: 'demo@aurnya.com',
        phone: '+91 98765 43210',
        shippingAddress: {
          recipientName: 'Priya Demo',
          line1: '42 Marine Lines',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
          phone: '+91 98765 43210',
        },
        couponCode: null,
        subtotalPaise: 69900,
        discountPaise: 0,
        shippingPaise: 14800,
        taxPaise: 0,
        totalPaise: 84700,
        idempotencyKey: 'demo-key-3',
        userId: DEMO_USER_ID,
        paymentMethod: 'cod',
        paymentId: null,
        razorpayOrderId: null,
        createdAt: new Date(now - 4 * 60 * 60 * 1000),
        updatedAt: new Date(now - 4 * 60 * 60 * 1000),
      },
    ],
    orderItems: [
      {
        id: 1,
        orderId: 'aur-ord-demo-1001',
        productId: 1,
        nameSnapshot: 'Floral Gold Jewellery Set',
        skuSnapshot: 'AUR-FJ-01',
        optionLabelSnapshot: null,
        optionValueSnapshot: null,
        unitPricePaise: 249900,
        qty: 1,
        lineTotalPaise: 249900,
      },
      {
        id: 2,
        orderId: 'aur-ord-demo-1002',
        productId: 2,
        nameSnapshot: 'Botanical Gold Ring',
        skuSnapshot: 'AUR-BR-02-7',
        optionLabelSnapshot: 'Size',
        optionValueSnapshot: '7',
        unitPricePaise: 89900,
        qty: 1,
        lineTotalPaise: 89900,
      },
      {
        id: 3,
        orderId: 'aur-ord-demo-1002',
        productId: 3,
        nameSnapshot: 'Lavender Pearl Earrings',
        skuSnapshot: 'AUR-PE-03',
        optionLabelSnapshot: null,
        optionValueSnapshot: null,
        unitPricePaise: 99900,
        qty: 1,
        lineTotalPaise: 99900,
      },
      {
        id: 4,
        orderId: 'aur-ord-demo-1003',
        productId: 4,
        nameSnapshot: 'Gold Jhumkas in Bloom',
        skuSnapshot: 'AUR-GJ-04',
        optionLabelSnapshot: null,
        optionValueSnapshot: null,
        unitPricePaise: 69900,
        qty: 1,
        lineTotalPaise: 69900,
      },
    ],
    orderEvents: [
      { id: 1, orderId: 'aur-ord-demo-1001', status: 'pending_payment', note: 'Order placed', createdAt: new Date(now - 25 * 24 * 60 * 60 * 1000) },
      { id: 2, orderId: 'aur-ord-demo-1001', status: 'paid', note: 'Payment verified via Razorpay', createdAt: new Date(now - 25 * 24 * 60 * 60 * 1000 + 120000) },
      { id: 3, orderId: 'aur-ord-demo-1001', status: 'packed', note: 'Packed with velvet pouch and gift box', createdAt: new Date(now - 24 * 24 * 60 * 60 * 1000) },
      { id: 4, orderId: 'aur-ord-demo-1001', status: 'shipped', note: 'Handed over to BlueDart (AWB: BD94837201)', createdAt: new Date(now - 23 * 24 * 60 * 60 * 1000) },
      { id: 5, orderId: 'aur-ord-demo-1001', status: 'delivered', note: 'Delivered to recipient', createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000) },

      { id: 6, orderId: 'aur-ord-demo-1002', status: 'pending_payment', note: 'Order placed', createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000) },
      { id: 7, orderId: 'aur-ord-demo-1002', status: 'paid', note: 'Payment verified via Razorpay', createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000 + 180000) },
      { id: 8, orderId: 'aur-ord-demo-1002', status: 'packed', note: 'Packed with care in sage green box', createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000) },
      { id: 9, orderId: 'aur-ord-demo-1002', status: 'shipped', note: 'In transit via Delhivery Express (AWB: DEL64738291)', createdAt: new Date(now - 18 * 60 * 60 * 1000) },

      { id: 10, orderId: 'aur-ord-demo-1003', status: 'pending_payment', note: 'Order placed (Cash on Delivery). Preparing for dispatch.', createdAt: new Date(now - 4 * 60 * 60 * 1000) },
    ],
    nextAddrId: 3,
    nextOrderNumber: 1004,
    nextItemId: 5,
    nextEventId: 11,
  };
}

export const memoryStore = g.__aurnyaMemory;

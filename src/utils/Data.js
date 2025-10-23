// Mock Data for Delivery App
export const mockUser = {
  _id: 'user_123',
  idUser: 123,
  nmFirst: 'John',
  nmLast: 'Doe',
  nmUserType: 'DELIVERY_MOBILE',
  nmRole: 'DELIVERY_AGENT',
  idEmail: 'john.doe@example.com',
  nbPhone: '+1234567890',
  branch: 'Main Branch',
  location: {
    latitude: 40.7128,
    longitude: -74.006,
    address: '123 Main St, New York, NY 10001',
  },
};

export const mockProducts = [
  {
    _id: 'prod_1',
    name: 'Amul Gold Full Cream Fresh Milk',
    price: 34,
    discountPrice: 38,
    quantity: '500 ml',
    image:
      'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/assets/products/sliding_images/jpeg/1c0db977-31ab-4d8e-abf3-d42e4a4b4632.jpg?ts=1706182142',
    category: 'Dairy',
  },
  {
    _id: 'prod_2',
    name: 'Gowardhan Paneer',
    price: 89,
    discountPrice: 99,
    quantity: '200 gm',
    image:
      'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=270/app/images/products/sliding_image/123007a.jpg?ts=1688973208',
    category: 'Dairy',
  },
  {
    _id: 'prod_3',
    name: 'Fresh Bananas',
    price: 45,
    discountPrice: 50,
    quantity: '1 kg',
    image:
      'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/assets/products/sliding_images/jpeg/banana.jpg',
    category: 'Fruits',
  },
  {
    _id: 'prod_4',
    name: 'Organic Tomatoes',
    price: 60,
    discountPrice: 70,
    quantity: '500 gm',
    image:
      'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/assets/products/sliding_images/jpeg/tomato.jpg',
    category: 'Vegetables',
  },
  {
    _id: 'prod_5',
    name: 'Basmati Rice',
    price: 120,
    discountPrice: 140,
    quantity: '1 kg',
    image:
      'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/assets/products/sliding_images/jpeg/rice.jpg',
    category: 'Grains',
  },
  {
    _id: 'prod_6',
    name: 'Whole Wheat Bread',
    price: 35,
    discountPrice: 40,
    quantity: '400 gm',
    image:
      'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/assets/products/sliding_images/jpeg/bread.jpg',
    category: 'Bakery',
  },
];

export const mockDeliveryOrders = [
  {
    orderId: 'ORD-2024-001',
    items: [
      {_id: 'item_1', item: mockProducts[0], count: 2},
      {_id: 'item_2', item: mockProducts[1], count: 1},
      {_id: 'item_3', item: mockProducts[2], count: 3},
    ],
    deliveryLocation: {
      address: '456 Oak Avenue, Brooklyn, NY 11201',
      coordinates: {
        latitude: 40.6782,
        longitude: -73.9442,
      },
      customerName: 'Sarah Johnson',
      phoneNumber: '+1234567891',
    },
    totalPrice: 245.5,
    createdAt: '2024-01-15T09:30:00Z',
    status: 'confirmed',
    deliveryInstructions:
      'Please ring the doorbell twice. Leave at door if no answer.',
    estimatedDeliveryTime: '30-45 minutes',
  },
  {
    orderId: 'ORD-2024-002',
    items: [
      {_id: 'item_4', item: mockProducts[3], count: 2},
      {_id: 'item_5', item: mockProducts[4], count: 1},
      {_id: 'item_6', item: mockProducts[5], count: 2},
    ],
    deliveryLocation: {
      address: '789 Pine Street, Queens, NY 11375',
      coordinates: {
        latitude: 40.7282,
        longitude: -73.7949,
      },
      customerName: 'Mike Chen',
      phoneNumber: '+1234567892',
    },
    totalPrice: 350.75,
    createdAt: '2024-01-15T10:15:00Z',
    status: 'confirmed',
    deliveryInstructions: 'Call when you arrive. Customer will come down.',
    estimatedDeliveryTime: '25-35 minutes',
  },
  {
    orderId: 'ORD-2024-003',
    items: [
      {_id: 'item_7', item: mockProducts[0], count: 1},
      {_id: 'item_8', item: mockProducts[2], count: 2},
    ],
    deliveryLocation: {
      address: '321 Elm Street, Manhattan, NY 10002',
      coordinates: {
        latitude: 40.7614,
        longitude: -73.9776,
      },
      customerName: 'Emily Davis',
      phoneNumber: '+1234567893',
    },
    totalPrice: 124.0,
    createdAt: '2024-01-15T11:00:00Z',
    status: 'confirmed',
    deliveryInstructions: 'Building has a doorman. Ask for apartment 5B.',
    estimatedDeliveryTime: '20-30 minutes',
  },
  {
    orderId: 'ORD-2024-004',
    items: [
      {_id: 'item_9', item: mockProducts[1], count: 2},
      {_id: 'item_10', item: mockProducts[3], count: 1},
      {_id: 'item_11', item: mockProducts[5], count: 3},
    ],
    deliveryLocation: {
      address: '654 Maple Drive, Bronx, NY 10451',
      coordinates: {
        latitude: 40.8448,
        longitude: -73.8648,
      },
      customerName: 'Robert Wilson',
      phoneNumber: '+1234567894',
    },
    totalPrice: 298.25,
    createdAt: '2024-01-14T16:45:00Z',
    status: 'delivered',
    deliveryInstructions: 'Left at door as requested.',
    estimatedDeliveryTime: '35-45 minutes',
    deliveredAt: '2024-01-14T17:20:00Z',
  },
  {
    orderId: 'ORD-2024-005',
    items: [
      {_id: 'item_12', item: mockProducts[4], count: 2},
      {_id: 'item_13', item: mockProducts[0], count: 3},
    ],
    deliveryLocation: {
      address: '987 Cedar Lane, Staten Island, NY 10301',
      coordinates: {
        latitude: 40.6415,
        longitude: -74.0776,
      },
      customerName: 'Lisa Anderson',
      phoneNumber: '+1234567895',
    },
    totalPrice: 408.0,
    createdAt: '2024-01-14T14:20:00Z',
    status: 'delivered',
    deliveryInstructions: 'Delivered to customer directly.',
    estimatedDeliveryTime: '40-50 minutes',
    deliveredAt: '2024-01-14T15:05:00Z',
  },
  {
    orderId: 'ORD-2024-006',
    items: [
      {_id: 'item_14', item: mockProducts[2], count: 4},
      {_id: 'item_15', item: mockProducts[3], count: 2},
      {_id: 'item_16', item: mockProducts[5], count: 1},
    ],
    deliveryLocation: {
      address: '147 Birch Street, Brooklyn, NY 11215',
      coordinates: {
        latitude: 40.6501,
        longitude: -73.9496,
      },
      customerName: 'David Martinez',
      phoneNumber: '+1234567896',
    },
    totalPrice: 275.5,
    createdAt: '2024-01-14T12:30:00Z',
    status: 'delivered',
    deliveryInstructions: 'Customer was home and received order.',
    estimatedDeliveryTime: '30-40 minutes',
    deliveredAt: '2024-01-14T13:10:00Z',
  },
];

export const mockAvailableOrders = mockDeliveryOrders.filter(
  order => order.status === 'confirmed',
);
export const mockDeliveredOrders = mockDeliveryOrders.filter(
  order => order.status === 'delivered',
);

export const mockDeliveryStats = {
  totalOrders: mockDeliveryOrders.length,
  availableOrders: mockAvailableOrders.length,
  deliveredOrders: mockDeliveredOrders.length,
  totalEarnings: mockDeliveredOrders.reduce(
    (sum, order) => sum + order.totalPrice,
    0,
  ),
  averageDeliveryTime: 35, // minutes
  rating: 4.8,
  completedDeliveries: mockDeliveredOrders.length,
};

export const mockNotifications = [
  {
    id: 'notif_1',
    title: 'New Order Available',
    message: 'Order ORD-2024-001 is ready for pickup',
    timestamp: '2024-01-15T09:30:00Z',
    type: 'order',
    read: false,
  },
  {
    id: 'notif_2',
    title: 'Order Delivered',
    message: 'Order ORD-2024-004 has been successfully delivered',
    timestamp: '2024-01-14T17:20:00Z',
    type: 'delivery',
    read: true,
  },
  {
    id: 'notif_3',
    title: 'Payment Received',
    message: 'Payment of $298.25 received for Order ORD-2024-004',
    timestamp: '2024-01-14T17:25:00Z',
    type: 'payment',
    read: true,
  },
];

export const mockDeliveryRoutes = [
  {
    id: 'route_1',
    name: 'Brooklyn Route',
    orders: ['ORD-2024-001', 'ORD-2024-003'],
    totalDistance: 12.5, // km
    estimatedTime: 45, // minutes
    status: 'active',
  },
  {
    id: 'route_2',
    name: 'Queens Route',
    orders: ['ORD-2024-002'],
    totalDistance: 8.2, // km
    estimatedTime: 30, // minutes
    status: 'completed',
  },
];

// Helper function to get orders by status
export const getOrdersByStatus = status => {
  return mockDeliveryOrders.filter(order => order.status === status);
};

// Helper function to get order by ID
export const getOrderById = orderId => {
  return mockDeliveryOrders.find(order => order.orderId === orderId);
};

// Helper function to get user profile
export const getUserProfile = () => {
  return mockUser;
};

// Helper function to get delivery statistics
export const getDeliveryStats = () => {
  return mockDeliveryStats;
};

import {Client, IMessage, StompConfig} from '@stomp/stompjs';
import {tokenManager} from '@utils/tokenManager';

// CRITICAL: Polyfill for React Native
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = WebSocket;
}

// Base URLs
const BASE_URL = 'http://206.189.137.107:8080';
const WS_ENDPOINT = '/ws'; // SockJS endpoint

// STOMP client instance
let stompClient: Client | null = null;

// Connection state flags
let isConnecting = false;
let isConnected = false;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

// Listener arrays
const statusListeners: Array<(connected: boolean) => void> = [];
const topicSubscriptions: Record<string, any> = {};
const pendingSubscriptions: Array<{
  topic: string;
  callback: (data: any) => void;
}> = [];

// 🔹 Helper: Notify all listeners about connection changes
function notifyConnectionStatus(connected: boolean) {
  isConnected = connected;
  statusListeners.forEach(cb => cb(connected));
}

// 🔹 Generate random session ID for SockJS (mimics browser behavior)
function generateSessionId(): string {
  return Math.floor(Math.random() * 1000).toString();
}

// 🔹 Generate random server ID for SockJS
function generateServerId(): string {
  return Math.floor(Math.random() * 1000).toString();
}

// 🔹 Create SockJS-compatible WebSocket URL
function createSockJSUrl(): string {
  const serverId = generateServerId();
  const sessionId = generateSessionId();

  // SockJS URL format: /ws/{server-id}/{session-id}/websocket
  const sockJSPath = `${WS_ENDPOINT}/${serverId}/${sessionId}/websocket`;
  const wsUrl =
    BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://') +
    sockJSPath;

  console.log('📍 SockJS URL:', wsUrl);
  return wsUrl;
}

// 🔹 Create WebSocket factory that mimics SockJS behavior
function createWebSocketFactory() {
  return () => {
    const jwtToken = tokenManager.getAccessToken();
    const wsUrl = createSockJSUrl();

    console.log('🔑 Creating SockJS-compatible WebSocket...');
    console.log('📍 URL:', wsUrl);
    console.log('🎫 Token:', jwtToken ? 'Present' : 'Missing');

    // Create WebSocket with SockJS URL and optional auth headers
    const ws = new WebSocket(wsUrl, [], {
      headers: jwtToken
        ? {
            Authorization: `Bearer ${jwtToken}`,
          }
        : {},
    });

    return ws;
  };
}

// 🔹 Connect WebSocket
export function connectSocket() {
  if (isConnected || isConnecting) {
    console.log('⚙️ WebSocket already connecting/connected');
    return;
  }

  console.log('🔌 Connecting to SockJS WebSocket...');
  isConnecting = true;

  const config: StompConfig = {
    // Use webSocketFactory for React Native with SockJS
    webSocketFactory: createWebSocketFactory(),

    // Disable automatic reconnection (we handle it manually)
    reconnectDelay: 0,

    // Heartbeat configuration (must match backend)
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    // Debug logging
    debug: (str: string) => {
      console.log('STOMP:', str);
    },

    // Connection successful
    onConnect: frame => {
      console.log('✅ Connected to WebSocket');
      console.log('📋 Connection frame:', frame);
      isConnecting = false;
      notifyConnectionStatus(true);

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      // Subscribe to all pending subscriptions
      console.log(
        `📦 Processing ${pendingSubscriptions.length} pending subscriptions`,
      );
      while (pendingSubscriptions.length > 0) {
        const {topic, callback} = pendingSubscriptions.shift()!;
        subscribeToTopicImmediate(topic, callback);
      }
    },

    // Disconnection handler
    onDisconnect: frame => {
      console.log('❌ Disconnected from WebSocket');
      console.log('📋 Disconnect frame:', frame);
      isConnecting = false;
      notifyConnectionStatus(false);

      // Clear existing subscriptions
      Object.keys(topicSubscriptions).forEach(topic => {
        try {
          topicSubscriptions[topic].unsubscribe();
        } catch (e) {
          console.error('Error unsubscribing:', e);
        }
        delete topicSubscriptions[topic];
      });

      attemptReconnect();
    },

    // WebSocket error handler
    onWebSocketError: event => {
      console.error('⚠️ WebSocket Error:', event);
      console.error('⚠️ Error type:', event.type);
      isConnecting = false;
      notifyConnectionStatus(false);
      attemptReconnect();
    },

    // STOMP error handler
    onStompError: frame => {
      console.error('❌ STOMP Error:', frame.headers['message']);
      console.error('❌ Full frame:', frame);
      isConnecting = false;
      notifyConnectionStatus(false);
      attemptReconnect();
    },

    // Connection timeout
    connectionTimeout: 10000,
  };

  stompClient = new Client(config);

  // Additional error handling
  try {
    stompClient.activate();
  } catch (error) {
    console.error('❌ Failed to activate STOMP client:', error);
    isConnecting = false;
    notifyConnectionStatus(false);
    attemptReconnect();
  }
}

// 🔁 Attempt reconnection after 5s
function attemptReconnect() {
  if (reconnectTimeout) {
    console.log('⏳ Reconnect already scheduled');
    return;
  }

  console.log('♻️ Scheduling reconnection in 5 seconds...');
  reconnectTimeout = setTimeout(() => {
    console.log('♻️ Attempting reconnection now...');
    reconnectTimeout = null;
    connectSocket();
  }, 5000);
}

// 🔹 Disconnect WebSocket
export function disconnectSocket() {
  console.log('🔌 Disconnecting WebSocket...');

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (stompClient) {
    try {
      stompClient.deactivate();
    } catch (error) {
      console.error('Error deactivating client:', error);
    }
    stompClient = null;
  }

  isConnecting = false;
  notifyConnectionStatus(false);

  // Clear all subscriptions
  Object.keys(topicSubscriptions).forEach(topic => {
    delete topicSubscriptions[topic];
  });
  pendingSubscriptions.length = 0;
}

// 🔹 Internal function to subscribe immediately (assumes connected)
function subscribeToTopicImmediate(
  topic: string,
  callback: (data: any) => void,
) {
  if (!stompClient || !isConnected) {
    console.error('❌ Cannot subscribe: not connected');
    return;
  }

  // Prevent duplicate subscriptions
  if (topicSubscriptions[topic]) {
    console.log(`ℹ️ Already subscribed to topic: ${topic}`);
    return;
  }

  console.log(`📡 Subscribing to topic: ${topic}`);

  try {
    const subscription = stompClient.subscribe(topic, (message: IMessage) => {
      try {
        const data = JSON.parse(message.body);
        console.log(`📨 Received message on ${topic}:`, data);
        callback(data);
      } catch (error) {
        console.error('❌ Error parsing socket message:', error);
        console.error('❌ Raw message:', message.body);
      }
    });

    topicSubscriptions[topic] = subscription;
    console.log(`✅ Successfully subscribed to: ${topic}`);
  } catch (error) {
    console.error(`❌ Failed to subscribe to ${topic}:`, error);
  }
}

// 🔹 Subscribe to a topic
export function subscribeToTopic(topic: string, callback: (data: any) => void) {
  console.log(`📢 Request to subscribe to: ${topic}`);

  // If already subscribed, skip
  if (topicSubscriptions[topic]) {
    console.log(`ℹ️ Already subscribed to topic: ${topic}`);
    return;
  }

  // If connected, subscribe immediately
  if (stompClient && isConnected) {
    subscribeToTopicImmediate(topic, callback);
    return;
  }

  // If not connected, check if already in pending list
  const alreadyPending = pendingSubscriptions.some(sub => sub.topic === topic);
  if (alreadyPending) {
    console.log(`ℹ️ Subscription to ${topic} already pending`);
    return;
  }

  // Add to pending subscriptions
  console.log(`⏳ Queueing subscription to topic: ${topic}`);
  pendingSubscriptions.push({topic, callback});

  // Initiate connection if not already connecting/connected
  if (!isConnecting && !isConnected) {
    console.log('🔌 Initiating connection for pending subscription');
    connectSocket();
  }
}

// 🔹 Unsubscribe from a topic
export function unsubscribeTopic(topic: string) {
  if (topicSubscriptions[topic]) {
    try {
      topicSubscriptions[topic].unsubscribe();
      delete topicSubscriptions[topic];
      console.log(`🚪 Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`❌ Error unsubscribing from ${topic}:`, error);
    }
  } else {
    console.log(`ℹ️ Not subscribed to topic: ${topic}`);
  }
}

// 🔹 Send message (publish)
export function sendMessage(destination: string, payload: any) {
  if (!stompClient || !isConnected) {
    console.warn('⚠️ Cannot send, not connected');
    return;
  }

  try {
    stompClient.publish({
      destination,
      body: JSON.stringify(payload),
    });
    console.log('📤 Sent message:', destination, payload);
  } catch (error) {
    console.error('❌ Error sending message:', error);
  }
}

// 🔹 Listen to connection status
export function onSocketStatusChange(callback: (connected: boolean) => void) {
  statusListeners.push(callback);
  callback(isConnected); // return initial state

  return () => {
    const index = statusListeners.indexOf(callback);
    if (index > -1) statusListeners.splice(index, 1);
  };
}

// 🔹 Get current connection status
export function isSocketConnected(): boolean {
  return isConnected;
}

// 🔹 Force reconnect
export function forceReconnect() {
  console.log('🔄 Forcing reconnection...');
  disconnectSocket();
  setTimeout(() => connectSocket(), 1000);
}

export const BASE_URL = 'http://206.189.137.107:8080/api/';

export const SOCKET_URL = 'http://206.189.137.107:9092';
export const GOOGLE_MAP_API = 'AIzaSyAjhAUSBUszFtkWC_gLPGhVz15A_HeQO5Q';
// Separate key for Google Geocoding REST API (should not be bundle-restricted)
export const GOOGLE_GEOCODING_API = 'AIzaSyAjhAUSBUszFtkWC_gLPGhVz15A_HeQO5Q';
export const BRANCH_ID = '6892279bde8f2be931f5b480';
export const USER_TYPE = 'AGENT';

// PhonePe configuration
// NOTE: Replace placeholders with your production credentials when available
export const PHONEPE_ENVIRONMENT = 'SANDBOX'; // or 'PRODUCTION'
export const PHONEPE_MERCHANT_ID = 'PGTESTPAYUAT86';
export const SALT_KEY = '96434309-7796-489d-8924-ab56988a6076';
export const SALT_INDEX = '1';
export const PHONEPE_FLOW_ID = 'GOLISODA_FLOW';
// iOS callback scheme must also be registered in Info.plist (without ://)
export const PHONEPE_IOS_CALLBACK_SCHEME = 'golisodaapp';

// User Types
export const USER_TYPES = {
  CUSTOMER_MOBILE: 'CUSTOMER_MOBILE',
  DELIVERY_PARTNER: 'AGENT',
} as const;

export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];

// USE YOUR NETWORK IP OR HOSTED URL
// export const BASE_URL = 'http://172.20.10.4:3000/api'
// export const SOCKET_URL = 'http://172.20.10.4:3000'

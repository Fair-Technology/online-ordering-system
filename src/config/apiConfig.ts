// API Configuration for backend calls

export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071';
};

export const API_ENDPOINTS = {
  SAVE_USER: '/api/users',
  // Add more endpoints as needed
} as const;

export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Helper function for user API
export const getUserApiUrl = (): string => {
  return buildApiUrl(API_ENDPOINTS.SAVE_USER);
};

// Debug logging for development
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log(`🌐 Base URL: ${getApiBaseUrl()}`);
  console.log(`👤 User API: ${getUserApiUrl()}`);
}

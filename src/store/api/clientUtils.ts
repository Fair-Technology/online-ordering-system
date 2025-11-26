import * as backendClient from './backend-generated/apiClient';

// Simple re-export so the rest of the app can call client.method(...)
export const client = backendClient;

export type BackendClient = typeof backendClient;

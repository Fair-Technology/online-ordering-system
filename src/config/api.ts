import { ApiClient } from '../store/api/apiClient';

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7071/api';

const normalizeBaseUrl = (value: string) => {
  if (!value) return 'http://localhost:7071/api';
  const trimmed = value.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const api = new ApiClient(normalizeBaseUrl(rawBaseUrl));

export type ApiShape = ApiClient;

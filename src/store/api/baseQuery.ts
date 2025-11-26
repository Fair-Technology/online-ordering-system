import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:7071/api';

const normalizeBaseUrl = (value: string) => {
  if (!value) return 'http://localhost:7071/api';
  const trimmed = value.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const baseUrl = normalizeBaseUrl(rawBaseUrl);

export const authorizedBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as { auth?: { accessToken?: string } };
    const token = state?.auth?.accessToken;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  },
});

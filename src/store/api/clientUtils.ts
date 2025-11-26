import { ApiClient } from './backend-generated/apiClient';
import { apiBaseUrl } from '../../config/api';
import type { RootState } from '..';

export type CustomQueryError = {
  status: 'CUSTOM_ERROR';
  error: string;
};

export const createAuthorizedClient = (state: RootState) => {
  const token = state.auth.accessToken;
  return new ApiClient(apiBaseUrl, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });
};

export const callApi = async <T>(
  getState: () => unknown,
  fn: (client: ApiClient) => Promise<T>
): Promise<{ data: T } | { error: CustomQueryError }> => {
  try {
    const client = createAuthorizedClient(
      getState() as RootState
    );
    const data = await fn(client);
    return { data };
  } catch (error) {
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
};

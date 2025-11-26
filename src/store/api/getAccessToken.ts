import type { RootState, AppDispatch } from '..';

export const getAccessToken = async (
  state: RootState,
  _dispatch: AppDispatch
): Promise<string | null> => {
  return state.auth.accessToken;
};

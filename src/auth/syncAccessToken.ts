import type {
  IPublicClientApplication,
  AccountInfo,
} from '@azure/msal-browser';
import { AppDispatch } from '../store';
import { setAccessToken } from '../store/slices/authSlice';
import { apiScopes } from '../config/authConfig';

export async function syncAccessTokenFromMsal(
  instance: IPublicClientApplication,
  dispatch: AppDispatch
): Promise<void> {
  let account: AccountInfo | null = instance.getActiveAccount() ?? null;

  if (!account) {
    const allAccounts = instance.getAllAccounts();
    if (allAccounts.length > 0) {
      account = allAccounts[0];
    }
  }

  if (!account) {
    // Not logged in yet – nothing to sync
    dispatch(setAccessToken(null));
    return;
  }

  const result = await instance.acquireTokenSilent({
    account,
    scopes: apiScopes,
  });

  dispatch(setAccessToken(result.accessToken));
}

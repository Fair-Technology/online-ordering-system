const clientId = import.meta.env.VITE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_TENANT_ID || '';
const redirectUri = import.meta.env.VITE_REDIRECT_URI || '';

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://fairaustraliaextusers.ciamlogin.com/${tenantId}`,
    redirectUri,
  },
};

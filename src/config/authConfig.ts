const clientId = import.meta.env.VITE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_TENANT_ID || '';
const redirectUri = 'http://localhost:5173';

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://fairaustraliaextusers.ciamlogin.com/${tenantId}`,
    redirectUri,
  },
};

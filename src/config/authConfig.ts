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

export const loginRequest = {
  scopes: ['api://5940f49f-d6ec-4865-b38e-379de583765c/users.read'],
};

export const apiScopes = [
  'api://5940f49f-d6ec-4865-b38e-379de583765c/users.read',
];

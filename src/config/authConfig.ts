const clientId = import.meta.env.VITE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_TENANT_ID || '';
const redirectUri = 'http://localhost:5173';

// Debug logging for development
if (import.meta.env.DEV) {
  console.log('🔧 MSAL Configuration Debug:');
  console.log('Client ID:', clientId ? '✅ Set' : '❌ Missing');
  console.log('Tenant ID:', tenantId ? '✅ Set' : '❌ Missing');
  console.log('Redirect URI:', redirectUri);
  console.log('Authority:', `https://fairaustraliaextusers.ciamlogin.com/${tenantId}`);
}

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://fairaustraliaextusers.ciamlogin.com/${tenantId}`,
    redirectUri,
  },
};

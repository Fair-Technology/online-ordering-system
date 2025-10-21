# Frontend-Backend Integration Guide

## Overview
This guide explains how the frontend integrates with your backend API to save user data when users authenticate through Microsoft Entra.

## 🔧 **How It Works**

### **Authentication Flow**
1. User clicks **"Admin Login"** in footer
2. Redirected to Microsoft Entra login screen
3. User completes authentication (login or register)
4. Microsoft redirects back to frontend (`http://localhost:5173`)
5. Frontend automatically extracts user data from Entra account
6. Frontend calls your backend API (`http://localhost:7071/api/users`)
7. Backend saves user data to Cosmos DB
8. Footer shows success/error status

### **User Data Format**
The frontend sends this data to your backend:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "id": "microsoft-user-id"
}
```

## 🚀 **Setup Instructions**

### **1. Environment Configuration**
Your `.env` file should have:
```bash
# Microsoft Entra Configuration
VITE_CLIENT_ID=5940f49f-d6ec-4865-b38e-379de583765c
VITE_TENANT_ID=d220f4ca-2ba2-436a-a437-5779ae23584d

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:7071
```

### **2. Backend Requirements**
Make sure your backend:
- Is running on `http://localhost:7071`
- Has endpoint `/api/users` that accepts POST requests
- Accepts JSON data in the format shown above
- Has CORS configured to allow requests from `http://localhost:5173`

### **3. Start Your Services**
```bash
# Terminal 1: Start your backend
# (Your backend startup command)

# Terminal 2: Start frontend
npm run dev
```

## 🧪 **Testing the Integration**

### **1. Test User Registration (New User)**
1. Go to `http://localhost:5173`
2. Click **"Admin Login"** in footer
3. On Microsoft Entra screen, click **"Create account"** or **"Sign up"**
4. Complete registration with Microsoft
5. Should redirect back to `/owner` page
6. Check footer for success message: **"User saved successfully!"**
7. Check your backend logs to confirm user was saved

### **2. Test User Login (Existing User)**
1. Go to `http://localhost:5173`
2. Click **"Admin Login"** in footer
3. Enter existing Microsoft credentials
4. Should redirect back to `/owner` page
5. Check footer for success message
6. Check backend logs to confirm user data was updated

### **3. Visual Feedback**

**Not Logged In:**
```
[Home] [About] [Contact] [Privacy] [Terms] [Admin Login]
```

**Logged In:**
```
[Home] [About] [Contact] [Privacy] [Terms] Welcome, John [Logout] [User saved successfully!]
```

## 🔍 **Debugging**

### **Browser Console Logs**
When authentication happens, you should see:
```
🔧 API Configuration:
🌐 Base URL: http://localhost:7071
👤 User API: http://localhost:7071/api/users

Calling API endpoint: http://localhost:7071/api/users
Sending user data: {email: "...", name: "...", firstName: "...", lastName: "...", id: "..."}
User saved successfully: [response from backend]
```

### **Network Tab**
1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Complete login flow
4. Look for POST request to `http://localhost:7071/api/users`
5. Check request payload and response

### **Common Issues**

**Issue: CORS Error**
```
Access to fetch at 'http://localhost:7071/api/users' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solution**: Configure CORS in your backend to allow `http://localhost:5173`

**Issue: 404 Not Found**
```
POST http://localhost:7071/api/users 404 (Not Found)
```
**Solution**: Verify your backend endpoint is `/api/users` and backend is running

**Issue: Connection Refused**
```
Failed to fetch
```
**Solution**: Make sure your backend is running on port 7071

## 🔧 **Configuration Options**

### **Switch to Remote Backend**
To test with your remote backend, update `.env`:
```bash
VITE_API_BASE_URL=https://online-ordering-system-dev-ahatfvfqghebdnez.australiaeast-01.azurewebsites.net
```

### **Custom API Endpoint**
If your backend uses a different endpoint, update `src/config/apiConfig.ts`:
```typescript
export const API_ENDPOINTS = {
  SAVE_USER: '/api/your-custom-endpoint',
} as const;
```

## 📊 **Code Structure**

### **Key Files**
- `src/components/footer.tsx` - Main authentication and API integration
- `src/config/apiConfig.ts` - API configuration and URL building
- `src/config/authConfig.ts` - Microsoft Entra configuration
- `.env` - Environment variables

### **Key Functions**
- `extractUserData()` - Extracts user info from Microsoft Entra account
- `saveUserToBackend()` - Calls your backend API to save user data
- `useEffect()` - Automatically triggers when user logs in

## 🎯 **Next Steps**

1. **Test the complete flow** with both new and existing users
2. **Verify data in Cosmos DB** through your backend
3. **Add error handling** for specific backend error responses
4. **Consider adding loading states** for better UX
5. **Test with remote backend** when ready for production

The integration is now complete and ready for testing!

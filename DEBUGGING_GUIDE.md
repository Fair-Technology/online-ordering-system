# Debugging Guide - User Authentication & API Integration

## 🚨 **The Issue**
Users weren't being saved to Cosmos DB because the Footer component (which handles the API call) wasn't rendered on the `/owner` dashboard page after authentication.

## ✅ **The Fix**
I've added an `AuthHandler` component to the owner dashboard that detects authentication and calls your backend API.

## 🔧 **How to Debug**

### **1. Check Browser Console**
Open DevTools (F12) and look for these logs:

**When app starts:**
```
🔧 MSAL Configuration Debug:
Client ID: ✅ Set
Tenant ID: ✅ Set
Redirect URI: http://localhost:5173
Authority: https://fairaustraliaextusers.ciamlogin.com/...

🔧 API Configuration:
🌐 Base URL: http://localhost:7071
👤 User API: http://localhost:7071/api/users
```

**When you click "Admin Login":**
```
Footer useEffect triggered, accounts: []
No accounts found in footer
```

**After authentication (on /owner page):**
```
🔍 AuthHandler: useEffect triggered, accounts: 1
👤 AuthHandler: Processing user authentication...
📋 AuthHandler: Formatted API data: {email: "...", name: "...", ...}
🔄 AuthHandler: Starting user save process...
🌐 AuthHandler: Calling API endpoint: http://localhost:7071/api/users
📤 AuthHandler: Sending user data: {...}
✅ AuthHandler: User saved successfully: [response]
```

### **2. Check Network Tab**
1. Open DevTools → **Network** tab
2. Complete the login flow
3. Look for a **POST** request to `http://localhost:7071/api/users`
4. Check the request payload and response

### **3. Test Steps**

**Step 1: Start Services**
```bash
# Terminal 1: Start your backend (make sure it's on port 7071)
# Your backend startup command

# Terminal 2: Start frontend
npm run dev
```

**Step 2: Test Authentication**
1. Go to `http://localhost:5173`
2. Open DevTools Console
3. Click **"Admin Login"** in footer
4. Complete Microsoft Entra authentication
5. Should redirect to `/owner` page
6. Check console for AuthHandler logs
7. Check Network tab for API call

### **4. Expected Behavior**

**✅ Success Flow:**
1. Click "Admin Login" → Redirect to Microsoft Entra
2. Complete authentication → Redirect to `/owner`
3. AuthHandler detects user → Calls API
4. API saves user to Cosmos DB → Success response
5. Console shows success logs

**❌ Common Issues:**

**Issue 1: No API call in Network tab**
- Check console for AuthHandler logs
- Verify accounts are being detected
- Check if backend is running on port 7071

**Issue 2: CORS Error**
```
Access to fetch at 'http://localhost:7071/api/users' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solution:** Configure CORS in your backend to allow `http://localhost:5173`

**Issue 3: 404 Error**
```
POST http://localhost:7071/api/users 404 (Not Found)
```
**Solution:** Verify your backend has the `/api/users` endpoint

**Issue 4: Connection Refused**
```
Failed to fetch
```
**Solution:** Make sure your backend is running on port 7071

## 🧪 **Manual Testing**

### **Test Your Backend API Directly**
```bash
curl -X POST http://localhost:7071/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "firstName": "Test",
    "lastName": "User",
    "id": "test-id"
  }'
```

Expected response: Success message or user data

### **Test Frontend Without Authentication**
Add this temporary code to test API connectivity:

```javascript
// Add to browser console on http://localhost:5173
fetch('http://localhost:7071/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    id: 'test-id'
  })
})
.then(r => r.json())
.then(d => console.log('API Test Result:', d))
.catch(e => console.error('API Test Error:', e));
```

## 🔍 **Debugging Checklist**

### **Environment Setup**
- [ ] Backend running on `http://localhost:7071`
- [ ] Frontend running on `http://localhost:5173`
- [ ] `.env` file has correct `VITE_API_BASE_URL=http://localhost:7071`
- [ ] Backend has `/api/users` endpoint
- [ ] Backend has CORS configured for `http://localhost:5173`

### **Authentication Flow**
- [ ] Microsoft Entra credentials are correct in `.env`
- [ ] Redirect URI `http://localhost:5173` is configured in Azure
- [ ] User can complete authentication
- [ ] User is redirected to `/owner` page
- [ ] AuthHandler component is loaded on `/owner` page

### **API Integration**
- [ ] Console shows AuthHandler logs
- [ ] Network tab shows POST request to `/api/users`
- [ ] Request payload contains user data
- [ ] Backend responds with success
- [ ] User data appears in Cosmos DB

## 🎯 **Next Steps**

1. **Follow the test steps above**
2. **Check console logs** for any errors
3. **Verify API call** in Network tab
4. **Test backend directly** if needed
5. **Check Cosmos DB** for saved user data

If you're still having issues, share the console logs and I can help debug further!

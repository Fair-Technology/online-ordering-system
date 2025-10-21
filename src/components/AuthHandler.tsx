import { useEffect, useState, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { getUserApiUrl } from '../config/apiConfig';

const AuthHandler = () => {
  const { accounts } = useMsal();
  const [hasProcessedUser, setHasProcessedUser] = useState(false);
  const processedUserIds = useRef(new Set<string>());

  // Extract user data from Microsoft Entra account
  const extractUserData = (account: any) => {
    const email = account.username || '';

    // Get data from ID token claims (where Entra stores the actual registration fields)
    const idTokenClaims = account.idTokenClaims || {};

    console.log('🔍 AuthHandler: Full ID Token Claims:', JSON.stringify(idTokenClaims, null, 2));
    console.log('🔍 AuthHandler: Account object:', JSON.stringify(account, null, 2));

    // Try multiple possible field names for first and last name
    const firstName = idTokenClaims.given_name ||
                     idTokenClaims.firstName ||
                     idTokenClaims['given-name'] ||
                     idTokenClaims.givenName ||
                     '';

    const lastName = idTokenClaims.family_name ||
                    idTokenClaims.lastName ||
                    idTokenClaims['family-name'] ||
                    idTokenClaims.familyName ||
                    idTokenClaims.surname ||
                    '';

    const displayName = idTokenClaims.name ||
                       idTokenClaims.displayName ||
                       idTokenClaims.display_name ||
                       account.name ||
                       account.displayName ||
                       '';

    console.log('🔍 AuthHandler: Extracted fields:', {
      'All available claims': Object.keys(idTokenClaims),
      'firstName': firstName,
      'lastName': lastName,
      'displayName': displayName,
      'email': email
    });

    // If we still don't have first/last name, try to parse from display name as fallback
    let finalFirstName = firstName;
    let finalLastName = lastName;

    if ((!firstName || !lastName) && displayName && displayName.trim()) {
      console.log('🔄 AuthHandler: Attempting to parse names from displayName:', displayName);
      const nameParts = displayName.trim().split(' ');
      if (nameParts.length >= 2) {
        finalFirstName = finalFirstName || nameParts[0];
        finalLastName = finalLastName || nameParts.slice(1).join(' ');
        console.log('🔄 AuthHandler: Parsed from displayName - firstName:', finalFirstName, 'lastName:', finalLastName);
      }
    }

    const result = {
      id: account.localAccountId || account.homeAccountId || '',
      email: email,
      displayName: displayName,
      firstName: finalFirstName,
      lastName: finalLastName,
      username: account.username || ''
    };

    console.log('📋 AuthHandler: Final extracted data:', result);
    return result;
  };

  // Save user data to backend API
  const saveUserToBackend = async (userData: any) => {
    try {
      console.log('🔄 AuthHandler: Starting user save process...');
      
      const apiUrl = getUserApiUrl();
      
      console.log('🌐 AuthHandler: Calling API endpoint:', apiUrl);
      console.log('📤 AuthHandler: Sending user data:', userData);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ AuthHandler: User saved successfully:', result);
      } else {
        const errorText = await response.text();
        console.error('❌ AuthHandler: Failed to save user');
        console.error('Status:', response.status);
        console.error('Status Text:', response.statusText);
        console.error('Response:', errorText);
        console.error('Request URL:', apiUrl);
        console.error('Request Data:', JSON.stringify(userData, null, 2));

        // Try to parse error response if it's JSON
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed Error:', errorJson);
        } catch (e) {
          console.error('Error response is not JSON');
        }
      }
    } catch (error) {
      console.error('💥 AuthHandler: Error saving user:', error);
    }
  };

  // Check for authenticated user and save data (only once per user)
  useEffect(() => {
    console.log('🔍 AuthHandler: useEffect triggered, accounts:', accounts.length);

    if (accounts.length > 0) {
      const currentUser = accounts[0];
      const userId = currentUser.localAccountId || currentUser.homeAccountId || currentUser.username;

      // Check if we've already processed this user
      if (!processedUserIds.current.has(userId)) {
        console.log('👤 AuthHandler: Processing new user authentication...', userId);
        console.log('📋 AuthHandler: Full account object:', currentUser);
        console.log('📋 AuthHandler: Raw account data:', {
          name: currentUser.name,
          username: currentUser.username,
          localAccountId: currentUser.localAccountId,
          homeAccountId: currentUser.homeAccountId,
          idTokenClaims: currentUser.idTokenClaims
        });

        const userData = extractUserData(currentUser);
        console.log('📋 AuthHandler: Extracted user data:', userData);

        // Validate required fields before sending (based on backend validation)
        if (!userData.email) {
          console.error('❌ AuthHandler: Missing email - cannot proceed');
          return;
        }

        // Check for missing names and try to fix them
        if (!userData.firstName || !userData.lastName || !userData.displayName) {
          console.error('❌ AuthHandler: Missing required name fields:');
          console.error('firstName:', userData.firstName || 'EMPTY');
          console.error('lastName:', userData.lastName || 'EMPTY');
          console.error('displayName:', userData.displayName || 'EMPTY');
          console.error('Available ID token claims:', Object.keys(currentUser.idTokenClaims || {}));
          console.error('Full ID token claims:', currentUser.idTokenClaims);

          // Try to use email as fallback for names
          const emailPrefix = userData.email.split('@')[0];
          const fallbackFirstName = userData.firstName || emailPrefix || 'User';
          const fallbackLastName = userData.lastName || 'User';
          const fallbackDisplayName = userData.displayName || `${fallbackFirstName} ${fallbackLastName}`;

          console.warn('🔄 AuthHandler: Using fallback names:');
          console.warn('fallbackFirstName:', fallbackFirstName);
          console.warn('fallbackLastName:', fallbackLastName);
          console.warn('fallbackDisplayName:', fallbackDisplayName);

          // Update the userData with fallbacks
          userData.firstName = fallbackFirstName;
          userData.lastName = fallbackLastName;
          userData.displayName = fallbackDisplayName;
        }

        // Format data to match backend API expectations
        const apiData = {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          displayName: userData.displayName
        };

        console.log('📋 AuthHandler: Formatted API data:', apiData);

        // Save user data to backend
        saveUserToBackend(apiData);

        // Mark this user as processed
        processedUserIds.current.add(userId);
        setHasProcessedUser(true);
      } else {
        console.log('⏭️ AuthHandler: User already processed, skipping...', userId);
      }
    } else if (accounts.length === 0) {
      console.log('🚫 AuthHandler: No accounts found');
      // Reset when user logs out
      setHasProcessedUser(false);
      processedUserIds.current.clear();
    }
  }, [accounts]);

  // This component doesn't render anything
  return null;
};

export default AuthHandler;

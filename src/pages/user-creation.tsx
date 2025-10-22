import { useMsal } from '@azure/msal-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserApiUrl } from '../config/apiConfig';

const UserCreation = () => {
  const { accounts } = useMsal();
  const processedUserIds = useRef(new Set<string>());
  const navigate = useNavigate();

  // Extract user data from Microsoft Entra account
  const extractUserData = (account: any) => {
    const email = account.username || '';

    // Get data from ID token claims (where Entra stores the actual registration fields)
    const idTokenClaims = account.idTokenClaims || {};

    console.log(
      '🔍 AuthHandler: Full ID Token Claims:',
      JSON.stringify(idTokenClaims, null, 2)
    );
    console.log(
      '🔍 AuthHandler: Account object:',
      JSON.stringify(account, null, 2)
    );

    // Try multiple possible field names for first and last name
    const firstName =
      idTokenClaims.given_name ||
      idTokenClaims.firstName ||
      idTokenClaims['given-name'] ||
      idTokenClaims.givenName ||
      '';

    const lastName =
      idTokenClaims.family_name ||
      idTokenClaims.lastName ||
      idTokenClaims['family-name'] ||
      idTokenClaims.familyName ||
      idTokenClaims.surname ||
      '';

    const displayName =
      idTokenClaims.name ||
      idTokenClaims.displayName ||
      idTokenClaims.display_name ||
      account.name ||
      account.displayName ||
      '';

    console.log('🔍 AuthHandler: Extracted fields:', {
      'All available claims': Object.keys(idTokenClaims),
      firstName: firstName,
      lastName: lastName,
      displayName: displayName,
      email: email,
    });

    // If we still don't have first/last name, try to parse from display name as fallback
    let finalFirstName = firstName;
    let finalLastName = lastName;

    if ((!firstName || !lastName) && displayName && displayName.trim()) {
      console.log(
        '🔄 AuthHandler: Attempting to parse names from displayName:',
        displayName
      );
      const nameParts = displayName.trim().split(' ');
      if (nameParts.length >= 2) {
        finalFirstName = finalFirstName || nameParts[0];
        finalLastName = finalLastName || nameParts.slice(1).join(' ');
        console.log(
          '🔄 AuthHandler: Parsed from displayName - firstName:',
          finalFirstName,
          'lastName:',
          finalLastName
        );
      }
    }

    const result = {
      id: account.localAccountId || account.homeAccountId || '',
      email: email,
      displayName: displayName,
      firstName: finalFirstName,
      lastName: finalLastName,
      username: account.username || '',
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
          Accept: 'application/json',
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
    if (accounts.length > 0) {
      const currentUser = accounts[0];
      const email = currentUser.username;
      if (!email) {
        console.error('❌ AuthHandler: Missing email - cannot proceed');
        return;
      }
      fetch(
        `http://localhost:7071/api/users/by-email?email=${encodeURIComponent(
          email
        )}`
      )
        .then(async (res) => {
          if (!res.ok) throw new Error('Network response was not ok');
          const data = await res.json();
          if (!data || Object.keys(data).length === 0) {
            console.log('Create a DB entry');
          } else {
            console.log('navingating to admin dashboard');
            navigate('/owner', { replace: true });
          }
        })
        .catch((err) => {
          console.log('Create a DB entry');
        });
    } else {
      console.log('No entra account exists');
    }
  }, [accounts, navigate]);

  return <div>Loading Spinner...</div>;
};

export default UserCreation;

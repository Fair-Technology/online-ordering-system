import { useMsal } from '@azure/msal-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserApiUrl } from '../config/apiConfig';

const UserCreation = () => {
  const { accounts } = useMsal();
  const navigate = useNavigate();

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

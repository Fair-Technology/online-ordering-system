import { useMsal } from '@azure/msal-react';
import { useEffect } from 'react';

const SuperAdmin = () => {
  const { instance, accounts } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect();
  };

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  useEffect(() => {
    if (accounts.length) {
      // Send user info to backend after login
      const user = {
        email: accounts[0].username, // <-- this is usually email
        name: accounts[0].name, // <-- display name
      };

      fetch(
        'https://online-ordering-system-dev-ahatfvfqghebdnez.australiaeast-01.azurewebsites.net/api/users',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        }
      )
        .then((res) => res.json())
        .then((data) => console.log('User saved:', data))
        .catch((err) => console.error('Error saving user:', err));
    }
  }, [accounts]);

  useEffect(() => {
    console.log('aslam');
  }, [accounts]);

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>Admin</h2>
      {!accounts.length ? (
        <button onClick={handleLogin} className="bg-red-300 text-green-500">
          Login
        </button>
      ) : (
        <button onClick={handleLogout} className="bg-blue-300 text-red-500">
          Logout
        </button>
      )}
    </div>
  );
};

export default SuperAdmin;

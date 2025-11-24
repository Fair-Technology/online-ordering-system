import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useUsersCreateMutation,
  useUsersListQuery,
} from '../store/api/ownerApi';

const UserCreation = () => {
  const { accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const [creationRequested, setCreationRequested] = useState(false);
  const hasNavigatedRef = useRef(false);
  const isMsalLoading =
    inProgress === InteractionStatus.Startup ||
    inProgress === InteractionStatus.HandleRedirect;

  const activeAccount = accounts[0];
  const userIdentifier = useMemo(
    () =>
      activeAccount?.localAccountId ||
      activeAccount?.homeAccountId ||
      activeAccount?.username,
    [activeAccount]
  );

  const shouldQuery = Boolean(activeAccount) && !isMsalLoading;
  const {
    data: users,
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
  } = useUsersListQuery(undefined, {
    skip: !shouldQuery,
  });
  const [createUser, { isLoading: isCreatingUser }] = useUsersCreateMutation();

  useEffect(() => {
    if (hasNavigatedRef.current || isMsalLoading) {
      return;
    }

    if (!activeAccount || !userIdentifier) {
      hasNavigatedRef.current = true;
      navigate('/', { replace: true });
      return;
    }

    if (isUsersLoading || isUsersFetching) return;

    const normalizedEmail = activeAccount.username?.toLowerCase();

    const existingUser = users?.find(
      (user) =>
        user.id === userIdentifier ||
        (normalizedEmail && user.email?.toLowerCase() === normalizedEmail)
    );

    if (existingUser) {
      hasNavigatedRef.current = true;
      navigate('/owner', { replace: true });
      return;
    }

    if (!creationRequested && !isCreatingUser) {
      setCreationRequested(true);
      createUser({
        entraId: 'some-random-id',
        email: activeAccount.username,
        role: 'shopAdmin',
        name: activeAccount.name ?? activeAccount.username ?? 'New User',
      })
        .unwrap()
        .catch((error) => {
          console.error('Unable to create user entry', error);
        })
        .finally(() => {
          hasNavigatedRef.current = true;
          navigate('/owner', { replace: true });
        });
    }
  }, [
    activeAccount,
    createUser,
    creationRequested,
    isMsalLoading,
    isCreatingUser,
    isUsersFetching,
    isUsersLoading,
    navigate,
    userIdentifier,
    users,
  ]);

  return (
    <>
      <style>
        {`
        @keyframes segmented-spin {
          to {
            transform: rotate(1turn);
          }
        }
        .segmented-spinner {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: conic-gradient(
            #0f172a 0deg 45deg,
            #1f2937 45deg 90deg,
            #374151 90deg 135deg,
            #6b7280 135deg 180deg,
            #94a3b8 180deg 225deg,
            #cbd5f5 225deg 270deg,
            #e5e7eb 270deg 315deg,
            transparent 315deg
          );
          mask: radial-gradient(farthest-side, transparent 55%, black 56%);
          animation: segmented-spin 0.8s linear infinite;
        }
      `}
      </style>
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div
          className="segmented-spinner"
          role="status"
          aria-label="Checking your account"
        />
      </div>
    </>
  );
};

export default UserCreation;

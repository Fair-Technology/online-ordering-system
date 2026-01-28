import { FormEvent, useEffect, useState } from 'react';
import {
  useUsersListQuery,
  useUsersCreateMutation,
  useUsersDeleteMutation,
  useUsersListManagedShopsQuery,
} from '../../../services/api';

const UsersModule = () => {
  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers,
  } = useUsersListQuery();
  const [createUser, { isLoading: createSubmitting }] =
    useUsersCreateMutation();
  const [deleteUser] = useUsersDeleteMutation();
  const [selectedUserId, setSelectedUserId] = useState('');
  const {
    data: managedShopsData,
    isLoading: managedLoading,
  } = useUsersListManagedShopsQuery(selectedUserId, {
    skip: !selectedUserId,
  });
  const managedShops = managedShopsData ?? [];
  const [createForm, setCreateForm] = useState({ id: '' });

  useEffect(() => {
    if (!users.length) {
      setSelectedUserId('');
      return;
    }
    if (!selectedUserId || !users.find((user) => user.id === selectedUserId)) {
      setSelectedUserId(users[0]?.id ?? '');
    }
  }, [users, selectedUserId]);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.id.trim()) return;
    try {
      await createUser({ id: createForm.id.trim() }).unwrap();
      await refetchUsers();
      setCreateForm({ id: '' });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to create user.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !window.confirm(
        `Deleting ${userId} removes their access immediately. Continue?`
      )
    ) {
      return;
    }
    try {
      await deleteUser(userId).unwrap();
      if (selectedUserId === userId) {
        setSelectedUserId('');
      }
      await refetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to delete user.');
    }
  };
  const usersErrorMessage = usersError ? 'Unable to load users.' : null;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users & ACL</h1>
        <p className="text-sm text-gray-600">
          Create platform actors and inspect which shops each user can access.
        </p>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Directory</h2>
            <p className="text-sm text-gray-600">
              Each entry corresponds to an identity managed by your platform.
            </p>
          </div>
          <form
            className="flex flex-col gap-2 md:flex-row md:items-center"
            onSubmit={handleCreateUser}
          >
            <input
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="User ID"
              value={createForm.id}
              onChange={(event) =>
                setCreateForm({ id: event.target.value })
              }
              required
            />
            <button
              type="submit"
              disabled={createSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createSubmitting ? 'Creating…' : 'Create user'}
            </button>
          </form>
        </div>
        {usersLoading ? (
          <p className="text-sm text-gray-500">Loading users…</p>
        ) : usersErrorMessage ? (
          <p className="text-sm text-red-600">{usersErrorMessage}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900">{user.id}</p>
                    </td>
                    <td className="px-3 py-2 text-right space-x-3">
                      <button
                        type="button"
                        className={`text-xs font-medium ${
                          selectedUserId === user.id
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        } hover:underline`}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-red-600 hover:underline"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Managed shops
            </h2>
            <p className="text-sm text-gray-600">
              ACL rollup for <span className="font-semibold">{selectedUserId || '—'}</span>
            </p>
          </div>
        </div>
        {managedLoading ? (
          <p className="text-sm text-gray-500">Loading managed shops…</p>
        ) : selectedUserId ? (
          managedShops.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {managedShops.map((shop) => (
                <div key={shop.shopId} className="rounded-xl border border-gray-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{shop.name}</p>
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {shop.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Status: {shop.status} • Accepting {shop.acceptingOrders ? 'yes' : 'no'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              This user is not associated with any shops.
            </p>
          )
        ) : (
          <p className="text-sm text-gray-500">Select a user to inspect ACL.</p>
        )}
      </section>
    </div>
  );
};

export default UsersModule;

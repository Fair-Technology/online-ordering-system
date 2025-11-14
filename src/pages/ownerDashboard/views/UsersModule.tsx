import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, type ApiShape } from '../../../config/api';

type User = Awaited<ReturnType<ApiShape['listUsers']>>[number];
type ManagedShop = Awaited<ReturnType<ApiShape['listManagedShops']>>[number];

const roleOptions: User['roles'] = ['customer', 'shopAdmin', 'platformAdmin'];

const UsersModule = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [managedShops, setManagedShops] = useState<ManagedShop[]>([]);
  const [managedLoading, setManagedLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    id: '',
    primaryEmail: '',
    roles: new Set<User['roles'][number]>(['shopAdmin']),
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await api.listUsers();
      setUsers(response);
      if (!selectedUserId && response.length) {
        setSelectedUserId(response[0].id);
      }
    } catch (error) {
      setUsersError(
        error instanceof Error ? error.message : 'Unable to load users.'
      );
    } finally {
      setUsersLoading(false);
    }
  }, [selectedUserId]);

  const loadManagedShops = useCallback(
    async (userId: string) => {
      if (!userId) {
        setManagedShops([]);
        return;
      }
      setManagedLoading(true);
      try {
        const response = await api.listManagedShops(userId);
        setManagedShops(response);
      } catch (error) {
        console.error(error);
      } finally {
        setManagedLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (selectedUserId) {
      loadManagedShops(selectedUserId);
    }
  }, [selectedUserId, loadManagedShops]);

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.id) return;
    setCreateSubmitting(true);
    try {
      await api.createUser({
        id: createForm.id,
        primaryEmail: createForm.primaryEmail || undefined,
        roles: Array.from(createForm.roles),
      });
      await loadUsers();
      setCreateForm({
        id: '',
        primaryEmail: '',
        roles: new Set(['shopAdmin']),
      });
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Unable to create user.'
      );
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleRoleToggle = async (
    user: User,
    role: User['roles'][number],
    checked: boolean
  ) => {
    setUpdatingRoles(user.id);
    try {
      const nextRoles = new Set(user.roles);
      if (checked) {
        nextRoles.add(role);
      } else {
        nextRoles.delete(role);
      }
      await api.updateUser(user.id, { roles: Array.from(nextRoles) });
      await loadUsers();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Unable to update roles.'
      );
    } finally {
      setUpdatingRoles(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (
      !window.confirm(
        `Deleting ${user.id} removes their access immediately. Continue?`
      )
    ) {
      return;
    }
    try {
      await api.deleteUser(user.id);
      if (selectedUserId === user.id) {
        setSelectedUserId('');
        setManagedShops([]);
      }
      await loadUsers();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Unable to delete user.'
      );
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users & ACL</h1>
        <p className="text-sm text-gray-600">
          Create platform actors, tune their roles, and inspect the shops each
          member can access.
        </p>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Directory
            </h2>
            <p className="text-sm text-gray-600">
              Every user inherits ACL from their assigned roles.
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
                setCreateForm((prev) => ({ ...prev, id: event.target.value }))
              }
              required
            />
            <input
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Primary email"
              value={createForm.primaryEmail}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  primaryEmail: event.target.value,
                }))
              }
            />
            <div className="flex gap-2">
              {roleOptions.map((role) => (
                <label
                  key={role}
                  className="inline-flex items-center gap-1 text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={createForm.roles.has(role)}
                    onChange={(event) =>
                      setCreateForm((prev) => {
                        const next = new Set(prev.roles);
                        if (event.target.checked) {
                          next.add(role);
                        } else {
                          next.delete(role);
                        }
                        return { ...prev, roles: next };
                      })
                    }
                  />
                  {role}
                </label>
              ))}
            </div>
            <button
              type="submit"
              disabled={createSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createSubmitting ? 'Creating…' : 'Add user'}
            </button>
          </form>
        </div>
        {usersLoading ? (
          <p className="text-sm text-gray-500">Loading users…</p>
        ) : usersError ? (
          <p className="text-sm text-red-600">{usersError}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Roles</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900">{user.id}</p>
                      <p className="text-xs text-gray-500">
                        {user.primaryEmail || 'No email'}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {roleOptions.map((role) => (
                          <label
                            key={role}
                            className="inline-flex items-center gap-1 text-xs text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={user.roles.includes(role)}
                              onChange={(event) =>
                                handleRoleToggle(user, role, event.target.checked)
                              }
                              disabled={updatingRoles === user.id}
                            />
                            {role}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
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
                        onClick={() => handleDeleteUser(user)}
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
                    <p className="font-semibold text-gray-900">
                      {shop.name}
                    </p>
                    <span className="text-xs uppercase tracking-wide text-gray-500">
                      {shop.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Status: {shop.status} • Accepting{' '}
                    {shop.acceptingOrders ? 'yes' : 'no'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {shop.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
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

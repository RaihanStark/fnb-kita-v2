'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { withRole } from '@/components/auth/with-role';
import { useUserManagementStore } from '@/stores/user-management-store';
import useAuthStore from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ChevronDown, Users, ArrowLeft } from 'lucide-react';
import { RoleChangeDialog } from '@/components/user-management/role-change-dialog';

function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const {
    users,
    loading,
    error,
    pagination,
    filters,
    fetchUsers,
    setSearch,
    setRoleFilter,
    setPagination,
    setSelectedUser,
    setShowRoleChangeDialog,
  } = useUserManagementStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, pagination.page, filters.search, filters.role]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleRoleFilterChange = (role: '' | 'Manager' | 'Employee') => {
    setRoleFilter(role);
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ page: newPage });
  };

  const handleRoleChangeClick = (user: typeof users[0]) => {
    setSelectedUser(user);
    setShowRoleChangeDialog(true);
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Management
          </h1>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={handleSearchChange}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>
          <div className="relative">
            <select
              value={filters.role}
              onChange={(e) => handleRoleFilterChange(e.target.value as '' | 'Manager' | 'Employee')}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-2 text-gray-500">Loading users...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <Button
              onClick={() => fetchUsers()}
              className="mt-2 bg-orange-500 hover:bg-orange-600"
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}

        {!loading && !error && users.length > 0 && (
          <div className="space-y-3" role="list">
            {users.map((user) => (
              <Card key={user.uid} className="bg-white" role="listitem">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{user.email}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              user.role === 'Manager' ? 'bg-orange-500' : 'bg-gray-400'
                            }`}
                          />
                          {user.role}
                        </span>
                        <span>Last login: {formatLastLogin(user.lastLogin)}</span>
                      </div>
                    </div>
                    {user.uid !== currentUser?.uid && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRoleChangeClick(user)}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        Change Role
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 pb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Role Change Dialog */}
      <RoleChangeDialog />
    </div>
  );
}

export default withRole(UsersPage, ['Manager']);
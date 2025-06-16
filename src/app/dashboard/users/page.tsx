'use client';

import { useEffect, useState } from 'react';
import { withRole } from '@/components/auth/with-role';
import { AppLayout } from '@/components/layout/app-layout';
import { useUserManagementStore } from '@/stores/user-management-store';
import useAuthStore from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ChevronDown, Users, Eye, UserPlus, Clock, Copy, RefreshCw, X, CheckCircle } from 'lucide-react';
import { RoleChangeDialog } from '@/components/user-management/role-change-dialog';
import { UserDetailDialog } from '@/components/user-management/user-detail-dialog';
import { InviteEmployeeDialog } from '@/components/user-management/invite-employee-dialog';

function UsersPage() {
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
    setShowUserDetailDialog,
    fetchUserDetail,
    resendInvitation,
    cancelInvitation,
  } = useUserManagementStore();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState<string | null>(null);

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

  const handleViewDetailsClick = async (user: typeof users[0]) => {
    await fetchUserDetail(user.uid);
    setShowUserDetailDialog(true);
  };

  const handleCopyInviteLink = async (user: typeof users[0]) => {
    if (user.registered === 'invited' && user.invitationToken) {
      const baseUrl = window.location.origin;
      const inviteLink = `${baseUrl}/invite/${user.invitationToken}`;
      
      try {
        await navigator.clipboard.writeText(inviteLink);
        setCopiedInviteLink(user.uid);
        setTimeout(() => setCopiedInviteLink(null), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const handleResendInvitation = async (user: typeof users[0]) => {
    try {
      await resendInvitation(user.uid);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  const handleCancelInvitation = async (user: typeof users[0]) => {
    try {
      await cancelInvitation(user.uid);
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
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
    <AppLayout 
      title="User Management" 
      allowedRoles={['Manager']}
      showBackButton={true}
      trailingActions={
        <Button
          size="sm"
          onClick={() => setShowInviteDialog(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white shadow-md"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite
        </Button>
      }
    >
      <div className="flex flex-col h-full">
        {/* Material Design Search and Filter */}
        <div className="p-4">
          <Card className="shadow-md border-0">
            <div className="p-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="pl-10 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
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
          </Card>
        </div>

        {/* Material Design User List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading && (
            <Card className="shadow-md border-0">
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-4 text-gray-500 font-medium">Loading users...</p>
              </div>
            </Card>
          )}

          {error && (
            <Card className="shadow-md border-0">
              <div className="text-center py-12">
                <p className="text-red-500 font-medium mb-4">{error}</p>
                <Button
                  onClick={() => fetchUsers()}
                  className="bg-orange-500 hover:bg-orange-600 shadow-md"
                >
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {!loading && !error && users.length === 0 && (
            <Card className="shadow-md border-0">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">No users found</p>
              </div>
            </Card>
          )}

          {!loading && !error && users.length > 0 && (
            <div className="space-y-3" role="list">
              {users.map((user) => (
                <Card key={user.uid} className="shadow-md border-0 hover:shadow-lg transition-shadow" role="listitem">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900 text-lg">{user.email}</h3>
                          {user.registered === 'invited' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              <Clock className="w-3 h-3" />
                              Invited
                            </span>
                          )}
                          {user.registered === 'registered' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-2">
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${
                                user.role === 'Manager' ? 'bg-orange-500' : 'bg-gray-400'
                              }`}
                            />
                            <span className="font-medium text-gray-700">{user.role}</span>
                          </span>
                          {user.registered === 'registered' ? (
                            <span className="text-gray-500">Last login: {formatLastLogin(user.lastLogin)}</span>
                          ) : (
                            <span className="text-gray-500">
                              Invited {user.invitedAt ? new Date(user.invitedAt).toLocaleDateString() : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.registered === 'registered' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetailsClick(user)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                            {user.uid !== currentUser?.uid && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRoleChangeClick(user)}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50 shadow-sm"
                              >
                                Change Role
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyInviteLink(user)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm"
                            >
                              {copiedInviteLink === user.uid ? (
                                <CheckCircle className="w-4 h-4 mr-1" />
                              ) : (
                                <Copy className="w-4 h-4 mr-1" />
                              )}
                              {copiedInviteLink === user.uid ? 'Copied!' : 'Copy Link'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendInvitation(user)}
                              className="text-green-600 border-green-200 hover:bg-green-50 shadow-sm"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Resend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelInvitation(user)}
                              className="text-red-600 border-red-200 hover:bg-red-50 shadow-sm"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Material Design Pagination */}
          {!loading && !error && pagination.totalPages > 1 && (
            <Card className="shadow-md border-0 mt-6">
              <div className="flex justify-center items-center gap-3 p-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="shadow-sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 font-medium px-4">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="shadow-sm"
                >
                  Next
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Dialogs */}
        <RoleChangeDialog />
        <UserDetailDialog />
        <InviteEmployeeDialog 
          open={showInviteDialog} 
          onOpenChange={setShowInviteDialog} 
        />
      </div>
    </AppLayout>
  );
}

export default withRole(UsersPage, ['Manager']);
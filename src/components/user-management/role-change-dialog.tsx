'use client';

import { useState } from 'react';
import { useUserManagementStore } from '@/stores/user-management-store';
import useAuthStore from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function RoleChangeDialog() {
  const { user } = useAuthStore();
  const {
    selectedUser,
    showRoleChangeDialog,
    updatingRole,
    setShowRoleChangeDialog,
    setSelectedUser,
    setUpdatingRole,
    updateUserRole,
    fetchUsers,
  } = useUserManagementStore();

  const [error, setError] = useState<string | null>(null);

  if (!showRoleChangeDialog || !selectedUser) return null;

  const newRole = selectedUser.role === 'Manager' ? 'Employee' : 'Manager';

  const handleConfirm = async () => {
    setError(null);
    setUpdatingRole(true);

    try {
      const token = await user?.getIdToken();
      const response = await fetch(`/api/users/${selectedUser.uid}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      // Update local state
      updateUserRole(selectedUser.uid, newRole);
      
      // Close dialog
      setShowRoleChangeDialog(false);
      setSelectedUser(null);
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleCancel = () => {
    setShowRoleChangeDialog(false);
    setSelectedUser(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Change User Role</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
            disabled={updatingRole}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Are you sure you want to change <strong>{selectedUser.email}</strong>'s role from{' '}
            <strong>{selectedUser.role}</strong> to <strong>{newRole}</strong>?
          </p>

          {selectedUser.role === 'Manager' && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
              <p className="text-sm text-orange-700">
                <strong>Warning:</strong> Changing this user to Employee will remove their
                administrative privileges.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updatingRole}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={updatingRole}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            {updatingRole ? (
              <span className="flex items-center gap-2">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Updating...
              </span>
            ) : (
              'Confirm Change'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserRoleManagerProps {
  user: User;
  onRoleUpdate: (userId: string, newRole: string) => void;
}

const roles = [
  { value: 'evaluated_user', label: 'Regular User' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'leader', label: 'Department Leader' },
  { value: 'company_admin', label: 'Company Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export function UserRoleManager({ user, onRoleUpdate }: UserRoleManagerProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleUpdate = async () => {
    if (selectedRole === user.role) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (response.ok) {
        onRoleUpdate(user.id, selectedRole);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        setSelectedRole(user.role); // Reset on error
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
      setSelectedRole(user.role); // Reset on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="flex-1">
        <h3 className="font-medium">{user.name}</h3>
        <p className="text-sm text-gray-600">{user.email}</p>
      </div>

      <div className="flex items-center gap-2">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleRoleUpdate}
          disabled={isUpdating || selectedRole === user.role}
          size="sm"
        >
          {isUpdating ? 'Updating...' : 'Update'}
        </Button>
      </div>
    </div>
  );
}

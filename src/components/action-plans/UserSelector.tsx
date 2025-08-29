'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Users, X, ChevronDown } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department_id: string;
  department_name?: string;
}

interface UserSelectorProps {
  selectedUsers: string[];
  onChange: (userIds: string[]) => void;
  companyId?: string;
  departmentId?: string;
  placeholder?: string;
}

export function UserSelector({
  selectedUsers,
  onChange,
  companyId,
  departmentId,
  placeholder = 'Select users to assign...',
}: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, companyId, departmentId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (companyId) params.append('company_id', companyId);
      if (departmentId) params.append('department_id', departmentId);

      const response = await fetch(`/api/users/preview?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !selectedRole || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const selectedUserObjects = users.filter((user) =>
    selectedUsers.includes(user._id)
  );

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onChange(selectedUsers.filter((id) => id !== userId));
    } else {
      onChange([...selectedUsers, userId]);
    }
  };

  const removeUser = (userId: string) => {
    onChange(selectedUsers.filter((id) => id !== userId));
  };

  const roles = [...new Set(users.map((user) => user.role))];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'company_admin':
        return 'bg-blue-100 text-blue-800';
      case 'department_admin':
        return 'bg-green-100 text-green-800';
      case 'leader':
        return 'bg-orange-100 text-orange-800';
      case 'supervisor':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      {/* Selected Users Display */}
      {selectedUserObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedUserObjects.map((user) => (
            <Badge
              key={user._id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <User className="w-3 h-3" />
              {user.name}
              <button
                type="button"
                onClick={() => removeUser(user._id)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selector Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2" />
          {selectedUsers.length > 0
            ? `${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} selected`
            : placeholder}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-md shadow-lg"
          >
            <div className="p-3 border-b border-gray-200">
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Role Filter */}
              {roles.length > 1 && (
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Roles</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role
                        .replace('_', ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* User List */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loading size="sm" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="py-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer ${
                        selectedUsers.includes(user._id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleUserToggle(user._id)}
                    >
                      <div className="flex items-center flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                            selectedUsers.includes(user._id)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200'
                          }`}
                        >
                          {selectedUsers.includes(user._id) ? (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          ) : (
                            <User className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRoleColor(user.role)}`}
                      >
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No users found</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-3 border-t border-gray-200 flex justify-between">
              <span className="text-xs text-gray-500">
                {selectedUsers.length} selected
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

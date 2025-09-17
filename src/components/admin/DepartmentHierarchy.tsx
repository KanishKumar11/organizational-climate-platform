'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/Loading';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Users,
  Save,
  X,
  Move,
} from 'lucide-react';

interface Department {
  _id: string;
  name: string;
  description?: string;
  company_id: string;
  is_active: boolean;
  hierarchy: {
    level: number;
    parent_department_id?: string;
  };
  user_count?: number;
  children?: Department[];
}

interface EditingDepartment {
  id: string;
  name: string;
  description: string;
}

export default function DepartmentHierarchy() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [editingDepartment, setEditingDepartment] = useState<EditingDepartment | null>(null);
  const [newDepartment, setNewDepartment] = useState<{ name: string; description: string; parentId?: string } | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      if (response.ok) {
        const data = await response.json();
        const hierarchicalDepartments = buildDepartmentHierarchy(data.departments || []);
        setDepartments(hierarchicalDepartments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildDepartmentHierarchy = (flatDepartments: Department[]): Department[] => {
    const departmentMap = new Map<string, Department>();
    const rootDepartments: Department[] = [];

    // Create a map of all departments
    flatDepartments.forEach(dept => {
      departmentMap.set(dept._id, { ...dept, children: [] });
    });

    // Build the hierarchy
    flatDepartments.forEach(dept => {
      const department = departmentMap.get(dept._id)!;
      
      if (dept.hierarchy.parent_department_id) {
        const parent = departmentMap.get(dept.hierarchy.parent_department_id);
        if (parent) {
          parent.children!.push(department);
        } else {
          rootDepartments.push(department);
        }
      } else {
        rootDepartments.push(department);
      }
    });

    return rootDepartments;
  };

  const toggleExpanded = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const startEditing = (department: Department) => {
    setEditingDepartment({
      id: department._id,
      name: department.name,
      description: department.description || '',
    });
  };

  const saveEdit = async () => {
    if (!editingDepartment) return;

    try {
      const response = await fetch(`/api/admin/departments/${editingDepartment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingDepartment.name,
          description: editingDepartment.description,
        }),
      });

      if (response.ok) {
        setEditingDepartment(null);
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  const cancelEdit = () => {
    setEditingDepartment(null);
  };

  const startAddingDepartment = (parentId?: string) => {
    setNewDepartment({
      name: '',
      description: '',
      parentId,
    });
  };

  const saveNewDepartment = async () => {
    if (!newDepartment || !newDepartment.name.trim()) return;

    try {
      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDepartment.name,
          description: newDepartment.description,
          parent_department_id: newDepartment.parentId,
        }),
      });

      if (response.ok) {
        setNewDepartment(null);
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error creating department:', error);
    }
  };

  const cancelNewDepartment = () => {
    setNewDepartment(null);
  };

  const deleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/departments/${departmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  const renderDepartment = (department: Department, level: number = 0) => {
    const isExpanded = expandedDepartments.has(department._id);
    const hasChildren = department.children && department.children.length > 0;
    const isEditing = editingDepartment?.id === department._id;

    return (
      <div key={department._id} className="border-l-2 border-gray-200">
        <div 
          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleExpanded(department._id)}
            className="p-1 hover:bg-gray-200 rounded"
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </button>

          {/* Department Icon */}
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building className="w-4 h-4 text-blue-600" />
          </div>

          {/* Department Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editingDepartment.name}
                  onChange={(e) => setEditingDepartment({
                    ...editingDepartment,
                    name: e.target.value,
                  })}
                  placeholder="Department name"
                  className="font-medium"
                />
                <Input
                  value={editingDepartment.description}
                  onChange={(e) => setEditingDepartment({
                    ...editingDepartment,
                    description: e.target.value,
                  })}
                  placeholder="Description (optional)"
                  className="text-sm"
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{department.name}</h3>
                  {!department.is_active && (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Inactive
                    </Badge>
                  )}
                </div>
                {department.description && (
                  <p className="text-sm text-gray-600">{department.description}</p>
                )}
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {department.user_count || 0} users
                  </span>
                  <span className="text-xs text-gray-500">
                    Level {department.hierarchy.level}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button variant="ghost" size="sm" onClick={saveEdit}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => startAddingDepartment(department._id)}
                  title="Add subdepartment"
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => startEditing(department)}
                  title="Edit department"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteDepartment(department._id)}
                  className="text-red-500 hover:text-red-700"
                  title="Delete department"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* New Department Form */}
        {newDepartment && newDepartment.parentId === department._id && (
          <div 
            className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
            style={{ marginLeft: `${(level + 1) * 24 + 32}px` }}
          >
            <div className="space-y-2">
              <Input
                value={newDepartment.name}
                onChange={(e) => setNewDepartment({
                  ...newDepartment,
                  name: e.target.value,
                })}
                placeholder="New department name"
                autoFocus
              />
              <Input
                value={newDepartment.description}
                onChange={(e) => setNewDepartment({
                  ...newDepartment,
                  description: e.target.value,
                })}
                placeholder="Description (optional)"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveNewDepartment}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={cancelNewDepartment}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {department.children!.map(child => renderDepartment(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Hierarchy</h1>
          <p className="text-gray-600">Manage organizational structure and departments</p>
        </div>
        <Button onClick={() => startAddingDepartment()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Root Department
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">
                  {departments.reduce((sum, dept) => sum + (dept.user_count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Move className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Depth</p>
                <p className="text-2xl font-bold">
                  {Math.max(...departments.map(d => d.hierarchy.level), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Structure</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Root New Department Form */}
          {newDepartment && !newDepartment.parentId && (
            <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-4">
              <div className="space-y-2">
                <Input
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({
                    ...newDepartment,
                    name: e.target.value,
                  })}
                  placeholder="New department name"
                  autoFocus
                />
                <Input
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({
                    ...newDepartment,
                    description: e.target.value,
                  })}
                  placeholder="Description (optional)"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={saveNewDepartment}>
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={cancelNewDepartment}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {departments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No departments found. Create your first department to get started.
              </div>
            ) : (
              departments.map(department => renderDepartment(department))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

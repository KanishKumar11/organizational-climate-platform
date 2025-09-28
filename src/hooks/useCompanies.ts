'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Company {
  _id: string;
  name: string;
  domain: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  country: string;
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  is_active: boolean;
  userCount?: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormData {
  name: string;
  domain: string;
  industry: string;
  size: Company['size'];
  country: string;
  subscription_tier: Company['subscription_tier'];
  admin_email?: string;
  admin_message?: string;
  send_invitation?: boolean;
}

export interface CompanyStats {
  total: number;
  active: number;
  inactive: number;
  totalUsers: number;
  enterpriseClients: number;
}

// Query keys
export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...companyKeys.lists(), filters] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
};

// API functions
const fetchCompanies = async (): Promise<any> => {
  const response = await fetch('/api/admin/companies');
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Failed to fetch companies',
      error: 'Unknown error',
    }));
    throw new Error(
      errorData.message || errorData.error || 'Failed to fetch companies'
    );
  }
  return response.json();
};

const createCompany = async (data: CompanyFormData): Promise<Company> => {
  const response = await fetch('/api/admin/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Failed to create company',
      error: 'Unknown error',
    }));
    throw new Error(
      errorData.message || errorData.error || 'Failed to create company'
    );
  }

  const result = await response.json();
  // Handle different response structures
  return result?.data || result;
};

const updateCompany = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<CompanyFormData>;
}): Promise<Company> => {
  const response = await fetch(`/api/admin/companies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Failed to update company',
      error: 'Unknown error',
    }));
    throw new Error(
      errorData.message || errorData.error || 'Failed to update company'
    );
  }

  const result = await response.json();
  return result?.data || result;
};

const deleteCompany = async (id: string): Promise<void> => {
  const response = await fetch(`/api/admin/companies/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Failed to delete company',
      error: 'Unknown error',
    }));
    throw new Error(
      errorData.message || errorData.error || 'Failed to delete company'
    );
  }
};

const toggleCompanyStatus = async ({
  id,
  is_active,
}: {
  id: string;
  is_active: boolean;
}): Promise<Company> => {
  const response = await fetch(`/api/admin/companies/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_active }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Failed to update company status',
      error: 'Unknown error',
    }));
    throw new Error(
      errorData.message || errorData.error || 'Failed to update company status'
    );
  }

  const result = await response.json();
  return result?.data || result;
};

const resendInvitation = async (id: string): Promise<void> => {
  const response = await fetch(`/api/admin/companies/${id}/resend-invitation`, {
    method: 'POST',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Failed to resend invitation',
      error: 'Unknown error',
    }));
    throw new Error(
      errorData.message || errorData.error || 'Failed to resend invitation'
    );
  }
};

// React Query hooks
export const useCompanies = () => {
  return useQuery({
    queryKey: companyKeys.lists(),
    queryFn: fetchCompanies,
    select: (data: any) => ({
      companies: data?.data?.companies || data?.companies || [],
      stats: data?.data?.stats,
      pagination: data?.data?.pagination,
    }),
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompany,
    onSuccess: (newCompany) => {
      // Invalidate and refetch to get fresh data
      queryClient.invalidateQueries({ queryKey: companyKeys.all });

      toast.success('Company created successfully!', {
        description: `${newCompany.name} has been added to the system.`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to create company', {
        description: error.message,
      });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCompany,
    onSuccess: (updatedCompany) => {
      // Invalidate and refetch to get fresh data
      queryClient.invalidateQueries({ queryKey: companyKeys.all });

      toast.success('Company updated successfully!', {
        description: `${updatedCompany.name} has been updated.`,
      });
    },
    onError: (error: Error, variables, context) => {
      toast.error('Failed to update company', {
        description: error.message,
      });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: (_, id) => {
      // Invalidate and refetch to get fresh data
      queryClient.invalidateQueries({ queryKey: companyKeys.all });

      toast.success('Company deleted', {
        description: 'The company has been permanently deleted.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete company', {
        description: error.message,
      });
    },
  });
};

export const useToggleCompanyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleCompanyStatus,
    onSuccess: (updatedCompany, { is_active }) => {
      // Invalidate and refetch to get fresh data
      queryClient.invalidateQueries({ queryKey: companyKeys.all });

      const action = is_active ? 'activated' : 'deactivated';
      toast.success(`Company ${action}`, {
        description: `${updatedCompany.name} has been ${action} successfully.`,
      });
    },
    onError: (error: Error, variables, context) => {
      const action = variables.is_active ? 'activate' : 'deactivate';
      toast.error(`Failed to ${action} company`, {
        description: error.message,
      });
    },
  });
};

export const useResendInvitation = () => {
  return useMutation({
    mutationFn: resendInvitation,
    onSuccess: () => {
      toast.success('Invitation resent', {
        description: 'Setup invitation has been resent to the company admin.',
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to resend invitation', {
        description: error.message,
      });
    },
  });
};

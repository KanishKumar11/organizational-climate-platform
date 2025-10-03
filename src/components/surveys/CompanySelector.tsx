import React, { useState, useEffect } from 'react';
import { Search, Building2, ChevronDown, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useCompanies, useCompany, useCompanyDepartments, useCompanyUsers } from '@/hooks/useQueries';
import { prefetchQuery, queryKeys, getQueryData } from '@/lib/react-query-config';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * CLIMA-001: Company Selector Component (Updated with React Query)
 *
 * Searchable dropdown for selecting company in survey creation
 * Triggers preload of departments and users when company is selected
 * Now uses React Query for caching and automatic refetching
 */

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  size?: string;
  employee_count?: number;
}

interface CompanySelectorProps {
  value?: string; // Selected company ID
  onChange: (companyId: string, company: Company) => void;
  onPreloadComplete?: (data: { departments: any[]; users: any[] }) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export default function CompanySelector({
  value,
  onChange,
  onPreloadComplete,
  disabled = false,
  required = true,
  error,
}: CompanySelectorProps) {
  const [open, setOpen] = useState(false);
  const [preloading, setPreloading] = useState(false);

  // Use React Query hooks for data fetching
  const { data: companiesData, isLoading } = useCompanies({ limit: 100, active: true });
  const { data: selectedCompanyData } = useCompany(value || '');
  
  const companies = companiesData?.companies || [];
  const selectedCompany = selectedCompanyData?.company || null;

  const handleSelect = async (company: Company) => {
    onChange(company.id, company);
    setOpen(false);

    // Preload departments and users for Steps 3-4 using React Query prefetch
    await preloadCompanyData(company.id);
  };

  const preloadCompanyData = async (companyId: string) => {
    setPreloading(true);
    try {
      // Prefetch departments and users - they'll be cached and instantly available
      await Promise.all([
        prefetchQuery(
          queryKeys.companies.departments(companyId),
          async () => {
            const response = await fetch(`/api/companies/${companyId}/departments`);
            if (!response.ok) throw new Error('Failed to fetch departments');
            const data = await response.json();
            return data;
          }
        ),
        prefetchQuery(
          queryKeys.companies.users(companyId),
          async () => {
            const response = await fetch(`/api/companies/${companyId}/users?limit=1000`);
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            return data;
          }
        ),
      ]);

      // Read the prefetched data from cache
      const departmentsData = getQueryData<any>(queryKeys.companies.departments(companyId));
      const usersData = getQueryData<any>(queryKeys.companies.users(companyId));

      onPreloadComplete?.({
        departments: departmentsData?.departments || [],
        users: usersData?.users || [],
      });
    } catch (error) {
      console.error('Error preloading company data:', error);
      onPreloadComplete?.({
        departments: [],
        users: [],
      });
    } finally {
      setPreloading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="company-selector" className="text-sm font-medium">
        Company {required && <span className="text-red-500">*</span>}
      </Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select company"
            className={cn(
              'w-full justify-between',
              error && 'border-red-500 focus-visible:ring-red-500',
              !value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0" />
              {selectedCompany ? (
                <span className="truncate">{selectedCompany.name}</span>
              ) : (
                <span>Select company...</span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search companies..." className="h-9" />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading companies...' : 'No company found.'}
              </CommandEmpty>
              <CommandGroup>
                {companies.map((company) => (
                  <CommandItem
                    key={company.id}
                    value={company.name}
                    onSelect={() => handleSelect(company)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === company.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {company.name}
                        </span>
                        {company.industry && (
                          <Badge variant="secondary" className="text-xs">
                            {company.industry}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {company.domain}
                        {company.employee_count && (
                          <span className="ml-2">
                            • {company.employee_count} employees
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">{error}</p>
      )}

      {/* Preloading indicator */}
      {preloading && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          Loading departments and users...
        </p>
      )}

      {/* Selected company details */}
      {selectedCompany && !preloading && (
        <div className="p-3 bg-muted/50 rounded-md text-sm">
          <div className="font-medium">{selectedCompany.name}</div>
          <div className="text-muted-foreground space-y-1 mt-1">
            {selectedCompany.industry && (
              <div>Industry: {selectedCompany.industry}</div>
            )}
            {selectedCompany.size && <div>Size: {selectedCompany.size}</div>}
            {selectedCompany.employee_count && (
              <div>Employees: {selectedCompany.employee_count}</div>
            )}
          </div>
        </div>
      )}

      {/* Help text */}
      {!selectedCompany && !error && (
        <p className="text-xs text-muted-foreground">
          Select a company to enable targeting and survey distribution options
        </p>
      )}
    </div>
  );
}

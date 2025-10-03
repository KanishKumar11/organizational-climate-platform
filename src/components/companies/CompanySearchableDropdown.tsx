'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, Building2, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Badge } from '@/components/ui/badge';

export interface CompanyOption {
  _id: string;
  name: string;
  type?: string;
  industry?: string;
  employee_count?: number;
  is_active?: boolean;
}

interface CompanySearchableDropdownProps {
  value?: string;
  onChange: (companyId: string, company: CompanyOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  filterActive?: boolean;
  language?: 'es' | 'en';
}

/**
 * CompanySearchableDropdown Component
 * 
 * Searchable dropdown for selecting companies with:
 * - Real-time search/filter
 * - Company metadata display
 * - Loading states
 * - Keyboard navigation
 * - Active/inactive filtering
 * 
 * Used in Step 1 of microclimate wizard
 */
export function CompanySearchableDropdown({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  filterActive = true,
  language = 'en',
}: CompanySearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const t = language === 'es' ? {
    placeholder: 'Seleccionar empresa...',
    search: 'Buscar empresa...',
    noResults: 'No se encontraron empresas',
    loading: 'Cargando...',
    employees: 'empleados',
    inactive: 'Inactiva',
  } : {
    placeholder: 'Select company...',
    search: 'Search company...',
    noResults: 'No companies found',
    loading: 'Loading...',
    employees: 'employees',
    inactive: 'Inactive',
  };

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/companies');
        if (!response.ok) throw new Error('Failed to fetch companies');
        
        const data = await response.json();
        const companyList = data.companies || data;
        
        setCompanies(companyList);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setCompanies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Filter companies based on search and active status
  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    // Filter by active status if enabled
    if (filterActive) {
      filtered = filtered.filter((company) => company.is_active !== false);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.type?.toLowerCase().includes(query) ||
          company.industry?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [companies, searchQuery, filterActive]);

  // Get selected company
  const selectedCompany = useMemo(
    () => companies.find((company) => company._id === value),
    [companies, value]
  );

  const handleSelect = (companyId: string) => {
    const company = companies.find((c) => c._id === companyId) || null;
    onChange(companyId, company);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.loading}
            </>
          ) : selectedCompany ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{selectedCompany.name}</span>
              {selectedCompany.type && (
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {selectedCompany.type}
                </Badge>
              )}
              {selectedCompany.is_active === false && (
                <Badge variant="destructive" className="shrink-0 text-xs">
                  {t.inactive}
                </Badge>
              )}
            </div>
          ) : (
            <span>{placeholder || t.placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">{t.loading}</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <CommandEmpty>{t.noResults}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredCompanies.map((company) => (
                  <CommandItem
                    key={company._id}
                    value={company._id}
                    onSelect={handleSelect}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          value === company._id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate font-medium">
                          {company.name}
                        </span>
                        {(company.type || company.industry) && (
                          <span className="truncate text-xs text-muted-foreground">
                            {[company.type, company.industry]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {company.employee_count && (
                        <Badge variant="outline" className="text-xs">
                          {company.employee_count} {t.employees}
                        </Badge>
                      )}
                      {company.is_active === false && (
                        <Badge variant="destructive" className="text-xs">
                          {t.inactive}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

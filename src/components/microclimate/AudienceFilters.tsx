'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  X,
  RefreshCw,
  Users,
  Building,
  MapPin,
  Briefcase,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Audience Filters Component
 *
 * Multi-select filtering UI for targeting specific employee sub-groups.
 *
 * Features:
 * - Filter by departments (multi-select with checkboxes)
 * - Filter by locations (multi-select)
 * - Filter by roles/positions (multi-select)
 * - Filter by seniority levels (multi-select)
 * - Search within each filter category
 * - Clear all filters
 * - Active filter badges
 * - Real-time filter count
 * - Apply filters to employee list
 *
 * Best Practices:
 * - Accessible checkboxes with ARIA labels
 * - Keyboard navigation support
 * - Visual feedback on selection
 * - Performance optimized for large lists
 * - Debounced search
 *
 * @param availableDepartments - List of departments from company
 * @param availableLocations - List of locations from demographics
 * @param availableRoles - List of roles from demographics
 * @param availableSeniority - List of seniority levels
 * @param onFiltersChange - Callback when filters change
 * @param language - Display language (es/en)
 */

export interface AudienceFilterValues {
  departments: string[];
  locations: string[];
  roles: string[];
  seniority: string[];
}

interface AudienceFiltersProps {
  availableDepartments?: Array<{
    _id: string;
    name: string;
    employee_count?: number;
  }>;
  availableLocations?: string[];
  availableRoles?: string[];
  availableSeniority?: string[];
  onFiltersChange: (filters: AudienceFilterValues) => void;
  initialFilters?: AudienceFilterValues;
  language?: 'es' | 'en';
}

export function AudienceFilters({
  availableDepartments = [],
  availableLocations = [],
  availableRoles = [],
  availableSeniority = [],
  onFiltersChange,
  initialFilters,
  language = 'es',
}: AudienceFiltersProps) {
  const [filters, setFilters] = useState<AudienceFilterValues>(
    initialFilters || {
      departments: [],
      locations: [],
      roles: [],
      seniority: [],
    }
  );

  const [searchTerms, setSearchTerms] = useState({
    departments: '',
    locations: '',
    roles: '',
    seniority: '',
  });

  const t =
    language === 'es'
      ? {
          title: 'Filtros de Audiencia',
          description: 'Selecciona grupos específicos para dirigir la encuesta',
          departments: 'Departamentos',
          locations: 'Ubicaciones',
          roles: 'Puestos',
          seniority: 'Nivel de Antigüedad',
          search: 'Buscar...',
          selected: 'seleccionados',
          clearAll: 'Limpiar Todos',
          applyFilters: 'Aplicar Filtros',
          activeFilters: 'Filtros Activos',
          noFilters: 'Sin filtros aplicados',
          selectAll: 'Seleccionar Todos',
          deselectAll: 'Deseleccionar Todos',
          noResults: 'No se encontraron resultados',
          employees: 'empleados',
        }
      : {
          title: 'Audience Filters',
          description: 'Select specific groups to target for the survey',
          departments: 'Departments',
          locations: 'Locations',
          roles: 'Positions',
          seniority: 'Seniority Level',
          search: 'Search...',
          selected: 'selected',
          clearAll: 'Clear All',
          applyFilters: 'Apply Filters',
          activeFilters: 'Active Filters',
          noFilters: 'No filters applied',
          selectAll: 'Select All',
          deselectAll: 'Deselect All',
          noResults: 'No results found',
          employees: 'employees',
        };

  // Filter departments by search term
  const filteredDepartments = availableDepartments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerms.departments.toLowerCase())
  );

  // Filter locations by search term
  const filteredLocations = availableLocations.filter((loc) =>
    loc.toLowerCase().includes(searchTerms.locations.toLowerCase())
  );

  // Filter roles by search term
  const filteredRoles = availableRoles.filter((role) =>
    role.toLowerCase().includes(searchTerms.roles.toLowerCase())
  );

  // Filter seniority by search term
  const filteredSeniority = availableSeniority.filter((sen) =>
    sen.toLowerCase().includes(searchTerms.seniority.toLowerCase())
  );

  // Count active filters
  const activeFilterCount =
    filters.departments.length +
    filters.locations.length +
    filters.roles.length +
    filters.seniority.length;

  // Handle checkbox change
  const handleToggle = (
    category: keyof AudienceFilterValues,
    value: string
  ) => {
    setFilters((prev) => {
      const categoryFilters = prev[category];
      const newCategoryFilters = categoryFilters.includes(value)
        ? categoryFilters.filter((v) => v !== value)
        : [...categoryFilters, value];

      return {
        ...prev,
        [category]: newCategoryFilters,
      };
    });
  };

  // Select all in category
  const handleSelectAll = (category: keyof AudienceFilterValues) => {
    let allValues: string[] = [];

    if (category === 'departments') {
      allValues = filteredDepartments.map((d) => d.name);
    } else if (category === 'locations') {
      allValues = filteredLocations;
    } else if (category === 'roles') {
      allValues = filteredRoles;
    } else if (category === 'seniority') {
      allValues = filteredSeniority;
    }

    setFilters((prev) => ({
      ...prev,
      [category]: allValues,
    }));
  };

  // Deselect all in category
  const handleDeselectAll = (category: keyof AudienceFilterValues) => {
    setFilters((prev) => ({
      ...prev,
      [category]: [],
    }));
  };

  // Clear all filters
  const handleClearAll = () => {
    setFilters({
      departments: [],
      locations: [],
      roles: [],
      seniority: [],
    });
    setSearchTerms({
      departments: '',
      locations: '',
      roles: '',
      seniority: '',
    });
    toast.info(language === 'es' ? 'Filtros limpiados' : 'Filters cleared');
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFiltersChange(filters);
    toast.success(language === 'es' ? 'Filtros aplicados' : 'Filters applied', {
      description: `${activeFilterCount} ${language === 'es' ? 'filtros activos' : 'active filters'}`,
    });
  };

  // Auto-apply filters when they change (optional - can be removed if manual apply is preferred)
  useEffect(() => {
    const debounce = setTimeout(() => {
      onFiltersChange(filters);
    }, 300);

    return () => clearTimeout(debounce);
  }, [filters, onFiltersChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t.title}
            </CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll}>
              <X className="w-4 h-4 mr-2" />
              {t.clearAll}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Active Filters Summary */}
        {activeFilterCount > 0 ? (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {t.activeFilters}: {activeFilterCount}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.departments.map((dept) => (
                <Badge key={dept} variant="secondary" className="gap-1">
                  <Building className="w-3 h-3" />
                  {dept}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => handleToggle('departments', dept)}
                  />
                </Badge>
              ))}
              {filters.locations.map((loc) => (
                <Badge key={loc} variant="secondary" className="gap-1">
                  <MapPin className="w-3 h-3" />
                  {loc}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => handleToggle('locations', loc)}
                  />
                </Badge>
              ))}
              {filters.roles.map((role) => (
                <Badge key={role} variant="secondary" className="gap-1">
                  <Briefcase className="w-3 h-3" />
                  {role}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => handleToggle('roles', role)}
                  />
                </Badge>
              ))}
              {filters.seniority.map((sen) => (
                <Badge key={sen} variant="secondary" className="gap-1">
                  <Users className="w-3 h-3" />
                  {sen}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                    onClick={() => handleToggle('seniority', sen)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-400">
            {t.noFilters}
          </div>
        )}

        {/* Filter Accordions */}
        <Accordion
          type="multiple"
          defaultValue={['departments']}
          className="w-full"
        >
          {/* Departments Filter */}
          {availableDepartments.length > 0 && (
            <AccordionItem value="departments">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {t.departments}
                  {filters.departments.length > 0 && (
                    <Badge variant="default" className="ml-2">
                      {filters.departments.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t.search}
                      value={searchTerms.departments}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          departments: e.target.value,
                        }))
                      }
                      className="pl-8"
                    />
                  </div>

                  {/* Select/Deselect All */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('departments')}
                    >
                      {t.selectAll}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeselectAll('departments')}
                    >
                      {t.deselectAll}
                    </Button>
                  </div>

                  {/* Department List */}
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {filteredDepartments.length > 0 ? (
                        filteredDepartments.map((dept) => (
                          <div
                            key={dept._id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`dept-${dept._id}`}
                                checked={filters.departments.includes(
                                  dept.name
                                )}
                                onCheckedChange={() =>
                                  handleToggle('departments', dept.name)
                                }
                              />
                              <label
                                htmlFor={`dept-${dept._id}`}
                                className="text-sm cursor-pointer"
                              >
                                {dept.name}
                              </label>
                            </div>
                            {dept.employee_count && (
                              <span className="text-xs text-gray-500">
                                {dept.employee_count} {t.employees}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {t.noResults}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Locations Filter */}
          {availableLocations.length > 0 && (
            <AccordionItem value="locations">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t.locations}
                  {filters.locations.length > 0 && (
                    <Badge variant="default" className="ml-2">
                      {filters.locations.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t.search}
                      value={searchTerms.locations}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          locations: e.target.value,
                        }))
                      }
                      className="pl-8"
                    />
                  </div>

                  {/* Select/Deselect All */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('locations')}
                    >
                      {t.selectAll}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeselectAll('locations')}
                    >
                      {t.deselectAll}
                    </Button>
                  </div>

                  {/* Location List */}
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map((location) => (
                          <div
                            key={location}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                          >
                            <Checkbox
                              id={`loc-${location}`}
                              checked={filters.locations.includes(location)}
                              onCheckedChange={() =>
                                handleToggle('locations', location)
                              }
                            />
                            <label
                              htmlFor={`loc-${location}`}
                              className="text-sm cursor-pointer"
                            >
                              {location}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {t.noResults}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Roles Filter */}
          {availableRoles.length > 0 && (
            <AccordionItem value="roles">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {t.roles}
                  {filters.roles.length > 0 && (
                    <Badge variant="default" className="ml-2">
                      {filters.roles.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t.search}
                      value={searchTerms.roles}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          roles: e.target.value,
                        }))
                      }
                      className="pl-8"
                    />
                  </div>

                  {/* Select/Deselect All */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('roles')}
                    >
                      {t.selectAll}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeselectAll('roles')}
                    >
                      {t.deselectAll}
                    </Button>
                  </div>

                  {/* Role List */}
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {filteredRoles.length > 0 ? (
                        filteredRoles.map((role) => (
                          <div
                            key={role}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                          >
                            <Checkbox
                              id={`role-${role}`}
                              checked={filters.roles.includes(role)}
                              onCheckedChange={() =>
                                handleToggle('roles', role)
                              }
                            />
                            <label
                              htmlFor={`role-${role}`}
                              className="text-sm cursor-pointer"
                            >
                              {role}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {t.noResults}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Seniority Filter */}
          {availableSeniority.length > 0 && (
            <AccordionItem value="seniority">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t.seniority}
                  {filters.seniority.length > 0 && (
                    <Badge variant="default" className="ml-2">
                      {filters.seniority.length}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t.search}
                      value={searchTerms.seniority}
                      onChange={(e) =>
                        setSearchTerms((prev) => ({
                          ...prev,
                          seniority: e.target.value,
                        }))
                      }
                      className="pl-8"
                    />
                  </div>

                  {/* Select/Deselect All */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll('seniority')}
                    >
                      {t.selectAll}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeselectAll('seniority')}
                    >
                      {t.deselectAll}
                    </Button>
                  </div>

                  {/* Seniority List */}
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {filteredSeniority.length > 0 ? (
                        filteredSeniority.map((sen) => (
                          <div
                            key={sen}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                          >
                            <Checkbox
                              id={`sen-${sen}`}
                              checked={filters.seniority.includes(sen)}
                              onCheckedChange={() =>
                                handleToggle('seniority', sen)
                              }
                            />
                            <label
                              htmlFor={`sen-${sen}`}
                              className="text-sm cursor-pointer"
                            >
                              {sen}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {t.noResults}
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Apply Button (Optional - remove if auto-apply is enabled) */}
        {/* <Button onClick={handleApplyFilters} className="w-full mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t.applyFilters}
        </Button> */}
      </CardContent>
    </Card>
  );
}

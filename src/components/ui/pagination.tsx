'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  showInfo = true,
  totalItems,
  itemsPerPage,
  className,
}: PaginationProps) {
  const startItem = totalItems
    ? (currentPage - 1) * (itemsPerPage || 0) + 1
    : 0;
  const endItem = totalItems
    ? Math.min(currentPage * (itemsPerPage || 0), totalItems)
    : 0;

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200 sm:px-8 rounded-b-xl shadow-sm',
        className
      )}
    >
      {/* Mobile pagination */}
      <div className="flex justify-between flex-1 sm:hidden">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          variant="outline"
          size="sm"
          className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-gray-700 flex items-center font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          variant="outline"
          size="sm"
          className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
        >
          Next
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        {showInfo && totalItems && itemsPerPage && (
          <div>
            <p className="text-sm text-gray-600">
              Showing{' '}
              <span className="font-semibold text-gray-900">{startItem}</span>{' '}
              to <span className="font-semibold text-gray-900">{endItem}</span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900">{totalItems}</span>{' '}
              results
            </p>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            variant="outline"
            size="sm"
            className="px-3 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>

          {getVisiblePages().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-sm text-gray-500">...</span>
              ) : (
                <Button
                  onClick={() => onPageChange(page as number)}
                  disabled={loading}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'px-3 min-w-[40px] transition-all duration-200',
                    currentPage === page
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                      : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  )}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}

          <Button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || loading}
            variant="outline"
            size="sm"
            className="px-3 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 disabled:opacity-50"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function usePagination(initialLimit = 25) {
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const updatePagination = (newPagination: Partial<PaginationInfo>) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const changeLimit = (limit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit,
      page: 1, // Reset to first page when changing limit
    }));
  };

  return {
    pagination,
    updatePagination,
    goToPage,
    changeLimit,
  };
}

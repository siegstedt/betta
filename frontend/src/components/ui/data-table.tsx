'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;
  theadClassName?: string;
  tbodyClassName?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  error,
  emptyMessage = 'No data available.',
  className,
  tableClassName,
  theadClassName,
  tbodyClassName,
  loadingComponent,
  errorComponent,
}: DataTableProps<T>) {
  const renderCell = (column: Column<T>, row: T, index: number) => {
    const value = (row as Record<string, unknown>)[column.key];
    if (column.render) {
      return column.render(value, row, index);
    }
    return value as React.ReactNode;
  };

  const renderLoading = () => {
    if (loadingComponent) return loadingComponent;
    return (
      <tr>
        <td
          colSpan={columns.length}
          className="text-center py-8 text-muted-foreground"
        >
          Loading...
        </td>
      </tr>
    );
  };

  const renderError = () => {
    if (errorComponent) return errorComponent;
    return (
      <tr>
        <td
          colSpan={columns.length}
          className="text-center py-8 text-destructive"
        >
          {error}
        </td>
      </tr>
    );
  };

  const renderEmpty = () => (
    <tr>
      <td
        colSpan={columns.length}
        className="text-center py-8 text-muted-foreground"
      >
        {emptyMessage}
      </td>
    </tr>
  );

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table
        className={cn('min-w-full divide-y divide-border', tableClassName)}
      >
        <thead className={cn('bg-muted/50', theadClassName)}>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
                  column.headerClassName
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn('divide-y divide-border', tbodyClassName)}>
          {loading
            ? renderLoading()
            : error
              ? renderError()
              : data.length > 0
                ? data.map((row, index) => (
                    <tr
                      key={keyExtractor(row, index)}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        onRowClick && 'cursor-pointer hover:bg-muted/50'
                      )}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-3 whitespace-nowrap text-sm',
                            column.className
                          )}
                        >
                          {renderCell(column, row, index)}
                        </td>
                      ))}
                    </tr>
                  ))
                : renderEmpty()}
        </tbody>
      </table>
    </div>
  );
}

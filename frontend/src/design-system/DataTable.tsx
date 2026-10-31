import React from 'react';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyText?: string;
  onExportCsv?: () => void;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  isLoading,
  emptyText = 'NO RECORDS.',
  onExportCsv,
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="border border-line bg-surface p-6 font-mono text-xs text-ink-muted text-center">
        LOADING…
      </div>
    );
  }

  return (
    <div className={`border border-line overflow-hidden flex flex-col ${className}`}>
      {onExportCsv && (
        <div className="bg-surface-alt border-b border-line px-3 py-1.5 flex justify-end">
          <Button variant="outline" size="sm" onClick={onExportCsv}>
            EXPORT CSV
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-surface-alt border-b border-line text-[11px] text-ink-muted uppercase select-none">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 font-bold tracking-wider ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-center text-ink-muted uppercase"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`h-8 hover:bg-[#E4E2D6] ${
                    idx % 2 === 1 ? 'bg-surface-alt' : 'bg-surface'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => {
                    const val = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-1.5 text-ink ${
                          col.align === 'right'
                            ? 'text-right tabular-nums'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        }`}
                      >
                        {col.render ? col.render(row) : (val as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import type { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  onPageChange: (page: number) => void;
}

export function DataTablePagination<TData>({ table, onPageChange }: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(table.getState().pagination.pageIndex - 1)}
        disabled={!table.getCanPreviousPage()}
      >
        Previous
      </Button>
      <span className="text-sm">
        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(table.getState().pagination.pageIndex + 1)}
        disabled={!table.getCanNextPage()}
      >
        Next
      </Button>
    </div>
  );
}

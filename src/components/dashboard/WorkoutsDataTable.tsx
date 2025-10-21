import * as React from "react";
import { getColumns } from "./WorkoutsDataTableColumns.tsx";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { DataTablePagination } from "./DataTablePagination";
import type { Pagination, WorkoutListItemDto } from "@/types";
import type { WorkoutSort } from "../hooks/useWorkoutsDashboard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";

interface WorkoutsDataTableProps {
  data: WorkoutListItemDto[];
  pagination: Pagination;
  sort: WorkoutSort;
  onSortChange: (sort: WorkoutSort) => void;
  onPageChange: (page: number) => void;
  onEdit: (workout: WorkoutListItemDto) => void;
  onDelete: (workout: WorkoutListItemDto) => void;
}

export function WorkoutsDataTable({
  data,
  pagination,
  sort,
  onSortChange,
  onPageChange,
  onEdit,
  onDelete,
}: WorkoutsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: sort.sortBy, desc: sort.order === "desc" }]);
  const [rowSelection] = React.useState({});

  const columns = getColumns({ onSortChange, sort, onEdit, onDelete });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount: pagination.totalPages,
    onSortingChange: setSorting,
    state: {
      sorting,
      rowSelection,
    },
  });

  return (
    <div data-testid="workouts-table">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  data-testid={`workout-row-${row.original.id}`}
                  onClick={() => {
                    window.location.href = `/workouts/${row.original.id}`;
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        if (cell.column.id === "actions") {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow data-testid="no-results-row">
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} onPageChange={onPageChange} />
    </div>
  );
}

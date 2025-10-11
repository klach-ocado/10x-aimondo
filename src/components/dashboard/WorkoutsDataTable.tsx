import * as React from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { DataTablePagination } from "./DataTablePagination";
import type { Pagination, WorkoutListItemDto } from "@/types";
import type { WorkoutSort } from "../hooks/useWorkoutsDashboard";
import {Button} from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table.tsx";

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
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: sort.sortBy, desc: sort.order === "desc" },
  ]);
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<WorkoutListItemDto>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => onSortChange({ sortBy: 'name', order: sort.sortBy === 'name' && sort.order === 'asc' ? 'desc' : 'asc' })}          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => onSortChange({ sortBy: 'date', order: sort.sortBy === 'date' && sort.order === 'asc' ? 'desc' : 'asc' })}          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => new Date(row.getValue("date")).toLocaleDateString(),
    },
    {
      accessorKey: "distance",
      header: "Distance (km)",
      cell: ({ row }) => `${(row.getValue<number>("distance") / 1000).toFixed(2)} km`,
    },
    {
      accessorKey: "duration",
      header: "Duration (min)",
      cell: ({ row }) => `${Math.round(row.getValue<number>("duration") / 60)} min`,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const workout = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(workout)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(workout)} className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))
                }
                </TableRow>
              ))
            ) : (
              <TableRow>
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

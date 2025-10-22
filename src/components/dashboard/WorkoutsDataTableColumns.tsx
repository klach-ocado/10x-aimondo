"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkoutListItemDto } from "@/types";
import { formatDuration } from "@/lib/utils";

interface GetColumnsProps {
  onEdit: (workout: WorkoutListItemDto) => void;
  onDelete: (workout: WorkoutListItemDto) => void;
}

export const getColumns = ({ onEdit, onDelete }: GetColumnsProps): ColumnDef<WorkoutListItemDto>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
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
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
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
    header: "Duration (HH:MM:SS)",
    cell: ({ row }) => formatDuration(row.getValue("duration")),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const workout = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild data-testid="actions-menu-button">
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(workout)} data-testid="edit-workout-button">
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(workout)}
              className="text-red-600"
              data-testid="delete-workout-button"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

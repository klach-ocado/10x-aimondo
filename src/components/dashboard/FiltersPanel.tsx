import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { WorkoutFilters } from "../hooks/useWorkoutsDashboard";

interface FiltersPanelProps {
  filters: WorkoutFilters;
  onFiltersChange: (filters: WorkoutFilters) => void;
  disabled: boolean;
}

export function FiltersPanel({ filters, onFiltersChange, disabled }: FiltersPanelProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined,
  });

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onFiltersChange({
      ...filters,
      dateFrom: newDate?.from ? format(newDate.from, "yyyy-MM-dd") : undefined,
      dateTo: newDate?.to ? format(newDate.to, "yyyy-MM-dd") : undefined,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        placeholder="Filter by name..."
        name="name"
        value={filters.name || ""}
        onChange={handleInputChange}
        disabled={disabled}
        className="max-w-sm"
      />
      <Input
        placeholder="Filter by type..."
        name="type"
        value={filters.type || ""}
        onChange={handleInputChange}
        disabled={disabled}
        className="max-w-sm"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

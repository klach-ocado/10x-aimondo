import * as React from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkoutFilters } from "../hooks/useWorkoutsDashboard";
import { DateRangePicker } from "@/components/common/DateRangePicker";

interface FiltersPanelProps {
  filters: WorkoutFilters;
  onFiltersChange: (filters: WorkoutFilters) => void;
  onClearAll: () => void;
  disabled: boolean;
}

export function FiltersPanel({ filters, onFiltersChange, onClearAll, disabled }: FiltersPanelProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    to: filters.dateTo ? new Date(filters.dateTo) : undefined,
  });

  const areFiltersActive = React.useMemo(() => {
    return filters.name || filters.type || filters.dateFrom || filters.dateTo;
  }, [filters]);

  React.useEffect(() => {
    setDate({
      from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      to: filters.dateTo ? new Date(filters.dateTo) : undefined,
    });
  }, [filters.dateFrom, filters.dateTo]);

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
      <DateRangePicker date={date} onDateChange={handleDateChange} disabled={disabled} />
      {areFiltersActive && (
        <Button variant="secondary" onClick={onClearAll} disabled={disabled}>
          Clear All
        </Button>
      )}
      <Button
        onClick={() => {
          const params = new URLSearchParams();
          if (filters.name) params.set("name", filters.name);
          if (filters.type) params.set("type", filters.type);
          if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
          if (filters.dateTo) params.set("dateTo", filters.dateTo);
          window.location.href = `/heatmap?${params.toString()}`;
        }}
        disabled={disabled}
      >
        Show on Heatmap
      </Button>
    </div>
  );
}

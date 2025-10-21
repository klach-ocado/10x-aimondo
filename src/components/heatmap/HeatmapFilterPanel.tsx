import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DateRangePicker } from "@/components/common/DateRangePicker";

export interface HeatmapFiltersViewModel {
  name?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  type?: string;
}

interface HeatmapFilterPanelProps {
  filters: HeatmapFiltersViewModel;
  onFiltersChange: (newFilters: HeatmapFiltersViewModel) => void;
  isDisabled: boolean;
}

export function HeatmapFilterPanel({ filters, onFiltersChange, isDisabled }: HeatmapFilterPanelProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [date, setDate] = React.useState<DateRange | undefined>(filters.dateRange);

  React.useEffect(() => {
    setDate(filters.dateRange);
  }, [filters.dateRange]);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onFiltersChange({
      ...filters,
      dateRange: newDate,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, [e.target.name]: e.target.value });
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const areFiltersActive = React.useMemo(() => {
    return filters.name || filters.type || filters.dateRange?.from || filters.dateRange?.to;
  }, [filters]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-2" data-testid="heatmap-filter-panel">
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">Filters</h4>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            <ChevronsUpDown className="h-4 w-4" />
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="flex items-center space-x-2 p-4 border-t">
          <Input
            placeholder="Filter by name..."
            name="name"
            value={filters.name || ""}
            onChange={handleInputChange}
            disabled={isDisabled}
            className="max-w-sm"
            data-testid="name-filter-input"
          />
          <Input
            placeholder="Filter by type..."
            name="type"
            value={filters.type || ""}
            onChange={handleInputChange}
            disabled={isDisabled}
            className="max-w-sm"
            data-testid="type-filter-input"
          />
          <DateRangePicker date={date} onDateChange={handleDateChange} disabled={isDisabled} />
          {areFiltersActive && (
            <Button
              variant="secondary"
              onClick={handleClearAll}
              disabled={isDisabled}
              data-testid="clear-all-filters-button"
            >
              Clear All
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

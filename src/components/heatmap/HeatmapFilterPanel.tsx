import * as React from "react";
import { CalendarIcon, ChevronsUpDown, X } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

  const handleClearDates = () => {
    setDate(undefined);
    onFiltersChange({
      ...filters,
      dateRange: undefined,
    });
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const areFiltersActive = React.useMemo(() => {
    return filters.name || filters.type || filters.dateRange?.from || filters.dateRange?.to;
  }, [filters]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full space-y-2">
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
          />
          <Input
            placeholder="Filter by type..."
            name="type"
            value={filters.type || ""}
            onChange={handleInputChange}
            disabled={isDisabled}
            className="max-w-sm"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                disabled={isDisabled}
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
          {date?.from && (
            <Button variant="ghost" onClick={handleClearDates} disabled={isDisabled} className="-ml-8 h-9 w-9 p-0">
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Clear date filter</span>
            </Button>
          )}
          {areFiltersActive && (
            <Button variant="secondary" onClick={handleClearAll} disabled={isDisabled}>
              Clear All
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

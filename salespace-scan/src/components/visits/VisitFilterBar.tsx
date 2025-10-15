import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { adminAPI, User } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  onFilterChange: (filters: {
    managerId?: number;
    agentId?: number;
    fromDate?: string;
    toDate?: string;
    status?: string;
  }) => void;
}

export const VisitFilterBar = ({ onFilterChange }: FilterBarProps) => {
  const [managerId, setManagerId] = useState<number>();
  const [agentId, setAgentId] = useState<number>();
  const [status, setStatus] = useState<string>();
  const [dateRange, setDateRange] = useState<DateRange>();

  // Properly typed queries
  const { data: managers } = useQuery({
    queryKey: ['managers'],
    queryFn: () => adminAPI.getManagers() as Promise<User[]>
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => adminAPI.getAgents() as Promise<User[]>
  });

  const handleApplyFilters = () => {
    onFilterChange({
      managerId,
      agentId,
      fromDate: dateRange?.from?.toISOString(),
      toDate: dateRange?.to?.toISOString(),
      status,
    });
  };

  const handleClearFilters = () => {
    setManagerId(undefined);
    setAgentId(undefined);
    setStatus(undefined);
    setDateRange(undefined);
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-background border rounded-lg">
      <Select value={managerId?.toString()} onValueChange={(value) => setManagerId(Number(value))}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Manager" />
        </SelectTrigger>
        <SelectContent>
          {managers?.map((manager) => (
            <SelectItem key={manager.id} value={manager.id.toString()}>
              {manager.name || manager.phone}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={agentId?.toString()} onValueChange={(value) => setAgentId(Number(value))}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Agent" />
        </SelectTrigger>
        <SelectContent>
          {agents?.map((agent) => (
            <SelectItem key={agent.id} value={agent.id.toString()}>
              {agent.name || agent.phone}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="FLAGGED">Flagged</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={'outline'}
              className={cn(
                'w-[260px] justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <span>
                    {format(dateRange.from, 'LLL dd, y')} -{' '}
                    {format(dateRange.to, 'LLL dd, y')}
                  </span>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters}>Apply Filters</Button>
        <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
      </div>
    </div>
  );
};

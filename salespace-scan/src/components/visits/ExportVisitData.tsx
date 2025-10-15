import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI, CheckIn } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Download, FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

export const ExportVisitData = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [agentId, setAgentId] = useState<string | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents-for-export'],
    queryFn: adminAPI.getAgents,
  });

  const { data: visits = [], isLoading: isLoadingVisits } = useQuery({
    queryKey: ['all-visits-for-export'],
    queryFn: () => adminAPI.getAllVisits(),
  });

  const exportToCsv = () => {
    setIsExporting(true);
    
    // Filter visits based on selected criteria
    let filteredVisits = [...visits];
    
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      filteredVisits = filteredVisits.filter(visit => {
        const visitDate = new Date(visit.timestamp);
        return visitDate >= fromDate;
      });
    }
    
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999); // End of day
      filteredVisits = filteredVisits.filter(visit => {
        const visitDate = new Date(visit.timestamp);
        return visitDate <= toDate;
      });
    }
    
    if (agentId) {
      filteredVisits = filteredVisits.filter(visit => visit.agent?.id.toString() === agentId);
    }
    
    // Transform visits to CSV format
    const csvData = filteredVisits.map(visit => {
      // Format the timestamp
      const visitDate = new Date(visit.timestamp);
      const formattedDate = format(visitDate, 'yyyy-MM-dd');
      const formattedTime = format(visitDate, 'HH:mm:ss');
      
      // Extract brand, category, product information
      const brandName = visit.brand?.name || '';
      const categoryName = visit.category?.name || '';
      const productName = visit.product?.name || '';
      
      // Extract responses if available
      let responsesStr = '';
      if (visit.visit_response?.responses) {
        try {
          responsesStr = JSON.stringify(visit.visit_response.responses);
        } catch (e) {
          responsesStr = 'Error parsing responses';
        }
      }
      
      // Create a CSV row
      return {
        'Agent ID': visit.agent?.id || '',
        'Agent Name': visit.agent?.name || visit.agent?.phone || '',
        'Manager': visit.agent?.manager?.name || '',
        'Visit ID': visit.id,
        'Visit Type': visit.visit_type || '',
        'Visit Date': formattedDate,
        'Visit Time': formattedTime,
        'Shop Name': visit.shop?.name || '',
        'Shop Address': visit.shop?.address || '',
        'Latitude': visit.latitude || '',
        'Longitude': visit.longitude || '',
        'Brand': brandName,
        'Category': categoryName,
        'Product': productName,
        'Notes': visit.notes || '',
        'Responses': responsesStr,
        'Status': visit.status || '',
        'Photo URL': visit.photo_url || ''
      };
    });
    
    // Generate CSV
    const csv = Papa.unparse(csvData);
    
    // Create a blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `visits_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
  };

  if (isLoadingAgents || isLoadingVisits) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-md p-6 bg-background">
        <h2 className="text-xl font-semibold mb-4">Export Visit Data</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </span>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
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
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Agent (Optional)</label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name || agent.phone || `Agent ${agent.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={exportToCsv} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Export to CSV
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md p-6 bg-background">
        <h2 className="text-xl font-semibold mb-4">Data Preview</h2>
        <p className="mb-4 text-muted-foreground">
          This will export the following fields for each visit:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <div className="p-2 bg-muted rounded text-sm">Agent ID</div>
          <div className="p-2 bg-muted rounded text-sm">Agent Name</div>
          <div className="p-2 bg-muted rounded text-sm">Manager</div>
          <div className="p-2 bg-muted rounded text-sm">Visit ID</div>
          <div className="p-2 bg-muted rounded text-sm">Visit Type</div>
          <div className="p-2 bg-muted rounded text-sm">Visit Date</div>
          <div className="p-2 bg-muted rounded text-sm">Visit Time</div>
          <div className="p-2 bg-muted rounded text-sm">Shop Name</div>
          <div className="p-2 bg-muted rounded text-sm">Shop Address</div>
          <div className="p-2 bg-muted rounded text-sm">Latitude</div>
          <div className="p-2 bg-muted rounded text-sm">Longitude</div>
          <div className="p-2 bg-muted rounded text-sm">Brand</div>
          <div className="p-2 bg-muted rounded text-sm">Category</div>
          <div className="p-2 bg-muted rounded text-sm">Product</div>
          <div className="p-2 bg-muted rounded text-sm">Notes</div>
          <div className="p-2 bg-muted rounded text-sm">Responses</div>
          <div className="p-2 bg-muted rounded text-sm">Status</div>
          <div className="p-2 bg-muted rounded text-sm">Photo URL</div>
        </div>
      </div>
    </div>
  );
};

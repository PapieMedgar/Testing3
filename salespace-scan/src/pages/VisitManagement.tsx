import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Users, Filter, Download, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { adminAPI, managerAPI, shopsAPI } from "@/lib/api";
import VisitDetails from "@/components/ui/visit-details";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

const VisitManagement = () => {
  const { user } = useAuth();
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  
  // Function to export visits data to CSV
  const exportToCSV = () => {
    if (!visits.length) {
      toast.error("No visits to export");
      return;
    }
    
    try {
      // Create CSV header row
      const headers = [
        "Visit ID", 
        "Shop Name", 
        "Shop ID", 
        "Agent Name", 
        "Agent ID", 
        "Date & Time", 
        "Status", 
        "Address", 
        "Notes", 
        "Visit Type"
      ];
      
      // Create CSV data rows
      const csvData = visits.map((visit: any) => {
        const shop = shopsMap[visit.shop_id] || {};
        const agent = agentsMap[visit.agent_id] || {};
        const visitType = visit.visit_response?.visit_type || "N/A";
        
        return [
          visit.id,
          shop.name || `Unknown Shop`,
          visit.shop_id,
          agent.name || agent.phone || `Unknown Agent`,
          visit.agent_id,
          new Date(visit.timestamp).toLocaleString(),
          visit.status,
          shop.address || "Address not available",
          visit.notes || "",
          visitType === "individual" ? "Individual Visit" : "Customer Visit"
        ];
      });
      
      // Combine header and data rows
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `visits_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV export successful");
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export CSV");
    }
  };

  // Fetch managers (admin only)
  const { data: managers = [] } = useQuery({
    queryKey: ["managers"],
    queryFn: adminAPI.getManagers,
    enabled: user?.role === "ADMIN",
  });

  // Fetch agents based on context
  const { data: agents = [] } = useQuery({
    queryKey: ["agents", selectedManager],
    queryFn: async () => {
      if (user?.role === "ADMIN") {
        if (selectedManager) {
          const allAgents = await adminAPI.getAgents();
          return allAgents.filter(agent => agent.manager_id === parseInt(selectedManager));
        }
        return adminAPI.getAgents();
      } else if (user?.role === "MANAGER") {
        return managerAPI.getMyAgents();
      }
      return [];
    },
    enabled: user?.role === "ADMIN" || user?.role === "MANAGER",
  });

  // Fetch visits based on filters
  const { data: visits = [], isLoading, refetch: refetchVisits } = useQuery({
    queryKey: ["visits", selectedManager, selectedAgent, dateRange, selectedStatus],
    queryFn: async () => {
      if (user?.role === "ADMIN") {
        // Apply filters for admin
        const filters: any = {};
        
        if (selectedManager) {
          filters.managerId = parseInt(selectedManager);
        }
        
        if (selectedAgent) {
          filters.agentId = parseInt(selectedAgent);
        }
        
        if (dateRange?.from) {
          filters.fromDate = dateRange.from.toISOString();
        }
        
        if (dateRange?.to) {
          filters.toDate = dateRange.to.toISOString();
        }
        
        if (selectedStatus) {
          filters.status = selectedStatus;
        }
        
        return adminAPI.getAllVisits(filters);
      } else if (user?.role === "MANAGER") {
        if (selectedAgent) {
          // Apply filters for specific agent
          const filters: any = {};
          
          if (dateRange?.from) {
            filters.fromDate = dateRange.from.toISOString();
          }
          
          if (dateRange?.to) {
            filters.toDate = dateRange.to.toISOString();
          }
          
          if (selectedStatus) {
            filters.status = selectedStatus;
          }
          
          return managerAPI.getAgentCheckIns(parseInt(selectedAgent), filters);
        }
        
        // Get all visits for manager's agents with filters
        const filters: any = {};
        
        if (dateRange?.from) {
          filters.fromDate = dateRange.from.toISOString();
        }
        
        if (dateRange?.to) {
          filters.toDate = dateRange.to.toISOString();
        }
        
        if (selectedStatus) {
          filters.status = selectedStatus;
        }
        
        return managerAPI.getTeamVisits(filters);
      }
      return [];
    },
    enabled: user?.role === "ADMIN" || user?.role === "MANAGER",
  });

  // Fetch shops for reference
  const { data: shops = [] } = useQuery({
    queryKey: ["shops"],
    queryFn: shopsAPI.getAll,
  });

  // Create lookup maps
  const shopsMap = shops.reduce((acc: Record<number, any>, shop: any) => {
    acc[shop.id] = shop;
    return acc;
  }, {});

  const agentsMap = agents.reduce((acc: Record<number, any>, agent: any) => {
    acc[agent.id] = agent;
    return acc;
  }, {});

  if (user?.role !== "ADMIN" && user?.role !== "MANAGER") {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Visit management is only available for managers and administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Visit Management</h1>
          <p className="text-muted-foreground">
            {user?.role === "ADMIN"
              ? "View and manage all visits across the system"
              : "Monitor visits from your assigned agents"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => refetchVisits()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={exportToCSV}
            disabled={visits.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                {user?.role === "ADMIN" && (
                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Select
                      value={selectedManager}
                      onValueChange={setSelectedManager}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Managers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Managers</SelectItem>
                        {managers.map((manager: any) => (
                          <SelectItem key={manager.id} value={manager.id.toString()}>
                            {manager.name || manager.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="agent">Agent</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Agents</SelectItem>
                      {agents.map((agent: any) => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                          {agent.name || agent.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <DatePickerWithRange
                    date={dateRange}
                    onDateChange={setDateRange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="FLAGGED">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {/* Visits List */}
      <Card>
        <CardHeader>
          <CardTitle>Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No visits found</h3>
              <p className="text-muted-foreground">
                {selectedAgent || selectedManager || dateRange || selectedStatus
                  ? "Try adjusting your filters"
                  : "No visits have been recorded yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((visit: any) => {
                // Compose details for VisitDetails component (logic matches VisitLog)
                const shop = shopsMap[visit.shop_id];
                const agent = agentsMap[visit.agent_id];
                const response = visit.visit_response;
                // Extract brand/category/product/contact from response if present
                let brandRaw = visit.brand?.name;
                let categoryRaw = visit.category?.name;
                let productRaw = visit.product?.name;
                
                // If not available directly, try to extract from response
                if (!brandRaw) {
                  brandRaw = response?.responses?.industry || response?.responses?.brand || response?.responses?.brandName;
                }
                
                if (!categoryRaw) {
                  categoryRaw = response?.responses?.category || response?.responses?.categoryName;
                }
                
                if (!productRaw) {
                  productRaw = response?.responses?.product || response?.responses?.productName;
                }
                
                const brand = typeof brandRaw === 'string' ? brandRaw : brandRaw ? String(brandRaw) : undefined;
                const category = typeof categoryRaw === 'string' ? categoryRaw : categoryRaw ? String(categoryRaw) : undefined;
                const product = typeof productRaw === 'string' ? productRaw : productRaw ? String(productRaw) : undefined;
                const contactName = response?.responses?.consumerName || response?.responses?.contactName;
                const contactPhone = response?.responses?.cellphoneNumber || response?.responses?.contactPhone;
                // Fallbacks for visit type
                const visitType = response?.visit_type;
                // Compose survey responses
                let surveyResponses = [];
                if (response && response.responses) {
                  surveyResponses = Object.entries(response.responses).map(([question, answer]) => ({ question, answer }));
                }
                // Compose photos (if any)
                let photos: any[] = [];
                if (response?.responses?.photos) {
                  if (Array.isArray(response.responses.photos)) {
                    photos = response.responses.photos.map((data: string) => ({ type: 'photo', data }));
                  } else if (typeof response.responses.photos === 'object') {
                    photos = Object.entries(response.responses.photos).map(([type, data]: [string, any]) => ({ type, data }));
                  }
                }
                // Get agent name if available
                const agentName = agent?.name || agent?.phone || '';
                // Determine shop name logic
                let shopName = '';
                if (shop?.name) {
                  shopName = shop.name;
                } else if (typeof response?.visit_type === 'string' && response.visit_type.toLowerCase() === 'individual' && agentName) {
                  shopName = agentName;
                } else {
                  shopName = `Shop #${visit.shop_id}`;
                }
                const shopAddress = shop?.address || 'Unknown address';
                return (
                  <div key={visit.id} className="p-4 border rounded-lg">
                    <VisitDetails
                      visit={{
                        id: String(visit.id),
                        shopId: String(visit.shop_id),
                        shopName,
                        agentId: String(visit.agent_id),
                        agentName,
                        timestamp: visit.timestamp,
                        location: shopAddress,
                        visitType,
                        brand,
                        category,
                        product,
                        notes: visit.notes,
                        contactName,
                        contactPhone,
                        surveyResponses,
                        photos,
                      }}
                    />
                    <div className="shrink-0 flex flex-col items-end gap-2 mt-2">
                      <Badge
                        variant={
                          visit.status === "APPROVED"
                            ? "default"
                            : visit.status === "FLAGGED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {visit.status}
                      </Badge>
                      {user?.role === "MANAGER" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() =>
                              managerAPI.updateCheckInStatus(visit.id, "APPROVED")
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() =>
                              managerAPI.updateCheckInStatus(visit.id, "FLAGGED")
                            }
                          >
                            Flag
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitManagement;

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { managerAPI, shopsAPI, User, CheckIn, API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Shop {
  id: number;
  name: string;
  address?: string;
}
import { 
  Users, 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';
import { format, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AgentStats {
  totalVisits: number;
  todayVisits: number;
  weekVisits: number;
  monthVisits: number;
  lastVisit?: CheckIn;
  avgVisitsPerDay: number;
}

const ManagerVisitLog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVisit, setSelectedVisit] = useState<CheckIn | null>(null);
  const [isVisitDetailOpen, setIsVisitDetailOpen] = useState(false);

  // Fetch my agents
  const { data: agents = [], isLoading: isLoadingAgents, refetch: refetchAgents } = useQuery({
    queryKey: ['manager-agents'],
    queryFn: managerAPI.getMyAgents,
    enabled: user?.role === 'MANAGER',
  });

  // Fetch team visits with filters
  const { data: teamVisits = [], isLoading: isLoadingVisits, refetch: refetchVisits } = useQuery({
    queryKey: ['manager-team-visits', selectedAgent, dateRange, selectedStatus],
    queryFn: async () => {
      const filters: {
        fromDate?: string;
        toDate?: string;
        status?: string;
      } = {};
      
      if (dateRange?.from) {
        filters.fromDate = dateRange.from.toISOString();
      }
      
      if (dateRange?.to) {
        filters.toDate = dateRange.to.toISOString();
      }
      
      if (selectedStatus !== 'all') {
        filters.status = selectedStatus.toUpperCase();
      }

      if (selectedAgent !== 'all') {
        // Get visits for specific agent
        return managerAPI.getAgentCheckIns(parseInt(selectedAgent), filters);
      }
      
      // Get all team visits
      return managerAPI.getTeamVisits(filters);
    },
    enabled: user?.role === 'MANAGER',
  });

  // Fetch shops for display
  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsAPI.getAll,
    enabled: user?.role === 'MANAGER',
  });

  // Create shops lookup
  const shopsMap = useMemo(() => {
    const map: Record<number, { id: number; name: string; address: string }> = {};
    shops.forEach(shop => {
      map[shop.id] = shop;
    });
    return map;
  }, [shops]);

  // Create agents lookup
  const agentsMap = useMemo(() => {
    const map: Record<number, User> = {};
    agents.forEach(agent => {
      map[agent.id] = agent;
    });
    return map;
  }, [agents]);

  // Calculate agent statistics
  const agentStats = useMemo(() => {
    const stats: Record<number, AgentStats> = {};
    
    agents.forEach(agent => {
      const agentVisits = teamVisits.filter((visit: CheckIn) => visit.agent_id === agent.id);
      const now = new Date();
      
      const todayVisits = agentVisits.filter((visit: CheckIn) => 
        isToday(new Date(visit.timestamp))
      ).length;
      
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const weekVisits = agentVisits.filter((visit: CheckIn) => {
        const visitDate = new Date(visit.timestamp);
        return visitDate >= weekStart && visitDate <= weekEnd;
      }).length;
      
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthVisits = agentVisits.filter((visit: CheckIn) => {
        const visitDate = new Date(visit.timestamp);
        return visitDate >= monthStart && visitDate <= monthEnd;
      }).length;
      
      const lastVisit = agentVisits.sort((a: CheckIn, b: CheckIn) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      
      const avgVisitsPerDay = monthVisits / new Date().getDate();
      
      stats[agent.id] = {
        totalVisits: agentVisits.length,
        todayVisits,
        weekVisits,
        monthVisits,
        lastVisit,
        avgVisitsPerDay: Math.round(avgVisitsPerDay * 10) / 10
      };
    });
    
    return stats;
  }, [agents, teamVisits]);

  // Export data to CSV
  const exportToCSV = () => {
    if (!teamVisits.length) {
      toast.error("No visits to export");
      return;
    }
    
    try {
      const headers = [
        "Visit ID", 
        "Agent Name", 
        "Shop Name", 
        "Date & Time", 
        "Status", 
        "Address", 
        "Notes"
      ];
      
      const csvData = teamVisits.map((visit: CheckIn) => {
        const agent = agentsMap[visit.agent_id];
        const shop: Shop = shopsMap[visit.shop_id] || { id: 0, name: 'Unknown Shop', address: 'No address' };
        
        return [
          visit.id,
          agent?.name || agent?.phone || 'Unknown Agent',
          shop.name || 'Unknown Shop',
          new Date(visit.timestamp).toLocaleString(),
          visit.status,
          shop.address || 'No address',
          visit.notes || ''
        ];
      });
      
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `team_visits_${new Date().toISOString().split('T')[0]}.csv`);
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

  const handleViewVisitDetails = (visit: CheckIn) => {
    setSelectedVisit(visit);
    setIsVisitDetailOpen(true);
  };

  const closeVisitDetails = () => {
    setSelectedVisit(null);
    setIsVisitDetailOpen(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'FLAGGED':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatVisitTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return `Today, ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  if (user?.role !== 'MANAGER') {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">This page is only available for managers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-1">Team Visit Log</h1>
          <p className="text-muted-foreground">
            Monitor and track visits from your assigned agents
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              refetchAgents();
              refetchVisits();
            }}
            disabled={isLoadingAgents || isLoadingVisits}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingAgents || isLoadingVisits ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={exportToCSV}
            disabled={!teamVisits.length}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Agent Filter */}
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name || agent.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
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

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAgent('all');
                setSelectedStatus('all');
                setDateRange(undefined);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="visits">Visit Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamVisits.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {teamVisits.filter((visit: CheckIn) => isToday(new Date(visit.timestamp))).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {teamVisits.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No visits recorded</h3>
                  <p className="text-muted-foreground">
                    Your team hasn't recorded any visits yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamVisits
                    .sort((a: CheckIn, b: CheckIn) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5)
                    .map((visit: CheckIn) => {
                      const agent = agentsMap[visit.agent_id];
                      const shop = shopsMap[visit.shop_id];
                      
                      return (
                        <div key={visit.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                          <div className="flex items-center gap-4">
                            {visit.photo_path && (
                              <img 
                                src={`${API_BASE_URL}/uploads/${visit.photo_path}`}
                                alt="Visit photo"
                                className="w-12 h-12 object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{shop?.name || 'Unknown Shop'}</h4>
                                <Badge variant={getStatusBadgeVariant(visit.status)}>
                                  {visit.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                by {agent?.name || agent?.phone || 'Unknown Agent'} • {formatVisitTime(visit.timestamp)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewVisitDetails(visit)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid gap-6">
            {agents.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No agents assigned</h3>
                    <p className="text-muted-foreground">
                      Contact your administrator to assign agents to your team
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              agents.map((agent) => {
                const stats = agentStats[agent.id] || {
                  totalVisits: 0,
                  todayVisits: 0,
                  weekVisits: 0,
                  monthVisits: 0,
                  avgVisitsPerDay: 0
                };
                
                return (
                  <Card key={agent.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {agent.name || agent.phone}
                            {stats.lastVisit && isToday(new Date(stats.lastVisit.timestamp)) && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Active Today
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {agent.phone}
                            {stats.lastVisit && (
                              <span className="block mt-1">
                                Last active: {formatVisitTime(stats.lastVisit.timestamp)}
                              </span>
                            )}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/agent/${agent.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.totalVisits}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{stats.todayVisits}</div>
                          <div className="text-xs text-muted-foreground">Today</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{stats.weekVisits}</div>
                          <div className="text-xs text-muted-foreground">This Week</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{stats.monthVisits}</div>
                          <div className="text-xs text-muted-foreground">This Month</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-teal-600">{stats.avgVisitsPerDay}</div>
                          <div className="text-xs text-muted-foreground">Avg/Day</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Visit Details Tab */}
        <TabsContent value="visits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visit Details</CardTitle>
            </CardHeader>
            <CardContent>
              {teamVisits.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No visits found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamVisits
                    .sort((a: CheckIn, b: CheckIn) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((visit: CheckIn) => {
                      const agent = agentsMap[visit.agent_id];
                      const shop = shopsMap[visit.shop_id];
                      
                      return (
                        <div key={visit.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                              {visit.photo_path && (
                                <img 
                                  src={`${API_BASE_URL}/uploads/${visit.photo_path}`}
                                  alt="Visit photo"
                                  className="w-16 h-16 object-cover rounded-lg"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <h4 className="font-medium text-lg">{shop?.name || 'Unknown Shop'}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {shop?.address || 'No address available'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusBadgeVariant(visit.status)}>
                                {visit.status}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewVisitDetails(visit)}
                                title="View detailed visit information"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Agent:</span>
                              <p>{agent?.name || agent?.phone || 'Unknown Agent'}</p>
                            </div>
                            <div>
                              <span className="font-medium">Visit Time:</span>
                              <p>{formatVisitTime(visit.timestamp)}</p>
                            </div>
                            <div>
                              <span className="font-medium">Visit ID:</span>
                              <p>#{visit.id}</p>
                            </div>
                          </div>
                          
                          {visit.notes && (
                            <div>
                              <span className="font-medium text-sm">Notes:</span>
                              <p className="text-sm text-muted-foreground mt-1">{visit.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Visit Details Modal */}
      <Dialog open={isVisitDetailOpen} onOpenChange={setIsVisitDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visit Details</DialogTitle>
            <DialogDescription>
              Complete information about this visit
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisit && (
            <div className="space-y-6">
              {/* Visit Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {shops?.find(s => s.id === selectedVisit.shop_id)?.name || 'Unknown Shop'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Visit ID: #{selectedVisit.id}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedVisit.status)} className="text-sm">
                  {selectedVisit.status}
                </Badge>
              </div>

              {/* Visit Photo */}
              {selectedVisit.photo_path && (
                <div>
                  <h4 className="font-medium mb-2">Visit Photo</h4>
                  <img
                    src={`${API_BASE_URL}/uploads/${selectedVisit.photo_path}`}
                    alt="Visit photo"
                    className="w-full max-w-md h-64 object-cover rounded-lg border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
              )}

              {/* Visit Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Agent Information</h4>
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="font-medium">Name:</span>
                        <p className="text-sm">{agents?.find(a => a.id === selectedVisit.agent_id)?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>
                        <p className="text-sm">{agents?.find(a => a.id === selectedVisit.agent_id)?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Visit Timing</h4>
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="font-medium">Date & Time:</span>
                        <p className="text-sm">{formatVisitTime(selectedVisit.timestamp)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <p className="text-sm">Check-in logged</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Shop Information</h4>
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="font-medium">Shop Name:</span>
                        <p className="text-sm">{shops?.find(s => s.id === selectedVisit.shop_id)?.name || 'Unknown Shop'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Address:</span>
                        <p className="text-sm">{shops?.find(s => s.id === selectedVisit.shop_id)?.address || 'No address available'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Visit Status</h4>
                    <div className="mt-2">
                      <Badge variant={getStatusBadgeVariant(selectedVisit.status)}>
                        {selectedVisit.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Notes */}
              {selectedVisit.notes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Visit Notes</h4>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{selectedVisit.notes}</p>
                  </div>
                </div>
              )}

              {/* Additional Visit Data */}
              {selectedVisit.photo_base64 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Additional Photos</h4>
                  <div className="mt-2">
                    <img
                      src={selectedVisit.photo_base64}
                      alt="Additional visit photo"
                      className="w-full max-w-md h-64 object-cover rounded-lg border"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={closeVisitDetails}>
                  Close
                </Button>
                <Button onClick={() => {
                  // TODO: Add edit functionality if needed
                  toast.info("Edit functionality coming soon");
                }}>
                  Edit Visit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerVisitLog;

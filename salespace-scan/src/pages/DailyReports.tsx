import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  Target, 
  CheckCircle, 
  Clock,
  MapPin,
  Loader2,
  FileSpreadsheet,
  UserCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface DailyStatistics {
  date: string;
  total_visits: number;
  approved_visits: number;
  pending_visits: number;
  flagged_visits: number;
  unique_shops_visited: number;
  average_visit_duration_minutes: number;
  agent_statistics: Array<{
    agent_id: number;
    agent_name: string;
    total_visits: number;
    approved_visits: number;
    pending_visits: number;
    flagged_visits: number;
    unique_shops: number;
    total_duration_minutes: number;
    average_duration_minutes: number;
  }>;
  shop_statistics: Array<{
    shop_id: number;
    shop_name: string;
    shop_address: string;
    visit_count: number;
    unique_agents: number;
    latest_visit: string;
  }>;
  hourly_distribution: Array<{
    hour: number;
    visit_count: number;
  }>;
}

interface Agent {
  id: number;
  name: string;
  phone: string;
  role: string;
  manager_id?: number;
}

interface Manager {
  id: number;
  name: string;
  phone: string;
  role: string;
}

const DailyReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [groupByManager, setGroupByManager] = useState(false);

  // Check admin access
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch available agents
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ['daily-reports-agents'],
    queryFn: adminAPI.getAvailableAgents,
  });

  // Fetch available managers
  const { data: managers = [], isLoading: isLoadingManagers } = useQuery({
    queryKey: ['daily-reports-managers'],
    queryFn: adminAPI.getAvailableManagers,
  });

  // Fetch daily statistics
  const { data: statistics, isLoading: isLoadingStats, error } = useQuery({
    queryKey: ['daily-statistics', selectedDate, selectedAgentIds],
    queryFn: () => adminAPI.getDailyStatistics(selectedDate, selectedAgentIds),
    enabled: !!selectedDate,
  });

  // Handle agent selection
  const handleAgentToggle = (agentId: number) => {
    setSelectedAgentIds(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  // Handle manager selection
  const handleManagerToggle = async (managerId: number) => {
    if (selectedManagerIds.includes(managerId)) {
      setSelectedManagerIds(prev => prev.filter(id => id !== managerId));
      // Remove agents under this manager
      try {
        const agentsUnderManager = await adminAPI.getAgentsByManager(managerId);
        const agentIds = agentsUnderManager.map((agent: Agent) => agent.id);
        setSelectedAgentIds(prev => prev.filter(id => !agentIds.includes(id)));
      } catch (error) {
        console.error('Failed to get agents by manager:', error);
      }
    } else {
      setSelectedManagerIds(prev => [...prev, managerId]);
      // Add agents under this manager
      try {
        const agentsUnderManager = await adminAPI.getAgentsByManager(managerId);
        const agentIds = agentsUnderManager.map((agent: Agent) => agent.id);
        setSelectedAgentIds(prev => [...new Set([...prev, ...agentIds])]);
      } catch (error) {
        console.error('Failed to get agents by manager:', error);
        toast.error('Failed to load agents for this manager');
      }
    }
  };

  // Handle select all agents
  const handleSelectAllAgents = () => {
    if (selectedAgentIds.length === agents.length) {
      setSelectedAgentIds([]);
      setSelectedManagerIds([]);
    } else {
      setSelectedAgentIds(agents.map((agent: Agent) => agent.id));
      setSelectedManagerIds(managers.map((manager: Manager) => manager.id));
    }
  };

  // Handle Excel download
  const handleDownloadExcel = async () => {
    setIsDownloading(true);
    try {
      const blob = await adminAPI.downloadDailyExcelReport(selectedDate, selectedAgentIds);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daily_report_${selectedDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error('Failed to download Excel report:', error);
      toast.error('Failed to download Excel report');
    } finally {
      setIsDownloading(false);
    }
  };

  // Get agent display name
  const getAgentName = (agentId: number) => {
    const agent = agents.find((a: Agent) => a.id === agentId);
    return agent?.name || `Agent ${agentId}`;
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Reports</h1>
          <p className="text-muted-foreground">Generate and download daily performance reports</p>
        </div>
        <Button 
          onClick={handleDownloadExcel} 
          disabled={isDownloading || !statistics}
          className="bg-green-600 hover:bg-green-700"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 mr-2" />
          )}
          Download Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selection */}
          <div className="grid gap-2">
            <Label htmlFor="date">Report Date</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-fit"
            />
          </div>

          <Separator />

          {/* Member Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select Members</Label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAllAgents}
              >
                {selectedAgentIds.length === agents.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Group by Manager Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="groupByManager"
                checked={groupByManager}
                onCheckedChange={(checked) => setGroupByManager(!!checked)}
              />
              <Label htmlFor="groupByManager" className="text-sm">
                Group by Manager
              </Label>
            </div>

            {/* Member Selection UI */}
            {groupByManager ? (
              // Group by Manager View
              <div className="space-y-4">
                {isLoadingManagers ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  managers.map((manager: Manager) => (
                    <div key={manager.id} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Checkbox
                          id={`manager-${manager.id}`}
                          checked={selectedManagerIds.includes(manager.id)}
                          onCheckedChange={() => handleManagerToggle(manager.id)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`manager-${manager.id}`} className="font-medium">
                            {manager.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{manager.phone}</p>
                        </div>
                        <Badge variant="secondary">Manager</Badge>
                      </div>
                      
                      {/* Show agents under this manager */}
                      <div className="ml-6 space-y-2">
                        {agents
                          .filter((agent: Agent) => agent.manager_id === manager.id)
                          .map((agent: Agent) => (
                            <div key={agent.id} className="flex items-center space-x-3">
                              <Checkbox
                                id={`agent-${agent.id}`}
                                checked={selectedAgentIds.includes(agent.id)}
                                onCheckedChange={() => handleAgentToggle(agent.id)}
                              />
                              <div className="flex-1">
                                <Label htmlFor={`agent-${agent.id}`} className="text-sm">
                                  {agent.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">{agent.phone}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">Agent</Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Flat Agent List View
              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {isLoadingAgents ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  agents.map((agent: Agent) => (
                    <div key={agent.id} className="flex items-center space-x-3 p-2 border rounded">
                      <Checkbox
                        id={`agent-${agent.id}`}
                        checked={selectedAgentIds.includes(agent.id)}
                        onCheckedChange={() => handleAgentToggle(agent.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`agent-${agent.id}`} className="font-medium">
                          {agent.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">{agent.phone}</p>
                      </div>
                      <Badge variant="outline">Agent</Badge>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedAgentIds.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  {selectedAgentIds.length} member{selectedAgentIds.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Display */}
      {isLoadingStats ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading daily statistics...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Failed to load statistics</p>
              <p className="text-sm text-muted-foreground">Please check your connection and try again</p>
            </div>
          </CardContent>
        </Card>
      ) : statistics ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              title="Total Visits"
              value={statistics.total_visits}
              icon={MapPin}
              description={`on ${new Date(selectedDate).toLocaleDateString()}`}
            />
            <StatCard
              title="Approved Visits"
              value={statistics.approved_visits}
              icon={CheckCircle}
              description={`${((statistics.approved_visits / statistics.total_visits) * 100 || 0).toFixed(1)}% approval rate`}
            />
            <StatCard
              title="Unique Shops"
              value={statistics.unique_shops_visited}
              icon={Target}
              description="shops visited"
            />
            <StatCard
              title="Avg Duration"
              value={`${Math.round(statistics.average_visit_duration_minutes)}m`}
              icon={Clock}
              description="per visit"
            />
          </div>

          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Agent Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statistics.agent_statistics.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No agent data available for the selected date and filters.
                </p>
              ) : (
                <div className="space-y-4">
                  {statistics.agent_statistics.map((agentStat) => (
                    <div key={agentStat.agent_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{agentStat.agent_name}</h4>
                          <p className="text-sm text-muted-foreground">Agent ID: {agentStat.agent_id}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={agentStat.approved_visits > 0 ? "default" : "secondary"}>
                            {agentStat.total_visits} visits
                          </Badge>
                          {agentStat.approved_visits > 0 && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {agentStat.approved_visits} approved
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Visits</p>
                          <p className="font-medium">{agentStat.total_visits}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unique Shops</p>
                          <p className="font-medium">{agentStat.unique_shops}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Time</p>
                          <p className="font-medium">{Math.round(agentStat.total_duration_minutes)}m</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Duration</p>
                          <p className="font-medium">{Math.round(agentStat.average_duration_minutes)}m</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shop Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Shop Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statistics.shop_statistics.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No shop activity data available for the selected date and filters.
                </p>
              ) : (
                <div className="space-y-3">
                  {statistics.shop_statistics.map((shopStat) => (
                    <div key={shopStat.shop_id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <h4 className="font-medium">{shopStat.shop_name}</h4>
                        <p className="text-sm text-muted-foreground">{shopStat.shop_address}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-2 mb-1">
                          <Badge variant="outline">{shopStat.visit_count} visits</Badge>
                          <Badge variant="secondary">{shopStat.unique_agents} agents</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Latest: {new Date(shopStat.latest_visit).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Distribution */}
          {statistics.hourly_distribution && statistics.hourly_distribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Hourly Visit Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics.hourly_distribution.map((hourStat) => (
                    <div key={hourStat.hour} className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {hourStat.hour.toString().padStart(2, '0')}:00 - {(hourStat.hour + 1).toString().padStart(2, '0')}:00
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(hourStat.visit_count / Math.max(...statistics.hourly_distribution.map(h => h.visit_count))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">
                          {hourStat.visit_count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Select a date and members to view statistics</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyReports;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  MessageSquare,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { managerAPI, User, CheckIn } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";
import { format, isToday } from "date-fns";
import { toast } from "sonner";

const TeamOverview = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to format last active time
  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  // Fetch my agents
  const { data: agents = [], isLoading: isLoadingAgents, refetch: refetchAgents } = useQuery({
    queryKey: ['manager-agents'],
    queryFn: managerAPI.getMyAgents,
    enabled: user?.role === 'MANAGER',
  });

  // Fetch team visits for calculating performance
  const { data: teamVisits = [], isLoading: isLoadingVisits } = useQuery({
    queryKey: ['manager-team-visits'],
    queryFn: () => managerAPI.getTeamVisits(),
    enabled: user?.role === 'MANAGER',
  });

  // Calculate agent performance metrics
  const agentMetrics = useMemo(() => {
    return agents.map((agent: User) => {
      const agentVisits = Array.isArray(teamVisits) ? teamVisits.filter((visit: CheckIn) => visit.agent_id === agent.id) : [];
      const todayVisits = agentVisits.filter((visit: CheckIn) => isToday(new Date(visit.timestamp)));
      const completedVisits = todayVisits.filter((visit: CheckIn) => visit.status === 'APPROVED');
      
      // Calculate performance based on visit completion rate (last 30 days)
      const monthlyVisits = agentVisits.filter((visit: CheckIn) => {
        const visitDate = new Date(visit.timestamp);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return visitDate >= thirtyDaysAgo;
      });
      
      const monthlyCompleted = monthlyVisits.filter((visit: CheckIn) => 
        visit.status === 'APPROVED'
      );
      
      const performance = monthlyVisits.length > 0 ? 
        Math.round((monthlyCompleted.length / monthlyVisits.length) * 100) : 0;

      // Determine status based on recent activity
      const lastVisit = agentVisits.length > 0 ? 
        new Date(Math.max(...agentVisits.map((v: CheckIn) => new Date(v.timestamp).getTime()))) : null;
      
      const isActive = lastVisit ? 
        (new Date().getTime() - lastVisit.getTime()) < 4 * 60 * 60 * 1000 : false; // Active if last visit within 4 hours
      
      const lastActiveText = lastVisit ? 
        formatLastActive(lastVisit) : 'No recent activity';

      return {
        ...agent,
        visitsToday: todayVisits.length,
        visitsCompleted: completedVisits.length,
        performance,
        status: isActive ? 'Active' : 'Inactive',
        lastActive: lastActiveText,
        totalVisits: agentVisits.length,
        monthlyVisits: monthlyVisits.length,
        monthlyCompleted: monthlyCompleted.length
      };
    });
  }, [agents, teamVisits]);

  // Filter agents based on search term
  const filteredAgents = agentMetrics.filter((agent) =>
    agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate team statistics
  const totalAgents = agentMetrics.length;
  const activeAgents = agentMetrics.filter(a => a.status === "Active").length;
  const avgPerformance = totalAgents > 0 ? 
    Math.round(agentMetrics.reduce((sum, a) => sum + a.performance, 0) / totalAgents) : 0;

  const todayVisits = agentMetrics.reduce((sum, a) => sum + a.visitsToday, 0);
  const completedVisits = agentMetrics.reduce((sum, a) => sum + a.visitsCompleted, 0);

  // Loading state
  if (isLoadingAgents || isLoadingVisits) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Overview</h1>
            <p className="text-muted-foreground">
              Loading your team data...
            </p>
          </div>
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-12 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Check if user is manager
  if (user?.role !== 'MANAGER') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Manager Access Required</h2>
          <p className="text-muted-foreground">
            You need manager privileges to view team overview.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    return status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getPerformanceIcon = (performance: number) => {
    return performance >= 85 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return "text-green-600";
    if (performance >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Overview</h1>
          <p className="text-muted-foreground">
            Manage and monitor your field agents
          </p>
        </div>
        <Button onClick={() => refetchAgents()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">In your team</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}</div>
            <p className="text-xs text-muted-foreground">{Math.round((activeAgents/totalAgents)*100)}% online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedVisits}/{todayVisits}</div>
            <p className="text-xs text-muted-foreground">{Math.round((completedVisits/todayVisits)*100)}% completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerformance}%</div>
            <p className="text-xs text-muted-foreground">Team average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Today's Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search agents..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => refetchAgents()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Agents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Team</CardTitle>
              <CardDescription>
                Detailed view of all agents under your management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Total Visits</TableHead>
                    <TableHead>Today's Progress</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="w-8 h-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm ? 'No agents found matching your search.' : 'No agents assigned to your team yet.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {agent.name ? agent.name.split(' ').map(n => n[0]).join('').toUpperCase() : agent.phone?.slice(-2) || 'AG'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{agent.name || 'Unnamed Agent'}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {agent.phone}
                              </div>
                              {agent.email && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {agent.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {agent.region || 'Not assigned'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{agent.totalVisits || 0} total visits</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{agent.visitsCompleted}/{agent.visitsToday}</span>
                            {agent.visitsToday > 0 && (
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-blue-500"
                                  style={{ width: `${(agent.visitsCompleted / agent.visitsToday) * 100}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPerformanceIcon(agent.performance)}
                            <span className={getPerformanceColor(agent.performance)}>
                              {agent.performance}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={getStatusColor(agent.status)}>
                              {agent.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{agent.lastActive}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span>
                              {agent.created_at ? format(new Date(agent.created_at), 'MMM dd, yyyy') : 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast.info("Agent profile view coming soon")}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Messaging feature coming soon")}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`tel:${agent.phone}`)}>
                                <Phone className="w-4 h-4 mr-2" />
                                Call Agent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Edit agent details coming soon")}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Rankings</CardTitle>
                <CardDescription>Based on 30-day visit success rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAgents
                    .sort((a, b) => b.performance - a.performance)
                    .map((agent, index) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {agent.name ? agent.name.split(' ').map(n => n[0]).join('').toUpperCase() : agent.phone?.slice(-2) || 'AG'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{agent.name || 'Unnamed Agent'}</span>
                            <div className="text-sm text-muted-foreground">
                              {agent.monthlyCompleted}/{agent.monthlyVisits} visits completed
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPerformanceIcon(agent.performance)}
                          <span className={getPerformanceColor(agent.performance)}>
                            {agent.performance}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Team performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">High Performers (90%+)</span>
                    <span className="font-medium">{filteredAgents.filter(a => a.performance >= 90).length} agents</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-600">Good Performers (80-89%)</span>
                    <span className="font-medium">{filteredAgents.filter(a => a.performance >= 80 && a.performance < 90).length} agents</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-600">Needs Improvement (&lt;80%)</span>
                    <span className="font-medium">{filteredAgents.filter(a => a.performance < 80).length} agents</span>
                  </div>
                  {filteredAgents.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No performance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {filteredAgents.length === 0 ? (
              <div className="col-span-3 text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Activity Data</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'No agents match your search criteria.' : 'No agents are currently assigned to your team.'}
                </p>
              </div>
            ) : (
              filteredAgents.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {agent.name ? agent.name.split(' ').map(n => n[0]).join('').toUpperCase() : agent.phone?.slice(-2) || 'AG'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{agent.name || 'Unnamed Agent'}</CardTitle>
                        <CardDescription className="text-sm">{agent.phone}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Visits Progress</span>
                      <span className="text-sm font-medium">{agent.visitsCompleted}/{agent.visitsToday}</span>
                    </div>
                    {agent.visitsToday > 0 ? (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${(agent.visitsCompleted / agent.visitsToday) * 100}%` }}
                        ></div>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-gray-300 w-0"></div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="w-3 h-3" />
                      Performance: {agent.performance}%
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {agent.lastActive}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamOverview;

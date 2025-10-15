import { 
  Calendar,
  MapPin,
  Target,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Award,
  TrendingDown,
  AlertCircle
} from "lucide-react"
import { API_BASE_URL, type User } from "@/lib/api"
import { CreateGoalDialog } from "@/components/goals/CreateGoalDialog"

interface Visit {
  id: number;
  shop_id: number;
  agent_id: number;
  timestamp: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'FLAGGED';
  photo_path?: string;
  shop?: {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  agent?: {
    id: number;
    name?: string;
    phone: string;
  };
}

interface DashboardData {
  visits?: Visit[];
  agents?: User[];
  teamVisits?: Visit[];
  teamGoals?: Goal[];
  managers?: User[];
  users?: User[];
}

interface TeamStats {
  agents: User[];
  teamVisits: Visit[];
  teamGoals: Goal[];
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PersonalGoals } from "@/components/goals/PersonalGoals"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatCard } from "@/components/ui/stat-card"
import { useAuth } from "@/hooks/use-auth"
import { useQuery } from "@tanstack/react-query"
import { agentAPI, managerAPI, adminAPI } from "@/lib/api"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

interface Goal {
  id: number;
  title: string;
  description: string;
  type: string;
  target: number;
  current: number;
  assignee_id: number;
  assignee_name: string;
  assignee_type: string;
  deadline: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleStartVisit = () => {
    navigate('/start-visit');
  };

  // Goals management state
  const [isCreateGoalDialogOpen, setIsCreateGoalDialogOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalType, setNewGoalType] = useState("visits");
  const [newGoalAssignee, setNewGoalAssignee] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");


  // Fetch data based on user role
  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ['dashboard', user?.role, user?.id],
    queryFn: async () => {
      switch (user?.role) {
        case 'AGENT': {
          const visits = await agentAPI.getMyVisits();
          return { visits };
        }
        case 'MANAGER': {
          const data = await managerAPI.getTeamStats();
          return data as TeamStats;
        }
        case 'ADMIN': {
          const [managers, allAgents, allUsers] = await Promise.all([
            adminAPI.getManagers(),
            adminAPI.getAgents(),
            adminAPI.getAllUsers()
          ]);
          return { managers, agents: allAgents, users: allUsers };
        }
        default:
          return null;
      }
    },
    enabled: !!user,
    retry: 3,
    retryDelay: 1000,
    refetchInterval: user?.role === 'MANAGER' ? 30000 : false // Refresh manager data every 30 seconds
  });

  // Only use real API data for dashboard
  const dashboardData: DashboardData = apiData || {};

  // Goals management functions
  const handleCreateGoal = () => {
    if (!newGoalTitle.trim() || !newGoalTarget.trim() || !newGoalAssignee.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // In a real app, this would call an API
    toast.success("Goal created successfully!");
    setIsCreateGoalDialogOpen(false);
    setNewGoalTitle("");
    setNewGoalDescription("");
    setNewGoalTarget("");
    setNewGoalType("visits");
    setNewGoalAssignee("");
    setNewGoalDeadline("");
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalProgress = (current_value: number, target_value: number) => {
    return Math.min(100, Math.round((current_value / target_value) * 100));
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'visits': return <MapPin className="w-4 h-4" />;
      case 'customers': return <Users className="w-4 h-4" />;
      case 'revenue': return <TrendingUp className="w-4 h-4" />;
      case 'training': return <Award className="w-4 h-4" />;
      case 'coverage': return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  // Render different dashboard based on user role
  const renderDashboardContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load dashboard data</p>
            <p className="text-sm text-muted-foreground">
              Please check your connection and try again
            </p>
          </div>
        </div>
      );
    }

    switch (user?.role) {
      case 'AGENT': {
        const { visits = [] } = dashboardData;
        const todayVisits = visits.filter((c: { timestamp: string }) => {
          const today = new Date().toDateString();
          return new Date(c.timestamp).toDateString() === today;
        });
        
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Today's Visits"
                value={todayVisits.length}
                icon={CheckCircle}
                description="Visits completed today"
              />
              <StatCard
                title="Total Visits"
                value={visits.length}
                icon={Calendar}
                description="All time visits"
              />
              <StatCard
                title="Total Shops"
                value={new Set(visits.map(v => v.shop_id)).size}
                icon={MapPin}
                description="Unique shops visited"
              />
            </div>
            
            {user?.id && <PersonalGoals userId={user.id} />}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recent Visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visits.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No visits yet. Start by visiting a shop!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {visits.slice(0, 5).map((visit: Visit) => (
                      <div key={visit.id} className="p-4 bg-muted/50 rounded-lg border">
                        <div className="flex justify-between items-start gap-4">
                          {visit.photo_path && (
                            <div className="flex-shrink-0">
                              <img 
                                src={`${API_BASE_URL}/uploads/${visit.photo_path}`}
                                alt="Shop visit"
                                className="w-24 h-24 object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder.svg';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <p className="font-medium">{visit.shop?.name}</p>
                            </div>
                            {visit.shop?.address && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {visit.shop.address}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {new Date(visit.timestamp).toLocaleString()}
                            </p>
                            {visit.notes && (
                              <div className="mt-2 pt-2 border-t border-border">
                                <p className="text-sm">{visit.notes}</p>
                              </div>
                            )}
                          </div>
                          {visit.status === 'FLAGGED' && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                              FLAGGED
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }
      
      case 'MANAGER': {
        const stats = dashboardData as TeamStats;
        const { agents = [], teamVisits = [], teamGoals = [] } = stats;
        
        // Calculate team statistics
        const todayVisits = teamVisits.filter((visit: Visit) => {
          const today = new Date().toDateString();
          return new Date(visit.timestamp).toDateString() === today;
        });
        
        const uniqueShops = new Set(teamVisits.map((visit: Visit) => visit.shop_id)).size;
        const activeAgents = agents.filter((agent) => 
          teamVisits.some((visit: Visit) => 
            visit.agent_id === agent.id && 
            new Date(visit.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
        ).length;
        
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Today's Visits"
                value={todayVisits.length}
                icon={CheckCircle}
                description="Team visits today"
              />
              <StatCard
                title="Active Agents"
                value={activeAgents}
                icon={Users}
                description="Active in last 7 days"
              />
              <StatCard
                title="Total Visits"
                value={teamVisits.length}
                icon={TrendingUp}
                description="All time team visits"
              />
              <StatCard
                title="Shops Coverage"
                value={uniqueShops}
                icon={MapPin}
                description="Unique shops visited"
              />
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Team Visits Overview
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {teamVisits.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No visits recorded</h3>
                      <p className="text-muted-foreground">
                        Your team hasn't recorded any visits yet
                      </p>
                    </div>
                  ) : (
                    teamVisits
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 10)
                      .map((visit: Visit) => {
                        const agent = agents.find(a => a.id === visit.agent_id);
                        return (
                          <div key={visit.id} className="p-4 bg-muted/50 rounded-lg border">
                            <div className="flex justify-between items-start gap-4">
                              {visit.photo_path && (
                                <div className="flex-shrink-0">
                                  <img 
                                    src={`${API_BASE_URL}/uploads/${visit.photo_path}`}
                                    alt="Shop visit"
                                    className="w-24 h-24 object-cover rounded-lg"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = '/placeholder.svg';
                                    }}
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge 
                                    variant="default" 
                                    className={
                                      new Date(visit.timestamp).toDateString() === new Date().toDateString()
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }
                                  >
                                    {new Date(visit.timestamp).toDateString() === new Date().toDateString()
                                      ? 'Today'
                                      : new Date(visit.timestamp).toLocaleDateString()}
                                  </Badge>
                                  <Badge 
                                    variant="default" 
                                    className="bg-purple-100 text-purple-800"
                                  >
                                    {agent?.name || agent?.phone || 'Unknown Agent'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-primary" />
                                  <p className="font-medium">{visit.shop?.name}</p>
                                </div>
                                {visit.shop?.address && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {visit.shop.address}
                                  </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  {new Date(visit.timestamp).toLocaleTimeString()}
                                </p>
                                {visit.notes && (
                                  <div className="mt-2 pt-2 border-t border-border">
                                    <p className="text-sm">{visit.notes}</p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <Badge 
                                  variant="default" 
                                  className={
                                    visit.status === 'APPROVED'
                                      ? 'bg-green-100 text-green-800'
                                      : visit.status === 'FLAGGED'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {visit.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {agents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No agents assigned yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {agents.map((agent) => {
                        const agentVisits = teamVisits.filter((v: Visit) => v.agent_id === agent.id);
                        const recentVisit = agentVisits.sort((a: Visit, b: Visit) => 
                          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                        )[0];
                        
                        return (
                          <div key={agent.id} className="p-4 bg-muted/50 rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{agent.name || agent.phone}</p>
                                  {recentVisit && new Date(recentVisit.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      Active Today
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                  <p>Total Visits: {agentVisits.length}</p>
                                  <p>Today's Visits: {agentVisits.filter((v: Visit) => 
                                    new Date(v.timestamp).toDateString() === new Date().toDateString()
                                  ).length}</p>
                                  {recentVisit && (
                                    <p>Last Active: {new Date(recentVisit.timestamp).toLocaleString()}</p>
                                  )}
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/agent/${agent.id}`)}>
                                View Details
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Team Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamGoals.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No active goals</h3>
                      <p className="text-muted-foreground">
                        Set goals for your team to track their performance
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamGoals.map((goal) => (
                        <div key={goal.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{goal.title}</h4>
                            <Badge variant="default" className={getGoalStatusColor(goal.status)}>
                              {goal.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress: {goal.current} / {goal.target}</span>
                              <span>{getGoalProgress(goal.current, goal.target)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  goal.status === 'completed' ? 'bg-green-500' : 
                                  getGoalProgress(goal.current, goal.target) >= 80 ? 'bg-blue-500' :
                                  getGoalProgress(goal.current, goal.target) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${getGoalProgress(goal.current, goal.target)}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Due: {new Date(goal.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }
      
      case 'ADMIN': {
        const { managers = [], agents: allAgents = [] } = (dashboardData as { 
          managers: User[];
          agents: User[];
        } || {});
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Total Managers"
                value={managers.length}
                icon={Users}
                description="Active managers"
              />
              <StatCard
                title="Total Agents"
                value={allAgents.length}
                icon={Target}
                description="Active agents"
              />
              <StatCard
                title="System Health"
                value="Online"
                icon={CheckCircle}
                description="All systems operational"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Managers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {managers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No managers created yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {managers.slice(0, 5).map((manager: { id: number; phone: string; role: string }) => (
                        <div key={manager.id} className="p-4 bg-muted/50 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{manager.phone}</p>
                              <p className="text-sm text-muted-foreground">Manager ID: {manager.id}</p>
                            </div>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {manager.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Recent Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allAgents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No agents created yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {allAgents.slice(0, 5).map((agent: { id: number; phone: string; manager_id?: number; role: string }) => (
                        <div key={agent.id} className="p-4 bg-muted/50 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{agent.phone}</p>
                              <p className="text-sm text-muted-foreground">
                                Manager: {agent.manager_id || 'Unassigned'}
                              </p>
                            </div>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              {agent.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }
      
      default:
        return (
          <div className="flex items-center justify-center p-8">
            <p>Welcome to Sales Sync!</p>
          </div>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}! Here's what's happening today.
          </p>
        </div>
        {user?.role === 'AGENT' && (
          <Button onClick={handleStartVisit} className="brand-gradient text-white">
            <Plus className="w-4 h-4 mr-2" />
            Start Visit
          </Button>
        )}
      </div>
      
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;
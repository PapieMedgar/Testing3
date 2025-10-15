import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users as UsersIcon, 
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
  EyeOff,
  Edit,
  Trash2,
  Loader2,
  Shield,
  Crown,
  User,
  UserCheck,
  UserX,
  Key
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI, User as UserType } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

// ManagerAgentRelationships component
const ManagerAgentRelationships = ({ users }: { users: UserType[] }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter function for search
  const filterBySearch = (user: UserType) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(search)) ||
      user.phone.toLowerCase().includes(search)
    );
  };

  // Get all managers filtered by search
  const managers = users
    .filter(user => user.role === 'MANAGER')
    .filter(filterBySearch);
  
  // Get agents grouped by manager, also filtered by search
  const agentsByManager = users
    .filter(user => user.role === 'AGENT')
    .filter(filterBySearch)
    .reduce((acc, agent) => {
      const managerId = agent.manager_id || 'unassigned';
      if (!acc[managerId]) {
        acc[managerId] = [];
      }
      acc[managerId].push(agent);
      return acc;
    }, {} as Record<string | number, UserType[]>);

  // Filter managers to only show those who match search or have matching agents
  const filteredManagers = managers.filter(manager => {
    // Show manager if they match search or if they have agents that match search
    const hasMatchingAgents = agentsByManager[manager.id] && agentsByManager[manager.id].length > 0;
    return filterBySearch(manager) || hasMatchingAgents;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'MANAGER':
        return <Crown className="w-4 h-4" />;
      case 'AGENT':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className="ml-2">
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search managers and agents by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTerm("")}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Results Summary */}
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          {filteredManagers.length === 0 && Object.keys(agentsByManager).length === 0 ? (
            "No results found for your search."
          ) : (
            `Showing ${filteredManagers.length} manager${filteredManagers.length !== 1 ? 's' : ''} and ${
              Object.values(agentsByManager).flat().length
            } agent${Object.values(agentsByManager).flat().length !== 1 ? 's' : ''} matching "${searchTerm}"`
          )}
        </div>
      )}

      {filteredManagers.length === 0 && Object.keys(agentsByManager).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{searchTerm ? "No results found" : "No managers found"}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredManagers.map((manager) => {
            const managerAgents = agentsByManager[manager.id] || [];
            
            return (
              <Card key={manager.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={`https://avatar.vercel.sh/${manager.phone}`} />
                        <AvatarFallback>
                          {manager.name ? manager.name.split(' ').map(n => n[0]).join('') : manager.phone.slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(manager.role)}
                          <span className="font-semibold">
                            {manager.name || manager.phone}
                          </span>
                          {getStatusBadge(manager.is_active)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {manager.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <UsersIcon className="w-3 h-3" />
                            {managerAgents.length} agent{managerAgents.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {managerAgents.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Assigned Agents:</h4>
                      <div className="grid gap-2">
                        {managerAgents.map((agent) => (
                          <div key={agent.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={`https://avatar.vercel.sh/${agent.phone}`} />
                                <AvatarFallback>
                                  {agent.name ? agent.name.split(' ').map(n => n[0]).join('') : agent.phone.slice(-2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(agent.role)}
                                  <span className="font-medium text-sm">
                                    {agent.name || agent.phone}
                                  </span>
                                  {getStatusBadge(agent.is_active)}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  {agent.phone}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
                
                {managerAgents.length === 0 && (
                  <CardContent className="pt-0">
                    <div className="text-center py-4 text-muted-foreground">
                      <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No agents assigned to this manager</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Unassigned agents section */}
      {agentsByManager.unassigned && agentsByManager.unassigned.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">Unassigned Agents</span>
              <Badge variant="outline" className="ml-2">
                {agentsByManager.unassigned.length} agent{agentsByManager.unassigned.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2">
              {agentsByManager.unassigned.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${agent.phone}`} />
                      <AvatarFallback>
                        {agent.name ? agent.name.split(' ').map(n => n[0]).join('') : agent.phone.slice(-2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(agent.role)}
                        <span className="font-medium text-sm">
                          {agent.name || agent.phone}
                        </span>
                        {getStatusBadge(agent.is_active)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {agent.phone}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Users = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<'manager' | 'agent'>('manager');
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const [newUserPassword, setNewUserPassword] = useState("");
  const [generatePassword, setGeneratePassword] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editSelectedManagerId, setEditSelectedManagerId] = useState<number | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [selectedUserForCredentials, setSelectedUserForCredentials] = useState<UserType | null>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Fetch all users data from API
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: adminAPI.getAllUsers,
    enabled: user?.role === 'ADMIN',
  });

  // Migrate passwords for existing users (run once)
  useQuery({
    queryKey: ['migratePasswords'],
    queryFn: adminAPI.migratePasswords,
    enabled: user?.role === 'ADMIN' && users.length > 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  // Fetch user credentials
  const { data: userCredentials, refetch: refetchCredentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ['userCredentials', selectedUserForCredentials?.id],
    queryFn: () => selectedUserForCredentials ? adminAPI.getUserCredentials(selectedUserForCredentials.id) : null,
    enabled: !!selectedUserForCredentials && isCredentialsDialogOpen,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: ({ phone, name, role, managerId, password }: { phone: string; name?: string; role: 'MANAGER' | 'AGENT'; managerId?: number; password?: string }) => {
      if (role === 'MANAGER') {
        return adminAPI.createManager(phone, name, password);
      } else {
        // For agents, we need a manager ID
        if (!managerId) {
          throw new Error('Manager selection is required for agents.');
        }
        return adminAPI.createAgent(phone, managerId, name, password);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      setNewUserPhone("");
      setNewUserName("");
      setNewUserPassword("");
      setGeneratePassword(true);
      setNewUserRole('manager');
      setSelectedManagerId(null);
      const passwordMessage = data.password_was_generated 
        ? `Generated password: ${data.generated_password}`
        : `Password set successfully`;
      toast.success(`${newUserRole.charAt(0).toUpperCase() + newUserRole.slice(1)} created successfully! ${passwordMessage}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => adminAPI.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("User deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, updates }: { userId: number; updates: { name?: string; phone?: string; manager_id?: number | null; is_active?: boolean } }) => 
      adminAPI.updateUser(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setEditUserPhone("");
      setEditUserName("");
      setEditSelectedManagerId(null);
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  // Edit password mutation
  const editPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: number; password: string }) => 
      adminAPI.editUserPassword(userId, password),
    onSuccess: () => {
      toast.success("Password updated successfully!");
      setIsEditingPassword(false);
      setNewPassword("");
      refetchCredentials();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update password");
    },
  });

  const handleCreateUser = () => {
    if (!newUserPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    
    if (newUserRole === 'agent' && !selectedManagerId) {
      toast.error("Manager selection is required for agents");
      return;
    }
    
    if (!generatePassword && !newUserPassword.trim()) {
      toast.error("Password is required when not auto-generating");
      return;
    }
    
    createUserMutation.mutate({ 
      phone: newUserPhone.trim(),
      name: newUserName.trim() || undefined,
      role: newUserRole.toUpperCase() as 'MANAGER' | 'AGENT',
      managerId: selectedManagerId || undefined,
      password: generatePassword ? undefined : newUserPassword.trim()
    });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditUser = (userData: UserType) => {
    setEditingUser(userData);
    setEditUserPhone(userData.phone);
    setEditUserName(userData.name || "");
    setEditSelectedManagerId(userData.manager_id || null);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    if (!editUserPhone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    
    if (editingUser.role === 'AGENT' && !editSelectedManagerId) {
      toast.error("Manager selection is required for agents");
      return;
    }
    
    const updates: { name?: string; phone?: string; manager_id?: number | null } = {};
    
    // Only include changed fields
    if (editUserName !== (editingUser.name || "")) {
      updates.name = editUserName.trim() || undefined;
    }
    
    if (editUserPhone !== editingUser.phone) {
      updates.phone = editUserPhone.trim();
    }
    
    if (editingUser.role === 'AGENT' && editSelectedManagerId !== editingUser.manager_id) {
      updates.manager_id = editSelectedManagerId;
    }
    
    updateUserMutation.mutate({ userId: editingUser.id, updates });
  };

  const handleToggleUserStatus = (userData: UserType) => {
    const action = userData.is_active ? "deactivate" : "activate";
    const message = userData.is_active 
      ? "This will prevent the user from logging in. Are you sure?" 
      : "This will allow the user to log in again. Are you sure?";
    
    if (confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${userData.name || 'this user'}? ${message}`)) {
      updateUserMutation.mutate({ 
        userId: userData.id, 
        updates: { is_active: !userData.is_active } 
      });
    }
  };

  // Calculate stats by role
  const totalUsers = users.length;
  const adminCount = users.filter((u: UserType) => u.role === 'ADMIN').length;
  const managerCount = users.filter((u: UserType) => u.role === 'MANAGER').length;
  const agentCount = users.filter((u: UserType) => u.role === 'AGENT').length;
  const activeUsers = users.filter((u: UserType) => u.is_active).length;
  
  // Get available managers for agent assignment
  const availableManagers = users.filter((u: UserType) => u.role === 'MANAGER' && u.is_active);

  const handleViewCredentials = (user: UserType) => {
    setSelectedUserForCredentials(user);
    setIsCredentialsDialogOpen(true);
    setIsEditingPassword(false);
    setNewPassword("");
    setShowPassword(false);
  };

  const handleEditPassword = () => {
    if (selectedUserForCredentials) {
      setNewPassword(userCredentials?.password || "");
      setIsEditingPassword(true);
    }
  };

  const handleSavePassword = () => {
    if (selectedUserForCredentials && newPassword.trim()) {
      editPasswordMutation.mutate({
        userId: selectedUserForCredentials.id,
        password: newPassword.trim()
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPassword(false);
    if (userCredentials?.password) {
      setNewPassword(userCredentials.password);
    }
  };

  const handleCloseCredentialsDialog = () => {
    setIsCredentialsDialogOpen(false);
    setSelectedUserForCredentials(null);
    setIsEditingPassword(false);
    setNewPassword("");
    setShowPassword(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-amber-600" />;
      case 'manager':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'agent':
        return <User className="w-4 h-4 text-green-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return "bg-amber-100 text-amber-800";
      case 'manager':
        return "bg-blue-100 text-blue-800";
      case 'agent':
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage all users in your organization
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to your organization. You can set a custom password or let the system generate one automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={newUserRole}
                  onChange={(e) => {
                    setNewUserRole(e.target.value as 'manager' | 'agent');
                    // Reset manager selection when role changes to prevent confusion
                    setSelectedManagerId(null);
                  }}
                >
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
              
              {newUserRole === 'agent' && (
                <div className="space-y-2">
                  <Label htmlFor="manager" className="font-medium">
                    Assign to Manager <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="manager"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={selectedManagerId || ''}
                    onChange={(e) => setSelectedManagerId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Select a manager...</option>
                    {availableManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name || `Manager ${manager.id}`} ({manager.phone})
                      </option>
                    ))}
                  </select>
                  {availableManagers.length === 0 ? (
                    <p className="text-sm text-red-600">No active managers available. Please create a manager first.</p>
                  ) : (
                    <p className="text-sm text-blue-600">This agent will report to the selected manager</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+27123456789"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="Enter user name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              
              {/* Password Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="generatePassword"
                    checked={generatePassword}
                    onCheckedChange={(checked) => {
                      setGeneratePassword(checked as boolean);
                      if (checked) {
                        setNewUserPassword("");
                      }
                    }}
                  />
                  <Label htmlFor="generatePassword" className="text-sm font-medium">
                    Auto-generate password
                  </Label>
                </div>
                
                {!generatePassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Custom Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter custom password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Key className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password should be at least 6 characters long
                    </p>
                  </div>
                )}
                
                {generatePassword && (
                  <p className="text-xs text-muted-foreground">
                    A 6-character password will be generated automatically
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
                <Input
                  id="edit-phone"
                  placeholder="+27123456789"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter user name"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                />
              </div>
              
              {editingUser?.role === 'AGENT' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-manager">Assign to Manager *</Label>
                  <select
                    id="edit-manager"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={editSelectedManagerId || ''}
                    onChange={(e) => setEditSelectedManagerId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">Select a manager...</option>
                    {availableManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name || `Manager ${manager.id}`} ({manager.phone})
                      </option>
                    ))}
                  </select>
                  {availableManagers.length === 0 && (
                    <p className="text-sm text-red-600">No active managers available.</p>
                  )}
                </div>
              )}
              
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm text-gray-600">
                  <div><strong>Role:</strong> {editingUser?.role?.charAt(0).toUpperCase() + editingUser?.role?.slice(1)}</div>
                  <div><strong>User ID:</strong> {editingUser?.id}</div>
                  <div><strong>Created:</strong> {editingUser ? new Date(editingUser.created_at).toLocaleDateString() : ''}</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={updateUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateUser}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Credentials Dialog */}
        <Dialog open={isCredentialsDialogOpen} onOpenChange={handleCloseCredentialsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                User Credentials
              </DialogTitle>
              <DialogDescription>
                View login credentials for {selectedUserForCredentials?.name || selectedUserForCredentials?.phone}
              </DialogDescription>
            </DialogHeader>
            
            {selectedUserForCredentials && (
              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone Number</p>
                      <p className="text-sm text-muted-foreground">{selectedUserForCredentials.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedUserForCredentials.name || 'Not set'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Role</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedUserForCredentials.role}
                      </p>
                    </div>
                  </div>
                  
                  {/* Password Section */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Password</p>
                      </div>
                      {!isEditingPassword && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditPassword}
                          disabled={credentialsLoading}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          {userCredentials?.password ? "Edit" : "Set Password"}
                        </Button>
                      )}
                    </div>
                    
                    {isEditingPassword ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 text-gray-600" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSavePassword}
                            disabled={!newPassword.trim() || editPasswordMutation.isPending}
                          >
                            {editPasswordMutation.isPending && (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            )}
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={editPasswordMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showPassword ? "text" : "password"}
                              value={
                                credentialsLoading 
                                  ? "Loading..." 
                                  : userCredentials?.password || "No password available"
                              }
                              readOnly
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={!userCredentials?.password || credentialsLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4 text-gray-600" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {credentialsLoading 
                            ? "Loading password..."
                            : userCredentials?.password 
                              ? "Click the eye icon to show/hide password, or click Edit to change it."
                              : "No password available. Click Edit to set a password."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (userCredentials?.password) {
                        navigator.clipboard.writeText(userCredentials.password);
                        toast.success("Password copied to clipboard!");
                      }
                    }}
                    disabled={!userCredentials?.password || credentialsLoading}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {credentialsLoading ? "Loading..." : "Copy Password"}
                  </Button>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseCredentialsDialog}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{agentCount}</div>
            <p className="text-xs text-muted-foreground">Field agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{managerCount}</div>
            <p className="text-xs text-muted-foreground">Regional managers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
            <Crown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{adminCount}</div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? Math.round((activeUsers/totalUsers)*100) : 0}% of all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>
            View and manage all users in your organization
          </CardDescription>
          
          {/* Search Bar for Users Table */}
          <div className="flex items-center gap-2 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name, phone, or role..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {userSearchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserSearchTerm("")}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Results Summary */}
          {userSearchTerm && (
            <div className="mb-4 text-sm text-muted-foreground">
              {users.filter((userData: UserType) => {
                const search = userSearchTerm.toLowerCase();
                return (
                  (userData.name && userData.name.toLowerCase().includes(search)) ||
                  userData.phone.toLowerCase().includes(search) ||
                  userData.role.toLowerCase().includes(search)
                );
              }).length === 0 ? (
                "No users found matching your search."
              ) : (
                `Showing ${users.filter((userData: UserType) => {
                  const search = userSearchTerm.toLowerCase();
                  return (
                    (userData.name && userData.name.toLowerCase().includes(search)) ||
                    userData.phone.toLowerCase().includes(search) ||
                    userData.role.toLowerCase().includes(search)
                  );
                }).length} of ${users.length} users matching "${userSearchTerm}"`
              )}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading users...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Failed to load users</p>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          ) : users.filter((userData: UserType) => {
            if (!userSearchTerm) return true;
            const search = userSearchTerm.toLowerCase();
            return (
              (userData.name && userData.name.toLowerCase().includes(search)) ||
              userData.phone.toLowerCase().includes(search) ||
              userData.role.toLowerCase().includes(search)
            );
          }).length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {userSearchTerm ? "No users found" : "No users yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {userSearchTerm 
                  ? `No users match "${userSearchTerm}". Try a different search term.`
                  : "Get started by creating your first user"
                }
              </p>
              {!userSearchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter((userData: UserType) => {
                    if (!userSearchTerm) return true;
                    const search = userSearchTerm.toLowerCase();
                    return (
                      (userData.name && userData.name.toLowerCase().includes(search)) ||
                      userData.phone.toLowerCase().includes(search) ||
                      userData.role.toLowerCase().includes(search)
                    );
                  })
                  .map((userData: UserType) => {
                  // Find the manager for this user if they're an agent
                  const manager = userData.manager_id 
                    ? users.find(u => u.id === userData.manager_id)
                    : null;
                  
                  return (
                    <TableRow key={userData.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {userData.name ? userData.name.split(' ').map(n => n[0]).join('') : userData.role[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {userData.name || `${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} User`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(userData.role)}
                          <Badge className={getRoleBadgeColor(userData.role)}>
                            {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {userData.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {userData.role === 'AGENT' ? (
                          manager ? (
                            <div className="text-sm">
                              <div className="font-medium">{manager.name || `Manager ${manager.id}`}</div>
                              <div className="text-muted-foreground">{manager.phone}</div>
                            </div>
                          ) : (
                            <span className="text-red-600 text-sm">No manager assigned</span>
                          )
                        ) : userData.role === 'MANAGER' ? (
                          <span className="text-blue-600 text-sm">
                            {users.filter(u => u.manager_id === userData.id).length} agents
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={userData.is_active ? 
                          "bg-green-100 text-green-800" : 
                          "bg-red-100 text-red-800"
                        }>
                          <div className="flex items-center gap-1">
                            {userData.is_active ? (
                              <UserCheck className="w-3 h-3" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            {userData.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(userData.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCredentials(userData)}>
                              <Key className="w-4 h-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUser(userData)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            {userData.role !== 'ADMIN' && (
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(userData)}>
                                {userData.is_active ? (
                                  <>
                                    <UserX className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            {userData.role !== 'ADMIN' && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteUser(userData.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manager-Agent Relationships Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            Manager-Agent Relationships
          </CardTitle>
          <CardDescription>
            View all managers and their assigned agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerAgentRelationships users={users} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;

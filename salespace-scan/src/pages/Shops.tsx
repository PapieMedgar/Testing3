import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  Search, 
  MoreVertical,
  MapPin,
  Users,
  Clock,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Navigation,
  Loader2,
  AlertCircle
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
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI, Shop } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import ShopsMap from "@/components/ShopsMap";
import ShopVisitHistory from "@/components/ShopVisitHistory";

interface ExtendedShop extends Shop {
  region?: string;
  manager?: string;
  visitFrequency?: string;
  lastVisit?: string;
  agentCount?: number;
  status?: string;
  performance?: number;
  coordinates?: string;
}

interface ShopManager {
  id: number;
  name: string;
  phone: string;
}

interface ShopVisit {
  id: number;
  shop_id: number;
  timestamp: string;
  agent_name: string;
}

const Shops = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShop, setSelectedShop] = useState<ExtendedShop | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isVisitHistoryDialogOpen, setIsVisitHistoryDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch shops data
  const { data: shopsData = [], isLoading, error } = useQuery({
    queryKey: ['shops'],
    queryFn: adminAPI.getAllShops,
    enabled: user?.role === 'ADMIN',
  });

  // Fetch managers data
  const { data: managersData = [] } = useQuery({
    queryKey: ['managers'],
    queryFn: adminAPI.getManagers,
    enabled: user?.role === 'ADMIN',
  });

  // Fetch checkins data for visit information
  const { data: checkinsData = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: adminAPI.getAllCheckins,
    enabled: user?.role === 'ADMIN',
  });

  // Fetch agents data
  const { data: agentsData = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: adminAPI.getAgents,
    enabled: user?.role === 'ADMIN',
  });

  // Process and enhance shop data with additional information
  const enhancedShops = shopsData.map((shop: Shop) => {
    // Find the most recent checkin for this shop
    const shopCheckins = checkinsData.filter((checkin: any) => checkin.shop_id === shop.id);
    const latestCheckin = shopCheckins.length > 0 
      ? shopCheckins.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
      : null;
    
    // Count agents assigned to this shop (in a real app, this would come from a shop-agent relationship)
    const assignedAgents = agentsData.filter((agent: any) => {
      // This is a simplified example - in a real app, you'd have a proper relationship
      return shopCheckins.some((checkin: any) => checkin.agent_id === agent.id);
    });

    // Calculate visit frequency (this would normally come from a business rule or database)
    const visitFrequency = shopCheckins.length > 5 ? "Weekly" : shopCheckins.length > 2 ? "Monthly" : "Quarterly";
    
    // Calculate performance based on visit frequency and recency
    let performance = 0;
    if (latestCheckin) {
      const daysSinceLastVisit = Math.floor((Date.now() - new Date(latestCheckin.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      performance = Math.max(0, 100 - (daysSinceLastVisit * 2)); // Simple formula: lose 2% per day since last visit
    }

    // Determine shop status
    const status = performance > 30 ? "Active" : "Inactive";

    // Find the manager for this shop (in a real app, this would come from a shop-manager relationship)
    // For this example, we'll just assign a random manager
    const randomManagerIndex = shop.id % managersData.length;
    const manager = managersData.length > 0 ? managersData[randomManagerIndex] : null;

    // Extract region from address (simplified - in a real app, you'd have a proper region field)
    const addressParts = shop.address.split(',');
    const region = addressParts.length > 1 ? addressParts[addressParts.length - 1].trim() : "South Africa";

    return {
      ...shop,
      region,
      manager: manager ? manager.name : "Unassigned",
      manager_id: manager ? manager.id : null,
      visitFrequency,
      lastVisit: latestCheckin ? new Date(latestCheckin.timestamp).toLocaleDateString() : "Never",
      agentCount: assignedAgents.length,
      status,
      performance,
    };
  });

  // Filter shops based on search term
  const filteredShops = enhancedShops.filter((shop: ExtendedShop) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      shop.name.toLowerCase().includes(searchLower) ||
      shop.address.toLowerCase().includes(searchLower) ||
      (shop.region && shop.region.toLowerCase().includes(searchLower))
    );
  });

  const getStatusColor = (status: string) => {
    return status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return "text-green-600";
    if (performance >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const totalShops = enhancedShops.length;
  const activeShops = enhancedShops.filter(s => s.status === "Active").length;
  const totalAgents = enhancedShops.reduce((sum, s) => sum + (s.agentCount || 0), 0);
  const avgPerformance = enhancedShops.length > 0 
    ? Math.round(enhancedShops.reduce((sum, s) => sum + (s.performance || 0), 0) / enhancedShops.length) 
    : 0;

  // Mutations for shop actions
  const updateShopMutation = useMutation({
    mutationFn: (data: { id: number, updates: Partial<Shop> }) => 
      adminAPI.updateShop(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop updated successfully');
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update shop: ${error}`);
    }
  });

  const deleteShopMutation = useMutation({
    mutationFn: (shopId: number) => adminAPI.deleteShop(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      toast.success('Shop deleted successfully');
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to delete shop: ${error}`);
    }
  });

  // Handle shop actions
  const handleViewDetails = (shop: ExtendedShop) => {
    setSelectedShop(shop);
    setIsViewDetailsDialogOpen(true);
  };

  const handleEditShop = (shop: ExtendedShop) => {
    setSelectedShop(shop);
    setIsEditDialogOpen(true);
  };

  const handleViewOnMap = (shop: ExtendedShop) => {
    setSelectedShop(shop);
    setIsMapDialogOpen(true);
  };

  const handleDeleteShop = (shop: ExtendedShop) => {
    setSelectedShop(shop);
    setIsDeleteDialogOpen(true);
  };
  
  const handleViewVisitHistory = (shop: ExtendedShop) => {
    setSelectedShop(shop);
    setIsVisitHistoryDialogOpen(true);
  };

  const confirmDeleteShop = () => {
    if (selectedShop) {
      deleteShopMutation.mutate(selectedShop.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shops</h1>
          <p className="text-muted-foreground">
            Manage and monitor all retail locations
          </p>
        </div>
        <Button onClick={() => toast.info('Add Shop functionality would go here')}>
          <Building className="mr-2 h-4 w-4" />
          Add Shop
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShops}</div>
            <p className="text-xs text-muted-foreground">+3 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeShops}</div>
            <p className="text-xs text-muted-foreground">
              {totalShops > 0 ? `${Math.round((activeShops/totalShops)*100)}% operational` : '0% operational'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">Across all locations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerformance}%</div>
            <p className="text-xs text-muted-foreground">Based on visit frequency</p>
          </CardContent>
        </Card>
      </div>

      {/* Map Section */}
      <ShopsMap shops={enhancedShops} isLoading={isLoading} />

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search shops..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Shops Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shop Directory</CardTitle>
          <CardDescription>
            Monitor all retail locations and their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading shops...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-2">Failed to load shops</p>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No shops found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No shops match your search criteria.' : 'There are no shops in the system yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shop Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Visit Frequency</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShops.map((shop: ExtendedShop) => (
                  <TableRow key={shop.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{shop.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {`${shop.latitude.toFixed(4)}, ${shop.longitude.toFixed(4)}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{shop.region || "South Africa"}</div>
                        <div className="text-sm text-muted-foreground">{shop.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>{shop.manager}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        {shop.agentCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{shop.visitFrequency}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {shop.lastVisit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className={getPerformanceColor(shop.performance || 0)}>
                          {shop.performance}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(shop.status || "Active")}>
                        {shop.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(shop)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewVisitHistory(shop)}>
                            <Clock className="w-4 h-4 mr-2" />
                            Visit History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditShop(shop)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Shop
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewOnMap(shop)}>
                            <MapPin className="w-4 h-4 mr-2" />
                            View on Map
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteShop(shop)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shop Details</DialogTitle>
            <DialogDescription>
              Detailed information about this shop
            </DialogDescription>
          </DialogHeader>
          {selectedShop && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedShop.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedShop.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Region</h4>
                  <p>{selectedShop.region || "South Africa"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Manager</h4>
                  <p>{selectedShop.manager}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Agents</h4>
                  <p>{selectedShop.agentCount}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Visit Frequency</h4>
                  <p>{selectedShop.visitFrequency}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Last Visit</h4>
                  <p>{selectedShop.lastVisit}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Performance</h4>
                  <p className={getPerformanceColor(selectedShop.performance || 0)}>
                    {selectedShop.performance}%
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Status</h4>
                  <Badge className={getStatusColor(selectedShop.status || "Active")}>
                    {selectedShop.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Coordinates</h4>
                  <p>{selectedShop.latitude.toFixed(4)}, {selectedShop.longitude.toFixed(4)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shop Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
            <DialogDescription>
              Update shop information
            </DialogDescription>
          </DialogHeader>
          {selectedShop && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shop Name</Label>
                <Input 
                  id="name" 
                  defaultValue={selectedShop.name}
                  onChange={(e) => {
                    setSelectedShop({...selectedShop, name: e.target.value});
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  defaultValue={selectedShop.address}
                  onChange={(e) => {
                    setSelectedShop({...selectedShop, address: e.target.value});
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input 
                    id="latitude" 
                    type="number"
                    step="0.000001"
                    defaultValue={selectedShop.latitude}
                    onChange={(e) => {
                      setSelectedShop({...selectedShop, latitude: parseFloat(e.target.value)});
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input 
                    id="longitude" 
                    type="number"
                    step="0.000001"
                    defaultValue={selectedShop.longitude}
                    onChange={(e) => {
                      setSelectedShop({...selectedShop, longitude: parseFloat(e.target.value)});
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (selectedShop) {
                  updateShopMutation.mutate({
                    id: selectedShop.id,
                    updates: {
                      name: selectedShop.name,
                      address: selectedShop.address,
                      latitude: selectedShop.latitude,
                      longitude: selectedShop.longitude
                    }
                  });
                }
              }}
              disabled={updateShopMutation.isPending}
            >
              {updateShopMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this shop? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedShop && (
            <div className="py-4">
              <p className="font-medium">{selectedShop.name}</p>
              <p className="text-sm text-muted-foreground">{selectedShop.address}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteShop}
              disabled={deleteShopMutation.isPending}
            >
              {deleteShopMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Shop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View on Map Dialog */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Shop Location</DialogTitle>
            <DialogDescription>
              {selectedShop?.name} - {selectedShop?.address}
            </DialogDescription>
          </DialogHeader>
          <div className="h-[60vh]">
            {selectedShop && (
              <ShopsMap 
                shops={[selectedShop]} 
                isLoading={false} 
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsMapDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visit History Dialog */}
      <Dialog open={isVisitHistoryDialogOpen} onOpenChange={setIsVisitHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visit History</DialogTitle>
            <DialogDescription>
              {selectedShop?.name} - {selectedShop?.address}
            </DialogDescription>
          </DialogHeader>
          {selectedShop && (
            <ShopVisitHistory 
              shop={selectedShop}
              visits={checkinsData.filter((checkin: any) => checkin.shop_id === selectedShop.id)}
              isLoading={false}
            />
          )}
          <DialogFooter>
            <Button onClick={() => setIsVisitHistoryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shops;

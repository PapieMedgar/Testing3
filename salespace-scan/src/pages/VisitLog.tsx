import { useState } from "react"
import { MapPin, Clock, CheckCircle, AlertCircle, Plus, User, Building2, PersonStanding } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import VisitDetails from "@/components/ui/visit-details"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VisitList } from "@/components/ui/visit-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { agentAPI, shopsAPI } from "@/lib/api"

const VisitLog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();



  // Fetch visits for agents only
  const { data: visits = [], isLoading, error } = useQuery({
    queryKey: ['agent-visits'],
    queryFn: agentAPI.getMyVisits,
    enabled: user?.role === 'AGENT',
    retry: 3,
    retryDelay: 1000
  });

  // Fetch all visit responses for agent
  const { data: visitResponsesData } = useQuery({
    queryKey: ['agent-visit-responses'],
    queryFn: agentAPI.getAllVisitResponses,
    enabled: user?.role === 'AGENT',
    retry: 3,
    retryDelay: 1000
  });

  // Fetch shop details
  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: shopsAPI.getAll,
    enabled: user?.role === 'AGENT',
    retry: 3,
    retryDelay: 1000
  });

  // Create lookup maps
  const visitResponsesMap: Record<number, import("@/lib/api").VisitResponse | undefined> = {};
  if (visitResponsesData && visitResponsesData.visit_responses) {
    for (const resp of visitResponsesData.visit_responses) {
      visitResponsesMap[resp.checkin_id] = resp;
    }
  }

  const shopsMap: Record<number, import("@/lib/api").Shop | undefined> = {};
  if (Array.isArray(shops)) {
    for (const shop of shops) {
      shopsMap[shop.id] = shop;
    }
  }

  const handleStartVisit = () => {
    navigate('/start-visit'); // This will take us to the new StartVisit page
  };

  if (user?.role !== 'AGENT') {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">Visit Log is only available for agents.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Visits...</h2>
          <p className="text-muted-foreground">Please wait while we load your visit history.</p>
        </div>
      </div>
    );
  }

  // Format visit/checkin data for VisitDetails
  function formatVisitData(visit, response, shop) {
    // Extract survey responses
    const responses = response?.responses || {};
    const surveyResponses = Array.isArray(responses)
      ? responses
      : Object.entries(responses).map(([key, value]) => ({
          question: key,
          answer:
            typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string'
              ? value
              : typeof value === 'object' && value !== null
              ? value
              : String(value),
        }));

    // Extract photos from visit response data
    let visitPhotos = {};
    if (response?.responses && typeof response.responses === 'object') {
      const data = response.responses.data;
      if (data && typeof data === 'object' && data.photos) {
        visitPhotos = data.photos;
      }
    }
    const photoList = [];
    if (visitPhotos && typeof visitPhotos === 'object') {
      if ('outside' in visitPhotos && visitPhotos.outside) {
        photoList.push({ type: 'outside', data: visitPhotos.outside });
      }
      if ('competitors' in visitPhotos && Array.isArray(visitPhotos.competitors)) {
        photoList.push(...visitPhotos.competitors.map((photo) => ({ type: 'competitor', data: photo })));
      }
      if ('board' in visitPhotos && visitPhotos.board) {
        photoList.push({ type: 'board', data: visitPhotos.board });
      }
    }

    // Extract brand/category/product from response if present
    let brand = undefined;
    let category = undefined;
    let product = undefined;
    
    // First check if there are brand/category/product from direct database fields
    if (visit?.brand) {
      brand = visit.brand.name || visit.brand;
    }
    
    if (visit?.category) {
      category = visit.category.name || visit.category;
    }
    
    if (visit?.product) {
      product = visit.product.name || visit.product;
    }
    
    // If not found, try to extract from response data
    if (!brand && !category && !product && response?.responses) {
      const r = response.responses;
      
      // Check multiple possible locations for brand information
      if (typeof r.brand === 'string') {
        brand = r.brand;
      } else if (typeof r.brandName === 'string') {
        brand = r.brandName;
      } else if (typeof r.industry === 'string') {
        brand = r.industry;
      } else if (r.brandInfo?.brandInfoGiven === 'yes' && r.brandInfo?.brand) {
        brand = r.brandInfo.brand;
      }
      
      // Check multiple possible locations for category information
      if (typeof r.category === 'string') {
        category = r.category;
      } else if (typeof r.categoryName === 'string') {
        category = r.categoryName;
      } else if (r.brandInfo?.category) {
        category = r.brandInfo.category;
      }
      
      // Check multiple possible locations for product information
      if (typeof r.product === 'string') {
        product = r.product;
      } else if (typeof r.productName === 'string') {
        product = r.productName;
      } else if (r.brandInfo?.product) {
        product = r.brandInfo.product;
      }
    }

    // Get agent name if available
    const agentName = visit?.agent?.name || visit?.agent?.phone || '';

    // Determine shop name logic
    let shopName = '';
    let contactName = '';
    let contactPhone = '';
    
    if (response?.visit_type === 'individual') {
      // For individual visits, use the consumer name if available
      if (response?.responses?.consumerDetails?.consumerName) {
        contactName = response.responses.consumerDetails.consumerName;
        if (response.responses.consumerDetails.consumerSurname) {
          contactName += ' ' + response.responses.consumerDetails.consumerSurname;
        }
        shopName = contactName; // Use consumer name as the primary display
      } else {
        shopName = 'Individual Visit';
      }
      
      // Get contact phone if available
      if (response?.responses?.consumerDetails?.cellphoneNumber) {
        contactPhone = response.responses.consumerDetails.cellphoneNumber;
      }
    } else if (shop?.name) {
      // For shop visits, use the shop name
      shopName = shop.name;
    } else {
      // Fallback for any other case
      shopName = `Shop #${visit.shop_id || ''}`;
    }

    const shopAddress = shop?.address || 'Unknown address';

    // Return formatted visit data
    return {
      id: visit?.id?.toString() || '',
      shopId: visit?.shop_id != null ? visit.shop_id.toString() : '',
      shopName,
      agentId: visit?.agent_id != null ? visit.agent_id.toString() : '',
      agentName,
      timestamp: visit?.timestamp,
      location: shopAddress,
      visitType: response?.visit_type || 'customer',
      notes: response?.responses?.additionalNotes || '',
      brand,
      category,
      product,
      contactName,
      contactPhone,
      surveyResponses,
      photos: photoList,
    };
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visit Log</h1>
          <p className="text-muted-foreground">Track your GPS-verified visits and activities</p>
        </div>
        <Button onClick={handleStartVisit} className="brand-gradient text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Visit
        </Button>
      </div>



      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Visits</p>
                <p className="text-2xl font-bold">
                {visits.filter(v => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const visitDate = new Date(v.timestamp);
                  return visitDate >= today;
                }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{visits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Individual Visits</p>
                <p className="text-2xl font-bold">
                  {visits.filter(v => visitResponsesMap[v.id]?.visit_type === 'individual').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Shop Visits</p>
                <p className="text-2xl font-bold">
                  {visits.filter(v => !visitResponsesMap[v.id] || visitResponsesMap[v.id]?.visit_type === 'customer').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visit History */}
      <Card>
        <CardHeader>
          <CardTitle>Visit History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Visits</TabsTrigger>
              <TabsTrigger value="shop">Shop Visits</TabsTrigger>
              <TabsTrigger value="individual">Individual Visits</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              {visits.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No visits yet</h3>
                  <p className="text-muted-foreground mb-4">Start by visiting a shop to track your visits.</p>
                  <Button onClick={handleStartVisit}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Visit
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {visits.map((visit) => {
                    const visitData = formatVisitData(
                      visit,
                      visitResponsesMap[visit.id],
                      shopsMap[visit.shop_id]
                    );
                    
                    if (!visitData) return null;

                    return (
                      <div key={visit.id} className="relative">
                        <VisitDetails visit={visitData} />
                        {visit.status === 'FLAGGED' && (
                          <div className="absolute top-4 right-4">
                            <Badge variant="destructive">FLAGGED</Badge>
                          </div>
                        )}
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shop" className="space-y-4">
              <div className="space-y-4">
                {visits
                  .filter(v => !visitResponsesMap[v.id] || visitResponsesMap[v.id]?.visit_type === 'customer')
                  .map((visit) => {
                    const visitData = formatVisitData(
                      visit,
                      visitResponsesMap[visit.id],
                      shopsMap[visit.shop_id]
                    );
                    
                    if (!visitData) return null;

                    return (
                      <div key={visit.id} className="relative">
                        <VisitDetails visit={visitData} />
                        {visit.status === 'FLAGGED' && (
                          <div className="absolute top-4 right-4">
                            <Badge variant="destructive">FLAGGED</Badge>
                          </div>
                        )}
                      </div>
                    );
                  }).filter(Boolean)}
              </div>
            </TabsContent>

            <TabsContent value="individual" className="space-y-4">
              <div className="space-y-4">
                {visits
                  .filter(v => visitResponsesMap[v.id]?.visit_type === 'individual')
                  .map((visit) => {
                    const visitData = formatVisitData(
                      visit,
                      visitResponsesMap[visit.id],
                      shopsMap[visit.shop_id]
                    );
                    
                    if (!visitData) return null;

                    return (
                      <div key={visit.id} className="relative">
                        <VisitDetails visit={visitData} />
                        {visit.status === 'FLAGGED' && (
                          <div className="absolute top-4 right-4">
                            <Badge variant="destructive">FLAGGED</Badge>
                          </div>
                        )}
                      </div>
                    );
                  }).filter(Boolean)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitLog;
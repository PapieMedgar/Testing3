import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI, CheckIn, API_BASE_URL } from '@/lib/api';
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { format } from 'date-fns';

import { MapPin, Store, Calendar, User, FileText, Tag, Box, Loader2 } from 'lucide-react';

interface AgentVisitHistoryProps {
  agentId: number;
}

export const AgentVisitHistory = ({ agentId }: AgentVisitHistoryProps) => {
  const [selectedVisit, setSelectedVisit] = useState<CheckIn | null>(null);
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);

  const { data: visits, isLoading } = useQuery({
    queryKey: ['agent-visits', agentId],
    queryFn: () => adminAPI.getAgentVisits(agentId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!visits || visits.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No visits found for this agent.</p>
        </CardContent>
      </Card>
    );
  }

  // Group visits by type
  // Determine shop visits by either visit_type or presence of shop object
  const shopVisits = visits.filter(visit =>
    (visit.visit_response?.visit_type === 'customer') ||
    (visit.shop_id && visit.shop)
  );

  // Individual visits are those that are not shop visits
  const individualVisits = visits.filter(visit =>
    (visit.visit_response?.visit_type === 'individual') ||
    (!visit.shop_id && !visit.shop)
  );

  const getStatusBadge = (status: string) => {
    // If status is "pending" (case insensitive), don't display a badge at all
    if (status.toLowerCase() === 'pending') {
      return null;
    }

    const statusMap: Record<string, { color: string, label: string }> = {
      'APPROVED': { color: 'bg-green-500', label: 'Approved' },
      'FLAGGED': { color: 'bg-red-500', label: 'Flagged' }
    };

    const statusInfo = statusMap[status.toUpperCase()] || { color: 'bg-gray-500', label: status };

    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatVisitDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'PPpp');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <>
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Visits ({visits.length})</TabsTrigger>
          <TabsTrigger value="shop">Shop Visits ({shopVisits.length})</TabsTrigger>
          <TabsTrigger value="individual">Individual Visits ({individualVisits.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visits.map(visit => (
              <VisitCard
                key={visit.id}
                visit={visit}
                onViewDetails={() => setSelectedVisit(visit)}
                getStatusBadge={getStatusBadge}
                formatVisitDate={formatVisitDate}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shop" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopVisits.map(visit => (
              <VisitCard
                key={visit.id}
                visit={visit}
                onViewDetails={() => setSelectedVisit(visit)}
                getStatusBadge={getStatusBadge}
                formatVisitDate={formatVisitDate}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="individual" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {individualVisits.map(visit => (
              <VisitCard
                key={visit.id}
                visit={visit}
                onViewDetails={() => setSelectedVisit(visit)}
                getStatusBadge={getStatusBadge}
                formatVisitDate={formatVisitDate}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Visit Details Dialog */}
      <Dialog open={!!selectedVisit} onOpenChange={(open) => !open && setSelectedVisit(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          {selectedVisit && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(selectedVisit.visit_response?.visit_type === 'customer' || (selectedVisit.shop_id && selectedVisit.shop)) ? (
                    <Store className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  {(selectedVisit.visit_response?.visit_type === 'customer' || (selectedVisit.shop_id && selectedVisit.shop))
                    ? `Shop Visit: ${selectedVisit.shop?.name || 'Unknown Shop'}`
                    : 'Individual Visit'}
                </DialogTitle>
                <DialogDescription>
                  {formatVisitDate(selectedVisit.timestamp)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Visit Details</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatVisitDate(selectedVisit.timestamp)}</span>
                      </div>
                      {selectedVisit.shop && (
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedVisit.shop.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedVisit.shop?.address ||
                            `${selectedVisit.latitude.toFixed(5)}, ${selectedVisit.longitude.toFixed(5)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVisit.notes || 'No notes provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Brand Information</h3>
                    <div className="space-y-2">
                      {selectedVisit.brand ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span>Brand: {selectedVisit.brand.name}</span>
                          </div>
                          {selectedVisit.category && (
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              <span>Category: {selectedVisit.category.name}</span>
                            </div>
                          )}
                          {selectedVisit.product && (
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-muted-foreground" />
                              <span>Product: {selectedVisit.product.name}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">No brand information available</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Visit Responses */}
                {selectedVisit.visit_response && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Visit Responses</h3>
                    <Card>
                      <CardContent className="p-4">
                        <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[400px]">
                          {JSON.stringify(selectedVisit.visit_response.responses, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {/* Photos */}
                {(selectedVisit.photo_base64 || selectedVisit.additional_photos_base64 || selectedVisit.photo_url || selectedVisit.additional_photos) && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Photos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {/* Main photo: prefer base64, fallback to url, then photo_path */}
                      {selectedVisit.photo_base64 ? (
                        <img
                          src={selectedVisit.photo_base64}
                          alt="Visit photo"
                          className="rounded-md object-cover h-[150px] w-full cursor-pointer border"
                          onClick={() => setFullscreenImg(selectedVisit.photo_base64)}
                        />
                      ) : selectedVisit.photo_url ? (
                        <img
                          src={selectedVisit.photo_url}
                          alt="Visit photo"
                          className="rounded-md object-cover h-[150px] w-full cursor-pointer border"
                          onClick={() => setFullscreenImg(selectedVisit.photo_url)}
                        />
                      ) : selectedVisit.photo_path ? (
                        <img
                          src={`/${selectedVisit.photo_path.replace(/^\/+/, '')}`}
                          alt="Visit photo"
                          className="rounded-md object-cover h-[150px] w-full cursor-pointer border"
                          onClick={() => setFullscreenImg(`/${selectedVisit.photo_path.replace(/^\/+/, '')}`)}
                        />
                      ) : null}
                      {/* Additional photos: prefer base64 array, fallback to url array */}
                      {selectedVisit.additional_photos_base64?.map((photo, index) => (
                        <img
                          key={`base64-${index}`}
                          src={photo}
                          alt={`Additional photo ${index + 1}`}
                          className="rounded-md object-cover h-[150px] w-full cursor-pointer border"
                          onClick={() => setFullscreenImg(photo)}
                        />
                      ))}
                      {selectedVisit.additional_photos?.map((photo, index) => (
                        <img
                          key={`url-${index}`}
                          src={photo}
                          alt={`Additional photo ${index + 1}`}
                          className="rounded-md object-cover h-[150px] w-full cursor-pointer border"
                          onClick={() => setFullscreenImg(photo)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Modal */}
      {fullscreenImg && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-90"
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold bg-black bg-opacity-40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 focus:outline-none"
            onClick={() => setFullscreenImg(null)}
            aria-label="Close image"
            type="button"
          >
            &times;
          </button>
          <img
            src={fullscreenImg}
            alt="Fullscreen visit photo"
            className="max-h-[90vh] max-w-[95vw] rounded shadow-lg border-2 border-white cursor-zoom-out"
            style={{ objectFit: 'contain' }}
            onClick={() => setFullscreenImg(null)}
          />
        </div>
      )}
    </>
  );
};
interface VisitCardProps {
  visit: CheckIn;
  onViewDetails: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  formatVisitDate: (timestamp: string) => string;
}

const VisitCard = ({ visit, onViewDetails, getStatusBadge, formatVisitDate }: VisitCardProps) => {
  // Determine if this is a shop visit based on having shop data or visit_type
  const isShopVisit = (visit.visit_response?.visit_type === 'customer') || (visit.shop_id && visit.shop);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-md">
            {isShopVisit 
              ? (visit.shop?.name || 'Shop Visit')
              : 'Individual Visit'}
          </CardTitle>
          {getStatusBadge(visit.status)}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatVisitDate(visit.timestamp)}</span>
          </div>
          
          {visit.shop && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{visit.shop.address}</span>
            </div>
          )}
          
          {visit.brand && (
            <div className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{visit.brand.name}</span>
              {visit.product && <span> - {visit.product.name}</span>}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={onViewDetails}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

import { Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { VisitResponseView } from "@/components/ui/visit-response-view"
import type { Shop, VisitResponse } from "@/lib/api"

interface VisitListProps {
  visits: Array<{
    id: number
    shop_id: number
    timestamp: string
    notes?: string
    status: string
  }>
  responses: Record<number, VisitResponse | undefined>
  shops: Record<number, Shop | undefined>
}

export function VisitList({ visits, responses, shops }: VisitListProps) {
  return (
    <div className="space-y-4">
      {visits.map((visit) => {
        const response = responses[visit.id];
        return (
          <div key={visit.id} className="p-4 border rounded-lg">
            <div className="grid grid-cols-[1fr,auto] gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium truncate">
                    {response?.visit_type === 'individual' ? 'Individual Visit' : shops[visit.shop_id]?.name || `Shop ID: ${visit.shop_id}`}
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  {response?.visit_type !== 'individual' && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{shops[visit.shop_id]?.address || 'Address not available'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(visit.timestamp).toLocaleString()}
                  </div>
                </div>
                {visit.notes && (
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Notes:</strong> {visit.notes}
                  </p>
                )}
                {/* Display visit type and response info if available */}
                {response && (
                  <div className="bg-gray-50 border rounded text-sm">
                    <div className="flex items-center justify-between p-2 border-b">
                      <div className="font-medium text-gray-700">
                        {response.visit_type === 'individual' ? 'Individual Visit' : 'Customer Visit'}
                        <span className="text-gray-400 ml-2">
                          {new Date(response.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="p-2">
                      <VisitResponseView 
                        data={response.responses}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="shrink-0">
                {visit.status === 'FLAGGED' && (
                  <Badge variant="destructive">FLAGGED</Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

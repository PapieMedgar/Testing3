import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIn } from '@/lib/api';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface VisitListProps {
  visits: CheckIn[];
  onStatusChange?: (visitId: number, newStatus: string) => void;
}

export const VisitList = ({ visits, onStatusChange }: VisitListProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'bg-green-500';
      case 'FLAGGED':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {visits.map((visit) => (
        <Card key={visit.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  {visit.shop?.name || 'Unknown Shop'}
                </CardTitle>
                <CardDescription>
                  {visit.shop?.address || 'No address'}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(visit.status)}>
                {visit.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Agent:</span> {visit.agent?.name || visit.agent?.phone || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Manager:</span> {visit.manager?.name || visit.manager?.phone || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Visit Time:</span>{' '}
                {format(new Date(visit.timestamp), 'PPpp')}
              </div>
              {visit.notes && (
                <div>
                  <span className="font-medium">Notes:</span> {visit.notes}
                </div>
              )}
            </div>
          </CardContent>
          {onStatusChange && (
            <CardFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(visit.id, 'APPROVED')}
                disabled={visit.status === 'APPROVED'}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(visit.id, 'FLAGGED')}
                disabled={visit.status === 'FLAGGED'}
              >
                Flag
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
};
